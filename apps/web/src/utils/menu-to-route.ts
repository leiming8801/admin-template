import type { RouteRecordRaw } from 'vue-router';
import { DEFAULT_LAYOUT } from '@/router/routes/base';
import type { MenuItem } from '@admin-template/shared';

// 预加载所有视图组件，用于动态路由注册
const viewModules = import.meta.glob('@/views/**/*.vue');

/** 根据组件路径加载视图组件 */
function loadComponent(component: string) {
  const path = `/src/views/${component}.vue`;
  return viewModules[path];
}

/** 从 i18n key 或路径生成唯一的路由名称 */
function generateRouteName(menu: MenuItem): string {
  // 从 i18n key 生成，如 "menu.system.adminUser" → "SystemAdminUser"
  const parts = menu.name.split('.');
  if (parts.length > 1) {
    return parts
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
  // 从路径生成，如 "/system/role" → "systemRole"
  return menu.path
    .split('/')
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join('');
}

/** 递归将菜单项转换为路由记录 */
function transformMenuToRoute(menu: MenuItem, isRoot = false): RouteRecordRaw {
  const hasComponent = menu.component
    ? loadComponent(menu.component)
    : undefined;

  let children = menu.children?.length
    ? menu.children
        .filter((child) => child.path)
        .map((child) => transformMenuToRoute(child, false))
        .filter((route) => route.component || route.children?.length)
    : [];

  // 一级菜单使用 DEFAULT_LAYOUT 作为容器
  const component = isRoot || !hasComponent ? DEFAULT_LAYOUT : hasComponent;

  // 一级菜单有 component 但没有 children 时，将 component 作为默认子路由
  // 同时设置 hideChildrenInMenu，让菜单把该项当作叶子节点（不展开子菜单）
  // 添加 redirect 确保通过 name 导航到父路由时也能正确渲染子路由内容
  let hideChildrenInMenu = false;
  let redirect: RouteRecordRaw['redirect'] = undefined;
  if (isRoot && hasComponent && children.length === 0) {
    hideChildrenInMenu = true;
    const childName = `${generateRouteName(menu)}Index`;
    redirect = { name: childName } as RouteRecordRaw['redirect'];
    children = [
      {
        path: '',
        name: childName,
        component: hasComponent,
        meta: {
          locale: menu.name,
          requiresAuth: true,
          roles: ['*'],
          hideInMenu: true,
        },
      } as RouteRecordRaw,
    ];
  }

  return {
    path: menu.path,
    name: generateRouteName(menu),
    component: component as RouteRecordRaw['component'],
    ...(redirect && { redirect }),
    meta: {
      locale: menu.name,
      requiresAuth: true,
      roles: ['*'],
      ...(hideChildrenInMenu && { hideChildrenInMenu: true }),
      ...(menu.icon && { icon: menu.icon }),
    },
    ...(children.length && { children }),
  } as RouteRecordRaw;
}

/** 将后端菜单树批量转换为 Vue Router 路由 */
export function transformMenusToRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  return menus
    .filter((menu) => menu.path)
    .map((menu) => transformMenuToRoute(menu, true));
}
