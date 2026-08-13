/** 前台会员 */
export interface Member {
  id: number;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: number;
  status: number;
  lastLoginAt?: string;
  lastLoginIp?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/** 编辑会员的 DTO */
export interface MemberDto {
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  gender?: number;
  status?: number;
  remark?: string;
}

/** 会员分页查询参数 */
export interface MemberQuery {
  page: number;
  pageSize: number;
  username?: string;
  phone?: string;
  status?: number;
}
