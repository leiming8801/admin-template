import { httpClient } from './interceptor';
import type {
  Role,
  RoleListItem,
  Permission,
  PageResult,
  PageQuery,
  RoleDto,
  PermissionDto,
  AssignPermissionsDto,
  AdminUser,
  AdminUserDto,
  AssignRolesDto,
  ResetPasswordDto,
  UpdateStatusDto,
} from '@admin-template/shared';

/** 角色列表查询参数 */
export interface RoleListQuery extends Partial<PageQuery> {
  name?: string;
  code?: string;
  status?: number;
}

/** 角色详情（含已分配权限ID列表） */
export interface RoleDetail extends Role {
  permissionIds: number[];
}

/** 分页查询角色列表 */
export function fetchRoles(params: RoleListQuery) {
  return httpClient.get<PageResult<RoleListItem>>('/api/admin/system/roles', { params });
}

/** 获取所有启用角色（下拉选择用） */
export function fetchAllRoles() {
  return httpClient.get<Role[]>('/api/admin/system/roles/all');
}

/** 获取角色详情（含权限列表） */
export function fetchRoleById(id: number) {
  return httpClient.get<RoleDetail>(`/api/admin/system/roles/${id}`);
}

/** 创建角色 */
export function createRole(data: RoleDto) {
  return httpClient.post<Role>('/api/admin/system/roles', data);
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<RoleDto>) {
  return httpClient.put<Role>(`/api/admin/system/roles/${id}`, data);
}

/** 删除角色 */
export function deleteRole(id: number) {
  return httpClient.delete(`/api/admin/system/roles/${id}`);
}

/** 给角色分配权限 */
export function assignRolePermissions(
  id: number,
  data: AssignPermissionsDto,
) {
  return httpClient.put(`/api/admin/system/roles/${id}/permissions`, data);
}

/** 获取权限树 */
export function fetchPermissionTree() {
  return httpClient.get<Permission[]>('/api/admin/system/permissions/tree');
}

/** 创建权限 */
export function createPermission(data: PermissionDto) {
  return httpClient.post<Permission>('/api/admin/system/permissions', data);
}

/** 更新权限 */
export function updatePermission(id: number, data: Partial<PermissionDto>) {
  return httpClient.put<Permission>(`/api/admin/system/permissions/${id}`, data);
}

/** 删除权限 */
export function deletePermission(id: number) {
  return httpClient.delete(`/api/admin/system/permissions/${id}`);
}

// ============ 后台用户管理 ============

/** 后台用户列表查询参数 */
export interface AdminUserListQuery extends Partial<PageQuery> {
  username?: string;
  status?: number;
  roleId?: number;
}

/** 后台用户详情（含已分配角色ID列表） */
export interface AdminUserDetail extends AdminUser {
  roleIds: number[];
}

/** 分页查询后台用户列表 */
export function fetchAdminUsers(params: AdminUserListQuery) {
  return httpClient.get<PageResult<AdminUser>>('/api/admin/system/admin-users', {
    params,
  });
}

/** 获取后台用户详情（含角色ID列表） */
export function fetchAdminUserById(id: number) {
  return httpClient.get<AdminUserDetail>(`/api/admin/system/admin-users/${id}`);
}

/** 创建后台用户 */
export function createAdminUser(data: AdminUserDto) {
  return httpClient.post<AdminUser>('/api/admin/system/admin-users', data);
}

/** 更新后台用户 */
export function updateAdminUser(id: number, data: Partial<AdminUserDto>) {
  return httpClient.put<AdminUser>(`/api/admin/system/admin-users/${id}`, data);
}

/** 删除后台用户 */
export function deleteAdminUser(id: number) {
  return httpClient.delete(`/api/admin/system/admin-users/${id}`);
}

/** 修改后台用户状态 */
export function updateAdminUserStatus(id: number, status: number) {
  return httpClient.patch(`/api/admin/system/admin-users/${id}/status`, { status });
}

/** 给后台用户分配角色 */
export function assignAdminUserRoles(id: number, data: AssignRolesDto) {
  return httpClient.put(`/api/admin/system/admin-users/${id}/roles`, data);
}

/** 重置后台用户密码 */
export function resetAdminUserPassword(id: number, data: ResetPasswordDto) {
  return httpClient.put(`/api/admin/system/admin-users/${id}/password`, data);
}
