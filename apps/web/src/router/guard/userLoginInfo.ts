import type { Router, LocationQueryRaw } from 'vue-router';
import NProgress from 'nprogress'; // progress bar

import { useUserStore, useAppStore } from '@/store';
import { isLogin } from '@/utils/auth';
import { DEFAULT_ROUTE } from '@/router/constants';

/** 从服务端菜单中获取首个可用路由路径 */
function getFirstAvailablePath(appStore: ReturnType<typeof useAppStore>): string {
  const menus = appStore.appAsyncMenus;
  if (!menus?.length) return DEFAULT_ROUTE.fullPath;

  // 优先使用 DEFAULT_ROUTE（dashboard），若不存在则取第一个菜单的路径
  const dashboardExists = menus.some((r) => r.path === DEFAULT_ROUTE.fullPath);
  if (dashboardExists) return DEFAULT_ROUTE.fullPath;

  // 取第一个菜单：若有 redirect 则直接用其 path，否则递归找首个子路由
  const first = menus[0];
  if (first?.redirect && first.path) return first.path;
  if (first?.children?.length) {
    const child = first.children[0] as { path?: string };
    if (child?.path) {
      return child.path.startsWith('/')
        ? child.path
        : `${first.path}/${child.path}`.replace(/\/+/g, '/');
    }
  }
  return first?.path || DEFAULT_ROUTE.fullPath;
}

export default function setupUserLoginInfoGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const userStore = useUserStore();
    const appStore = useAppStore();
    if (isLogin()) {
      if (userStore.role) {
        // 已登录用户访问 login 页，重定向到首个可用路由
        if (to.name === 'login') {
          next({ path: getFirstAvailablePath(appStore) });
        } else {
          next();
        }
      } else {
        try {
          await userStore.info();
          // 获取动态菜单并注册路由
          if (appStore.menuFromServer) {
            await appStore.fetchServerMenuConfig();
            appStore.appAsyncMenus.forEach((route) => {
              if (route.name && !router.hasRoute(route.name)) {
                router.addRoute(route);
              }
            });
          }
          // 如果目标是 login，重定向到首个可用路由
          if (to.name === 'login') {
            next({ path: getFirstAvailablePath(appStore), replace: true });
          } else {
            // 重新触发导航，确保动态路由已注册
            next({ path: to.fullPath, replace: true });
          }
        } catch (error) {
          await userStore.logout();
          next({
            name: 'login',
            query: {
              redirect: to.name,
              ...to.query,
            } as LocationQueryRaw,
          });
        }
      }
    } else {
      if (to.name === 'login') {
        next();
        return;
      }
      next({
        name: 'login',
        query: {
          redirect: to.name,
          ...to.query,
        } as LocationQueryRaw,
      });
    }
  });
}
