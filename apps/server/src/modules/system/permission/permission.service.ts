import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Permission } from '@admin-template/shared';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { formatDate } from '../../../common/utils/format';

/**
 * 权限管理服务 - 权限树查询、增删改
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** 获取权限树 */
  async getTree(): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });

    return this.buildTree(permissions);
  }

  /** 创建权限 */
  async create(dto: CreatePermissionDto): Promise<Permission> {
    // 校验名称唯一性
    const existingName = await this.prisma.permission.findFirst({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException('system.permission.nameExists');
    }

    // 校验权限标识唯一性（如果提供了）
    if (dto.permission) {
      const existingCode = await this.prisma.permission.findFirst({
        where: { permission: dto.permission },
      });
      if (existingCode) {
        throw new ConflictException('system.permission.codeExists');
      }
    }

    // 校验父ID是否存在（非根节点）
    if (dto.parentId && dto.parentId > 0) {
      const parent = await this.prisma.permission.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('system.permission.notFound');
      }
    }

    const record = await this.prisma.permission.create({
      data: {
        parentId: dto.parentId || 0,
        name: dto.name,
        type: dto.type,
        permission: dto.permission || null,
        path: dto.path || null,
        component: dto.component || null,
        icon: dto.icon || null,
        sort: dto.sort ?? 0,
        visible: dto.visible ?? 1,
      },
    });

    return this.toPermissionType(record);
  }

  /** 更新权限 */
  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const existing = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.permission.notFound');
    }

    // 校验名称唯一性（排除自身）
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.permission.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.permission.nameExists');
      }
    }

    // 校验权限标识唯一性（排除自身）
    if (dto.permission && dto.permission !== existing.permission) {
      const duplicate = await this.prisma.permission.findFirst({
        where: { permission: dto.permission, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException('system.permission.codeExists');
      }
    }

    // 校验父ID是否存在
    if (dto.parentId !== undefined && dto.parentId > 0) {
      if (dto.parentId === id) {
        throw new BadRequestException('system.permission.notFound');
      }
      const parent = await this.prisma.permission.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('system.permission.notFound');
      }
    }

    const record = await this.prisma.permission.update({
      where: { id },
      data: {
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.name && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.permission !== undefined && {
          permission: dto.permission || null,
        }),
        ...(dto.path !== undefined && { path: dto.path || null }),
        ...(dto.component !== undefined && {
          component: dto.component || null,
        }),
        ...(dto.icon !== undefined && { icon: dto.icon || null }),
        ...(dto.sort !== undefined && { sort: dto.sort }),
        ...(dto.visible !== undefined && { visible: dto.visible }),
      },
    });

    return this.toPermissionType(record);
  }

  /** 删除权限 */
  async remove(id: number): Promise<void> {
    const existing = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('system.permission.notFound');
    }

    // 检查是否有子权限
    const childCount = await this.prisma.permission.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException('system.permission.hasChildren');
    }

    // 删除关联的角色-权限关系（级联删除由 Prisma onDelete: Cascade 处理）
    await this.prisma.permission.delete({ where: { id } });
  }

  /** 将 Prisma 记录数组构建为树形结构 */
  private buildTree(
    permissions: Array<{
      id: number;
      parentId: number;
      name: string;
      type: number;
      permission: string | null;
      path: string | null;
      component: string | null;
      icon: string | null;
      sort: number;
      visible: number;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ): Permission[] {
    const map = new Map<number, Permission & { parentId: number }>();

    for (const p of permissions) {
      map.set(p.id, {
        id: p.id,
        parentId: p.parentId,
        name: p.name,
        type: p.type,
        permission: p.permission || undefined,
        path: p.path || undefined,
        component: p.component || undefined,
        icon: p.icon || undefined,
        sort: p.sort,
        visible: p.visible,
        createdAt: formatDate(p.createdAt),
        updatedAt: formatDate(p.updatedAt),
        children: [],
      });
    }

    const tree: Permission[] = [];
    for (const item of map.values()) {
      if (item.parentId === 0) {
        tree.push(item);
      } else {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children!.push(item);
        } else {
          tree.push(item);
        }
      }
    }

    // 清理空 children
    const cleanTree = (items: Permission[]) => {
      for (const item of items) {
        if (item.children && item.children.length === 0) {
          delete item.children;
        }
        if (item.children) {
          cleanTree(item.children);
        }
      }
    };
    cleanTree(tree);

    return tree;
  }

  /** 将 Prisma 记录转换为 Permission 类型 */
  private toPermissionType(record: {
    id: number;
    parentId: number;
    name: string;
    type: number;
    permission: string | null;
    path: string | null;
    component: string | null;
    icon: string | null;
    sort: number;
    visible: number;
    createdAt: Date;
    updatedAt: Date;
  }): Permission {
    return {
      id: record.id,
      parentId: record.parentId,
      name: record.name,
      type: record.type,
      permission: record.permission || undefined,
      path: record.path || undefined,
      component: record.component || undefined,
      icon: record.icon || undefined,
      sort: record.sort,
      visible: record.visible,
      createdAt: formatDate(record.createdAt),
      updatedAt: formatDate(record.updatedAt),
    };
  }
}
