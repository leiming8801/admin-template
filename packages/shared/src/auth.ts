/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 登录响应 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** 刷新 Token 请求 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** 刷新 Token 响应 */
export interface RefreshTokenResult {
  accessToken: string;
  expiresIn: number;
}

/** 当前登录用户信息 */
export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
}

/** 动态菜单项 */
export interface MenuItem {
  id: number;
  /** i18n key（如 "menu.system.adminUser"），前端用 t() 翻译，无翻译时显示原文 */
  name: string;
  path: string;
  component?: string;
  icon?: string;
  children?: MenuItem[];
}
