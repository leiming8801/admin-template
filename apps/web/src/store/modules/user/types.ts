export interface UserState {
  id?: number;
  username?: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  job?: string;
  organization?: string;
  location?: string;
  email?: string;
  introduction?: string;
  personalWebsite?: string;
  jobName?: string;
  organizationName?: string;
  locationName?: string;
  phone?: string;
  registrationDate?: string;
  accountId?: string;
  certification?: number;
  /** 兼容旧代码，取 roles[0] 并将 super_admin 映射为 admin */
  role: string;
  /** 后端返回的角色编码数组，如 ['super_admin'] */
  roles: string[];
  /** 后端返回的权限码数组，如 ['system:user:add', ...] */
  permissions: string[];
}
