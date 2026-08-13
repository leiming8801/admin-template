import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Member, PageResult } from '@admin-template/shared';
import { UpdateMemberDto } from './dto/update-member.dto';
import { formatDate } from '../../common/utils/format';

/** 会员列表查询参数 */
export interface MemberListQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  phone?: string;
  status?: number;
}

/**
 * 会员管理服务 - 会员列表、详情、编辑、状态管理、删除
 */
@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  /** 分页查询会员列表 */
  async findAll(query: MemberListQuery): Promise<PageResult<Member>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.username && { username: { contains: query.username } }),
      ...(query.phone && { phone: { contains: query.phone } }),
      ...(query.status !== undefined && { status: Number(query.status) }),
    };

    const [list, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ id: 'asc' }],
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      list: list.map((m) => this.toMemberType(m)),
      total,
      page,
      pageSize,
    };
  }

  /** 获取会员详情 */
  async findOne(id: number): Promise<Member> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!member) {
      throw new NotFoundException('member.notFound');
    }
    return this.toMemberType(member);
  }

  /** 编辑会员信息 */
  async update(id: number, dto: UpdateMemberDto): Promise<Member> {
    const existing = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('member.notFound');
    }

    // 校验手机号唯一性（排除自身）
    if (dto.phone && dto.phone !== existing.phone) {
      const duplicate = await this.prisma.member.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('member.phoneExists');
      }
    }

    // 校验邮箱唯一性（排除自身）
    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.member.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('member.emailExists');
      }
    }

    const member = await this.prisma.member.update({
      where: { id },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar || null }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.remark !== undefined && { remark: dto.remark || null }),
      },
    });

    return this.toMemberType(member);
  }

  /** 修改会员状态 */
  async updateStatus(id: number, status: number): Promise<void> {
    const existing = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('member.notFound');
    }

    await this.prisma.member.update({
      where: { id },
      data: { status },
    });
  }

  /** 删除会员 */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.member.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('member.notFound');
    }

    await this.prisma.member.delete({ where: { id } });
  }

  /** 将 Prisma 记录转换为 Member 类型 */
  private toMemberType(record: {
    id: number;
    username: string | null;
    nickname: string | null;
    phone: string | null;
    email: string | null;
    avatar: string | null;
    gender: number | null;
    status: number;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    remark: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Member {
    return {
      id: record.id,
      username: record.username || undefined,
      nickname: record.nickname || undefined,
      phone: record.phone || undefined,
      email: record.email || undefined,
      avatar: record.avatar || undefined,
      gender: record.gender ?? undefined,
      status: record.status,
      lastLoginAt: formatDate(record.lastLoginAt),
      lastLoginIp: record.lastLoginIp || undefined,
      remark: record.remark || undefined,
      createdAt: formatDate(record.createdAt),
      updatedAt: formatDate(record.updatedAt),
    };
  }
}
