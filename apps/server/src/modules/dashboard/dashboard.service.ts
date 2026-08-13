import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStats } from '@admin-template/shared';

/**
 * 工作台服务 - 提供统计数据
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取工作台统计数据 */
  async getStats(): Promise<DashboardStats> {
    const [adminUserCount, roleCount, permissionCount, memberCount] =
      await Promise.all([
        this.prisma.adminUser.count(),
        this.prisma.role.count(),
        this.prisma.permission.count(),
        this.prisma.member.count(),
      ]);

    return {
      adminUserCount,
      roleCount,
      permissionCount,
      memberCount,
    };
  }
}
