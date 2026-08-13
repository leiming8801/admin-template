/** 统一 API 响应结构 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/** 分页查询参数 */
export interface PageQuery {
  page: number;
  pageSize: number;
}

/** 分页响应结构 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 通用状态枚举 */
export enum StatusEnum {
  DISABLED = 0,
  ENABLED = 1,
}

/** 权限类型枚举 */
export enum PermissionTypeEnum {
  MENU = 1,
  BUTTON = 2,
  API = 3,
}
