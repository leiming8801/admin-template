import { httpClient } from './interceptor';
import type {
  Member,
  MemberDto,
  PageResult,
  PageQuery,
} from '@admin-template/shared';

/** 会员列表查询参数 */
export interface MemberListQuery extends Partial<PageQuery> {
  username?: string;
  phone?: string;
  status?: number;
}

/** 分页查询会员列表 */
export function fetchMembers(params: MemberListQuery) {
  return httpClient.get<PageResult<Member>>('/api/admin/members', { params });
}

/** 获取会员详情 */
export function fetchMemberById(id: number) {
  return httpClient.get<Member>(`/api/admin/members/${id}`);
}

/** 编辑会员信息 */
export function updateMember(id: number, data: MemberDto) {
  return httpClient.put<Member>(`/api/admin/members/${id}`, data);
}

/** 修改会员状态 */
export function updateMemberStatus(id: number, status: number) {
  return httpClient.patch(`/api/admin/members/${id}/status`, { status });
}

/** 删除会员 */
export function deleteMember(id: number) {
  return httpClient.delete(`/api/admin/members/${id}`);
}
