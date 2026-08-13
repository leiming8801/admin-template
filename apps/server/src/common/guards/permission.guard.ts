import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 权限守卫，校验当前用户是否拥有所需权限码
 * 需配合 @RequirePermission 装饰器使用
 */
@Injectable()
export class PermissionGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 无 @RequirePermission 装饰器，直接放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('auth.noPermission');
    }

    // 查询用户拥有的权限码
    const userPermissions = await this.getUserPermissions(userId);

    // 超级管理员直接放行
    const userRoles = await this.getUserRoleCodes(userId);
    if (userRoles.includes('super_admin')) {
      return true;
    }

    // 检查是否拥有任一所需权限
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('auth.noPermission');
    }

    return true;
  }

  /** 查询用户的角色编码列表（仅启用角色） */
  private async getUserRoleCodes(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.adminUserRole.findMany({
      where: { userId, role: { status: 1 } },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.code);
  }

  /** 查询用户拥有的权限码列表（仅启用角色） */
  private async getUserPermissions(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.adminUserRole.findMany({
      where: { userId, role: { status: 1 } },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissionCodes = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        if (rp.permission.permission) {
          permissionCodes.add(rp.permission.permission);
        }
      }
    }

    return Array.from(permissionCodes);
  }
}
