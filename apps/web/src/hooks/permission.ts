import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store';

export default function usePermission() {
  const userStore = useUserStore();

  /** 判断是否为超级管理员 */
  const isSuperAdmin = () => userStore.roles.includes('super_admin');

  return {
    /** 判断用户是否有权限访问该路由 */
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      // 不需要认证的路由直接放行
      if (!route.meta?.requiresAuth) return true;

      // roles 包含 '*' 表示所有角色可访问
      if (route.meta?.roles?.includes('*')) return true;

      // 超级管理员直接放行
      if (isSuperAdmin()) return true;

      // 检查路由需要的角色
      if (route.meta?.roles?.length) {
        return route.meta.roles.some((role: string) =>
          userStore.roles.includes(role),
        );
      }

      // 检查路由需要的权限码（通过 meta.requiresPermission 声明）
      const requiredPermission = (route.meta as Record<string, unknown>)
        ?.requiresPermission as string | undefined;
      if (requiredPermission) {
        return userStore.permissions.includes(requiredPermission);
      }

      // 无角色和权限限制，放行
      return true;
    },

    /** 找到第一个有权限访问的路由 */
    findFirstPermissionRoute(_routers: any, _role = 'admin') {
      const cloneRouters = [..._routers];
      while (cloneRouters.length) {
        const firstElement = cloneRouters.shift();
        if (this.accessRouter(firstElement)) {
          return { name: firstElement.name };
        }
        if (firstElement?.children) {
          cloneRouters.push(...firstElement.children);
        }
      }
      return null;
    },

    /** 检查是否拥有指定权限码 */
    hasPermission(code: string): boolean {
      return userStore.hasPermission(code);
    },
  };
}
