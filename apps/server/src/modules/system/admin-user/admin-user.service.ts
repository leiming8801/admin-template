import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminUser, PageResult } from '@admin-template/shared';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { formatDate } from '../../../common/utils/format';
import { AuthSessionService } from '../../auth/auth-session.service';

/** 后台用户列表查询参数 */
export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
  roleId?: number;
}

/** 受保护的超级管理员用户名 */
const PROTECTED_USERNAME = 'admin';

/**
 * 后台用户管理服务 - 用户 CRUD、角色分配、密码重置、状态管理
 */
@Injectable()
export class AdminUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  /** 分页查询用户列表 */
  async findAll(query: AdminUserListQuery): Promise<PageResult<AdminUser>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.username && { username: { contains: query.username } }),
      ...(query.status !== undefined && { status: Number(query.status) }),
      ...(query.roleId && {
        roles: { some: { roleId: Number(query.roleId) } },
      }),
    };

    const [list, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ id: 'asc' }],
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.adminUser.count({ where }),
    ]);

    return {
      list: list.map((u) => this.toAdminUserType(u)),
      total,
      page,
      pageSize,
    };
  }

  /** 获取用户详情（含已分配角色ID列表） */
  async findOne(id: number): Promise<AdminUser & { roleIds: number[] }> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    return {
      ...this.toAdminUserType(user),
      roleIds: user.roles.map((ur) => ur.roleId),
    };
  }

  /** 创建用户 */
  async create(dto: CreateAdminUserDto): Promise<AdminUser> {
    // 校验用户名唯一性
    const existingUsername = await this.prisma.adminUser.findFirst({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('system.adminUser.usernameExists');
    }

    // 校验邮箱唯一性
    if (dto.email) {
      const existingEmail = await this.prisma.adminUser.findFirst({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('system.adminUser.emailExists');
      }
    }

    // 校验手机号唯一性
    if (dto.phone) {
      const existingPhone = await this.prisma.adminUser.findFirst({
        where: { phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('system.adminUser.phoneExists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.adminUser.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname,
        email: dto.email || null,
        phone: dto.phone || null,
        avatar: dto.avatar || null,
        status: dto.status ?? 1,
        remark: dto.remark || null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.toAdminUserType(user);
  }

  /** 更新用户 */
  async update(id: number, dto: UpdateAdminUserDto): Promise<AdminUser> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    // 校验邮箱唯一性（排除自身）
    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.adminUser.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.adminUser.emailExists');
      }
    }

    // 校验手机号唯一性（排除自身）
    if (dto.phone && dto.phone !== existing.phone) {
      const duplicate = await this.prisma.adminUser.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.adminUser.phoneExists');
      }
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.adminUser.update({
        where: { id },
        data: {
          ...(dto.nickname !== undefined && { nickname: dto.nickname }),
          ...(dto.email !== undefined && { email: dto.email || null }),
          ...(dto.phone !== undefined && { phone: dto.phone || null }),
          ...(dto.avatar !== undefined && { avatar: dto.avatar || null }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.remark !== undefined && { remark: dto.remark || null }),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
      if (dto.status === 0) {
        await this.authSessionService.revokeAllUserSessions(
          id,
          'user_disabled',
          tx,
        );
      }
      return updated;
    });

    return this.toAdminUserType(user);
  }

  /** 删除用户 */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    // 保护超级管理员不被删除
    if (existing.username === PROTECTED_USERNAME) {
      throw new BadRequestException('system.adminUser.cannotDeleteAdmin');
    }

    // 删除用户（关联的 admin_user_role 会被级联删除）
    await this.prisma.adminUser.delete({ where: { id } });
  }

  /** 给用户分配角色 */
  async assignRoles(id: number, roleIds: number[]): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    // 校验角色ID是否有效
    if (roleIds.length > 0) {
      const validRoles = await this.prisma.role.findMany({
        where: { id: { in: roleIds }, status: 1 },
        select: { id: true },
      });
      if (validRoles.length !== roleIds.length) {
        throw new BadRequestException('system.adminUser.invalidRoles');
      }
    }

    // 删除旧关联，创建新关联（事务保证一致性）
    await this.prisma.$transaction([
      this.prisma.adminUserRole.deleteMany({ where: { userId: id } }),
      ...roleIds.map((roleId) =>
        this.prisma.adminUserRole.create({
          data: { userId: id, roleId },
        }),
      ),
    ]);
  }

  /** 重置密码 */
  async resetPassword(id: number, password: string): Promise<void> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id },
        data: { password: hashedPassword },
      });
      await this.authSessionService.revokeAllUserSessions(
        id,
        'password_reset',
        tx,
      );
    });
  }

  /** 修改状态 */
  async updateStatus(id: number, status: number): Promise<void> {
    const existing = await this.prisma.adminUser.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.adminUser.notFound');
    }

    // 保护超级管理员不被禁用
    if (existing.username === PROTECTED_USERNAME && status === 0) {
      throw new BadRequestException('system.adminUser.cannotDisableAdmin');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id },
        data: { status },
      });
      if (status === 0) {
        await this.authSessionService.revokeAllUserSessions(
          id,
          'user_disabled',
          tx,
        );
      }
    });
  }

  /** 将 Prisma 记录转换为 AdminUser 类型 */
  private toAdminUserType(record: {
    id: number;
    username: string;
    nickname: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    status: number;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    remark: string | null;
    roles: { role: {
      id: number;
      name: string;
      code: string;
      sort: number;
      status: number;
      remark: string | null;
      createdAt: Date;
      updatedAt: Date;
    } }[];
    createdAt: Date;
    updatedAt: Date;
  }): AdminUser {
    return {
      id: record.id,
      username: record.username,
      nickname: record.nickname,
      email: record.email || undefined,
      phone: record.phone || undefined,
      avatar: record.avatar || undefined,
      status: record.status,
      lastLoginAt: formatDate(record.lastLoginAt),
      lastLoginIp: record.lastLoginIp || undefined,
      remark: record.remark || undefined,
      roles: record.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        sort: ur.role.sort,
        status: ur.role.status,
        remark: ur.role.remark || undefined,
        createdAt: formatDate(ur.role.createdAt),
        updatedAt: formatDate(ur.role.updatedAt),
      })),
      createdAt: formatDate(record.createdAt),
      updatedAt: formatDate(record.updatedAt),
    };
  }
}
