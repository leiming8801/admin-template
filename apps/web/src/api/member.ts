import axios from 'axios';
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
  return axios.get<PageResult<Member>>('/api/members', { params });
}

/** 获取会员详情 */
export function fetchMemberById(id: number) {
  return axios.get<Member>(`/api/members/${id}`);
}

/** 编辑会员信息 */
export function updateMember(id: number, data: MemberDto) {
  return axios.put<Member>(`/api/members/${id}`, data);
}

/** 修改会员状态 */
export function updateMemberStatus(id: number, status: number) {
  return axios.patch(`/api/members/${id}/status`, { status });
}

/** 删除会员 */
export function deleteMember(id: number) {
  return axios.delete(`/api/members/${id}`);
}
