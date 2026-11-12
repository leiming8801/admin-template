import type { RouteRecordRaw } from 'vue-router';
import { RouterView } from 'vue-router';
import { h } from 'vue';
import { DEFAULT_LAYOUT } from '@/router/routes/base';
import type { MenuItem } from '@admin-template/shared';

// 预加载所有视图组件，用于动态路由注册
const viewModules = import.meta.glob('@/views/**/*.vue');

/** 只分配了菜单、没有分配任何子页面时的占位页 */
const EMPTY_MENU_VIEW = () => import('@/views/empty-menu/index.vue');

/** 非一级分组菜单的容器：只渲染子路由，不重复渲染布局 */
const ROUTE_VIEW = {
  name: 'RouteView',
  render: () => h(RouterView),
} as RouteRecordRaw['component'];

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

  // 一级菜单使用 DEFAULT_LAYOUT 作为容器；非一级且无组件时只渲染子路由
  const component = isRoot ? DEFAULT_LAYOUT : hasComponent || ROUTE_VIEW;

  // 一级菜单有 component 但没有 children 时，将 component 作为默认子路由
  // 同时设置 hideChildrenInMenu，让菜单把该项当作叶子节点（不展开子菜单）
  // 添加 redirect 确保通过 name 导航到父路由时也能正确渲染子路由内容
  // 子路由设置 activeMenu 指向父级路由名，否则激活路由为隐藏的 *Index 路由，
  // 菜单会因 hideInMenu 跳过高亮，导致菜单项失去选中态
  const routeName = generateRouteName(menu);
  let hideChildrenInMenu = false;
  let redirect: RouteRecordRaw['redirect'] = undefined;
  if (isRoot && hasComponent && children.length === 0) {
    hideChildrenInMenu = true;
    const childName = `${routeName}Index`;
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
          activeMenu: routeName,
        },
      } as RouteRecordRaw,
    ];
  } else if (!hasComponent && children.length === 0) {
    // 只分配了菜单本身、没有任何子页面权限：渲染空状态提示，避免右侧内容区空白
    hideChildrenInMenu = true;
    const childName = `${routeName}Empty`;
    redirect = { name: childName } as RouteRecordRaw['redirect'];
    children = [
      {
        path: '',
        name: childName,
        component: EMPTY_MENU_VIEW,
        meta: {
          locale: menu.name,
          requiresAuth: true,
          roles: ['*'],
          hideInMenu: true,
          activeMenu: routeName,
        },
      } as RouteRecordRaw,
    ];
  }

  return {
    path: menu.path,
    name: routeName,
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
