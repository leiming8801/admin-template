import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role, RoleListItem, PageResult } from '@admin-template/shared';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { formatDate } from '../../../common/utils/format';

/** 角色列表查询参数 */
export interface RoleListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  code?: string;
  status?: number;
}

/**
 * 角色管理服务 - 角色 CRUD、权限分配
 */
@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  /** 分页查询角色列表（含绑定用户信息） */
  async findAll(query: RoleListQuery): Promise<PageResult<RoleListItem>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.name && { name: { contains: query.name } }),
      ...(query.code && { code: { contains: query.code } }),
      ...(query.status !== undefined && { status: Number(query.status) }),
    };

    const [list, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        include: {
          users: {
            include: {
              user: {
                select: { id: true, username: true, nickname: true },
              },
            },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      list: list.map((r) => ({
        ...this.toRoleType(r),
        users: r.users.map((ur) => ({
          id: ur.user.id,
          username: ur.user.username,
          nickname: ur.user.nickname,
        })),
      })),
      total,
      page,
      pageSize,
    };
  }

  /** 获取所有启用角色（下拉选择用） */
  async findAllForSelect(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { status: 1 },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
    return roles.map((r) => this.toRoleType(r));
  }

  /** 获取角色详情（含已分配权限列表） */
  async findOne(id: number): Promise<Role & { permissionIds: number[] }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { select: { permissionId: true } },
      },
    });
    if (!role) {
      throw new NotFoundException('system.role.notFound');
    }

    return {
      ...this.toRoleType(role),
      permissionIds: role.permissions.map((rp) => rp.permissionId),
    };
  }

  /** 创建角色 */
  async create(dto: CreateRoleDto): Promise<Role> {
    // 校验名称唯一性
    const existingName = await this.prisma.role.findFirst({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException('system.role.nameExists');
    }

    // 确定角色编码：用户填写则校验唯一性，留空则自动生成
    const code = dto.code?.trim()
      ? await this.resolveCode(dto.code.trim())
      : await this.generateUniqueCode();

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code,
        sort: dto.sort ?? 0,
        status: dto.status ?? 1,
        remark: dto.remark || null,
      },
    });

    return this.toRoleType(role);
  }

  /** 校验用户填写的角色编码唯一性，返回该编码 */
  private async resolveCode(code: string): Promise<string> {
    const existingCode = await this.prisma.role.findFirst({
      where: { code },
    });
    if (existingCode) {
      throw new ConflictException('system.role.codeExists');
    }
    return code;
  }

  /**
   * 生成唯一的角色编码（用户未填写时使用）
   * 规则：role_ + 时间戳 base36 + 4 位随机字符
   */
  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = `role_${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const exists = await this.prisma.role.findFirst({ where: { code } });
      if (!exists) return code;
    }
    throw new ConflictException('system.role.codeExists');
  }

  /** 更新角色 */
  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('system.role.notFound');
    }

    // 校验名称唯一性（排除自身）
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.role.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.role.nameExists');
      }
    }

    // 校验编码唯一性（排除自身）
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.role.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.role.codeExists');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.sort !== undefined && { sort: dto.sort }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.remark !== undefined && { remark: dto.remark || null }),
      },
    });

    return this.toRoleType(role);
  }

  /** 删除角色 */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('system.role.notFound');
    }

    // 检查是否已分配给用户
    const userCount = await this.prisma.adminUserRole.count({
      where: { roleId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException('system.role.inUse');
    }

    // 删除角色（关联的 role_permission 会被级联删除）
    await this.prisma.role.delete({ where: { id } });
  }

  /** 给角色分配权限 */
  async assignPermissions(id: number, permissionIds: number[]): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('system.role.notFound');
    }

    // 删除旧关联，创建新关联（事务保证一致性）
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      ...permissionIds.map((permissionId) =>
        this.prisma.rolePermission.create({
          data: { roleId: id, permissionId },
        }),
      ),
    ]);
  }

  /** 将 Prisma 记录转换为 Role 类型 */
  private toRoleType(record: {
    id: number;
    name: string;
    code: string;
    sort: number;
    status: number;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Role {
    return {
      id: record.id,
      name: record.name,
      code: record.code,
      sort: record.sort,
      status: record.status,
      remark: record.remark || undefined,
      createdAt: formatDate(record.createdAt),
      updatedAt: formatDate(record.updatedAt),
    };
  }
}
