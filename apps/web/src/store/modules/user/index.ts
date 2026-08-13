import { defineStore } from 'pinia';
import {
  login as userLogin,
  logout as userLogout,
  getUserInfo,
  type LoginData,
} from '@/api/user';
import {
  setToken,
  clearToken,
  setRefreshToken,
  getToken,
  getRefreshToken,
} from '@/utils/auth';
import { removeRouteListener } from '@/utils/route-listener';
import { resolveAvatar } from '@/utils/avatar';
import type { UserState } from './types';
import useAppStore from '../app';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: undefined,
    username: undefined,
    name: undefined,
    nickname: undefined,
    avatar: undefined,
    job: undefined,
    organization: undefined,
    location: undefined,
    email: undefined,
    introduction: undefined,
    personalWebsite: undefined,
    jobName: undefined,
    organizationName: undefined,
    locationName: undefined,
    phone: undefined,
    registrationDate: undefined,
    accountId: undefined,
    certification: undefined,
    role: '',
    roles: [],
    permissions: [],
  }),

  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
    isLogin(): boolean {
      return !!getToken();
    },
  },

  actions: {
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },

    resetInfo() {
      this.$reset();
    },

    /** 获取当前用户信息 + 角色权限 */
    async info() {
      const res = await getUserInfo();
      const data = { ...res.data } as Partial<UserState> & {
        roles?: string[];
        permissions?: string[];
      };
      if (!data.avatar) {
        data.avatar = resolveAvatar(undefined);
      }
      // 后端返回 roles + permissions 数组
      if (!Array.isArray(data.roles)) {
        data.roles = [];
      }
      if (!Array.isArray(data.permissions)) {
        data.permissions = [];
      }
      // 兼容旧代码：super_admin 映射为 admin，其他取 roles[0]
      if (!data.role) {
        data.role = data.roles.includes('super_admin')
          ? 'admin'
          : data.roles[0] || '';
      }
      this.setInfo(data as Partial<UserState>);
    },

    async login(loginForm: LoginData) {
      try {
        const res = await userLogin(loginForm);
        setToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
      } catch (err) {
        clearToken();
        throw err;
      }
    },

    logoutCallBack() {
      const appStore = useAppStore();
      this.resetInfo();
      clearToken();
      removeRouteListener();
      appStore.clearServerMenu();
    },

    async logout() {
      try {
        await userLogout();
      } finally {
        this.logoutCallBack();
      }
    },

    /** 检查是否拥有指定权限码 */
    hasPermission(code: string): boolean {
      if (this.roles.includes('super_admin')) return true;
      return this.permissions.includes(code);
    },
  },
});

export default useUserStore;
