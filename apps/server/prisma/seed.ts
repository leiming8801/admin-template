import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** 权限种子定义。parentName 用于第二轮建立父子关系 */
type PermissionDef = {
  name: string;
  type: number;
  permission?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  parentName?: string;
};

async function main() {
  console.log('开始种子数据初始化...');

  // 1. 创建超级管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  let admin = await prisma.adminUser.findFirst({
    where: { username: 'admin' },
  });
  if (!admin) {
    admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        status: 1,
      },
    });
  }
  console.log(`管理员用户: ${admin.username} (id=${admin.id})`);

  // 2. 创建角色
  let superAdminRole = await prisma.role.findFirst({
    where: { code: 'super_admin' },
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: '超级管理员',
        code: 'super_admin',
        sort: 1,
        status: 1,
      },
    });
  }

  let operatorRole = await prisma.role.findFirst({
    where: { code: 'operator' },
  });
  if (!operatorRole) {
    operatorRole = await prisma.role.create({
      data: {
        name: '运营专员',
        code: 'operator',
        sort: 2,
        status: 1,
      },
    });
  }
  console.log(`角色: ${superAdminRole.code}, ${operatorRole.code}`);

  // 3. 增量同步权限（菜单+按钮）— name 字段存储 i18n key
  const permissionDefs: PermissionDef[] = [
    // 一级菜单 - 工作台
    { name: 'menu.dashboard', type: 1, path: '/dashboard', component: 'dashboard/index', icon: 'layout-dashboard', sort: 1, parentName: '' },

    // 系统管理
    { name: 'menu.system', type: 1, path: '/system', icon: 'settings', sort: 3, parentName: '' },
    { name: 'menu.system.adminUser', type: 1, path: '/system/admin-user', component: 'system/admin-user/index', permission: 'system:user:view', sort: 1, parentName: 'menu.system' },
    { name: 'menu.system.adminUser.add', type: 2, permission: 'system:user:add', sort: 1, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.adminUser.edit', type: 2, permission: 'system:user:edit', sort: 2, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.adminUser.delete', type: 2, permission: 'system:user:delete', sort: 3, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.role', type: 1, path: '/system/role', component: 'system/role/index', permission: 'system:role:view', sort: 2, parentName: 'menu.system' },
    { name: 'menu.system.role.add', type: 2, permission: 'system:role:add', sort: 1, parentName: 'menu.system.role' },
    { name: 'menu.system.role.edit', type: 2, permission: 'system:role:edit', sort: 2, parentName: 'menu.system.role' },
    { name: 'menu.system.role.delete', type: 2, permission: 'system:role:delete', sort: 3, parentName: 'menu.system.role' },
    { name: 'menu.system.permission', type: 1, path: '/system/permission', component: 'system/permission/index', permission: 'system:permission:view', sort: 3, parentName: 'menu.system' },
    { name: 'menu.system.permission.add', type: 2, permission: 'system:permission:add', sort: 1, parentName: 'menu.system.permission' },
    { name: 'menu.system.permission.edit', type: 2, permission: 'system:permission:edit', sort: 2, parentName: 'menu.system.permission' },
    { name: 'menu.system.permission.delete', type: 2, permission: 'system:permission:delete', sort: 3, parentName: 'menu.system.permission' },

    // 个人设置 - 独立顶级菜单，所有用户默认可访问
    { name: 'menu.profile', type: 1, path: '/profile', component: 'system/profile/index', icon: 'circle-user', sort: 99, parentName: '' },

    // 会员管理
    { name: 'menu.member', type: 1, path: '/member', icon: 'users', sort: 2, parentName: '' },
    { name: 'menu.member.list', type: 1, path: '/member/list', component: 'member/index', permission: 'member:view', sort: 1, parentName: 'menu.member' },
    { name: 'menu.member.edit', type: 2, permission: 'member:edit', sort: 2, parentName: 'menu.member.list' },
    { name: 'menu.member.delete', type: 2, permission: 'member:delete', sort: 3, parentName: 'menu.member.list' },
  ];

  // 增量同步：按 name 匹配后 update / create。
  // Permission.name 没有唯一约束，故不用 upsert；也不做 deleteMany ——
  // 清空重建会连带删掉管理员手动创建的权限，并清掉所有角色的授权记录。
  const permissionMap = new Map<string, number>();

  for (const def of permissionDefs) {
    const data = {
      type: def.type,
      permission: def.permission || null,
      path: def.path || null,
      component: def.component || null,
      icon: def.icon || null,
      sort: def.sort || 0,
      visible: 1,
    };
    const existing = await prisma.permission.findFirst({
      where: { name: def.name },
    });
    const record = existing
      ? await prisma.permission.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.permission.create({
          data: { ...data, parentId: 0, name: def.name },
        });
    permissionMap.set(def.name, record.id);
  }

  // 更新 parent-child 关系
  for (const def of permissionDefs) {
    if (def.parentName && permissionMap.has(def.parentName)) {
      await prisma.permission.update({
        where: { id: permissionMap.get(def.name)! },
        data: { parentId: permissionMap.get(def.parentName)! },
      });
    }
  }
  console.log(`权限同步: ${permissionDefs.length} 条（增量，已存在则更新）`);

  // 4. 关联 super_admin 角色 → 所有权限（已绑定的跳过，不影响其他角色的授权）
  const allPermissions = await prisma.permission.findMany();
  const { count: newBindings } = await prisma.rolePermission.createMany({
    data: allPermissions.map((perm) => ({
      roleId: superAdminRole.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });
  console.log(
    `角色 ${superAdminRole.code} 共 ${allPermissions.length} 个权限，本次新增绑定 ${newBindings} 条`
  );

  // 5. 关联 admin 用户 → super_admin 角色
  const existingRelation = await prisma.adminUserRole.findFirst({
    where: { userId: admin.id, roleId: superAdminRole.id },
  });
  if (!existingRelation) {
    await prisma.adminUserRole.create({
      data: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    });
  }
  console.log(`用户 ${admin.username} 关联了角色 ${superAdminRole.code}`);

  // 6. 创建默认会员
  const memberPassword = await bcrypt.hash('member123', 10);
  let member = await prisma.member.findFirst({
    where: { username: 'demo_member' },
  });
  if (!member) {
    member = await prisma.member.create({
      data: {
        username: 'demo_member',
        nickname: '体验会员',
        phone: '13800138000',
        email: 'member@example.com',
        password: memberPassword,
        gender: 1,
        status: 1,
        remark: '种子数据初始化的测试会员',
      },
    });
  }
  console.log(`会员: ${member.username} (id=${member.id})`);

  console.log('种子数据初始化完成!');
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
