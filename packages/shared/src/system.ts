import { PermissionTypeEnum } from './common';

/** 后台管理员用户 */
export interface AdminUser {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  remark?: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

/** 创建/编辑后台用户的 DTO */
export interface AdminUserDto {
  username: string;
  password?: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: number;
  remark?: string;
}

/** 角色 */
export interface Role {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/** 管理员用户简要信息（用于角色列表展示绑定用户） */
export interface AdminUserBrief {
  id: number;
  username: string;
  nickname: string;
}

/** 角色列表项（含绑定用户信息） */
export interface RoleListItem extends Role {
  users: AdminUserBrief[];
}

/** 创建/编辑角色的 DTO */
export interface RoleDto {
  name: string;
  /** 角色编码（可选，留空时由系统自动生成） */
  code?: string;
  sort?: number;
  status?: number;
  remark?: string;
}

/** 权限（菜单/按钮/API，树形结构） */
export interface Permission {
  id: number;
  parentId: number;
  /** 权限名称，存 i18n key（如 "menu.system.adminUser"），无翻译时直接显示原文 */
  name: string;
  type: PermissionTypeEnum;
  /** 权限标识（如 "system:user:add"） */
  permission?: string;
  /** 前端路由路径（菜单类型） */
  path?: string;
  /** 前端组件路径（菜单类型） */
  component?: string;
  /** 菜单图标 */
  icon?: string;
  sort: number;
  visible: number;
  children?: Permission[];
  createdAt: string;
  updatedAt: string;
}

/** 创建/编辑权限的 DTO */
export interface PermissionDto {
  parentId: number;
  name: string;
  type: PermissionTypeEnum;
  permission?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  visible?: number;
}

/** 分配角色给用户的 DTO */
export interface AssignRolesDto {
  roleIds: number[];
}

/** 分配权限给角色的 DTO */
export interface AssignPermissionsDto {
  permissionIds: number[];
}

/** 重置密码的 DTO */
export interface ResetPasswordDto {
  password: string;
}

/** 修改状态的 DTO */
export interface UpdateStatusDto {
  status: number;
}
