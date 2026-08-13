import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  // 3. 创建权限（菜单+按钮）— name 字段存储 i18n key
  const permissionDefs = [
    // 一级菜单 - 工作台
    { name: 'menu.dashboard', type: 1, path: '/dashboard', component: 'dashboard/index', icon: 'iconpark:dashboard', sort: 1, parentName: '' },

    // 系统管理
    { name: 'menu.system', type: 1, path: '/system', icon: 'iconpark:setting-one', sort: 3, parentName: '' },
    { name: 'menu.system.adminUser', type: 1, path: '/system/admin-user', component: 'system/admin-user/index', permission: 'system:user:view', sort: 1, parentName: 'menu.system' },
    { name: 'menu.system.adminUser.add', type: 2, permission: 'system:user:add', sort: 1, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.adminUser.edit', type: 2, permission: 'system:user:edit', sort: 2, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.adminUser.delete', type: 2, permission: 'system:user:delete', sort: 3, parentName: 'menu.system.adminUser' },
    { name: 'menu.system.role', type: 1, path: '/system/role', component: 'system/role/index', permission: 'system:role:view', sort: 2, parentName: 'menu.system' },
    { name: 'menu.system.permission', type: 1, path: '/system/permission', component: 'system/permission/index', permission: 'system:permission:view', sort: 3, parentName: 'menu.system' },

    // 个人设置 - 独立顶级菜单，所有用户默认可访问
    { name: 'menu.profile', type: 1, path: '/profile', component: 'system/profile/index', icon: 'iconpark:avatar', sort: 99, parentName: '' },

    // 会员管理
    { name: 'menu.member', type: 1, path: '/member', icon: 'iconpark:peoples-two', sort: 2, parentName: '' },
    { name: 'menu.member.list', type: 1, path: '/member/list', component: 'member/index', permission: 'member:view', sort: 1, parentName: 'menu.member' },
    { name: 'menu.member.edit', type: 2, permission: 'member:edit', sort: 2, parentName: 'menu.member.list' },
    { name: 'menu.member.delete', type: 2, permission: 'member:delete', sort: 3, parentName: 'menu.member.list' },
  ];

  // 先删除旧权限（清理重建）
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();

  // 分两轮：先创建所有记录（parentId=0），再更新 parent 关系
  const permissionMap = new Map<string, number>();

  for (const def of permissionDefs) {
    const record = await prisma.permission.create({
      data: {
        parentId: 0,
        name: def.name,
        type: def.type,
        permission: def.permission || null,
        path: def.path || null,
        component: def.component || null,
        icon: def.icon || null,
        sort: def.sort || 0,
        visible: 1,
      },
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
  console.log(`权限创建: ${permissionDefs.length} 条`);

  // 4. 关联 super_admin 角色 → 所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`角色 ${superAdminRole.code} 关联了 ${allPermissions.length} 个权限`);

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
