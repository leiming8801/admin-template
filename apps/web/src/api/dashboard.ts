import axios from 'axios';
import type { TableData } from '@arco-design/web-vue/es/table/interface';
import type { DashboardStats } from '@admin-template/shared';

/** 获取工作台统计数据 */
export function getDashboardStats() {
  return axios.get<DashboardStats>('/api/dashboard/stats');
}

export interface ContentDataRecord {
  x: string;
  y: number;
}

export function queryContentData() {
  return axios.get<ContentDataRecord[]>('/api/content-data');
}

export interface PopularRecord {
  key: number;
  clickNumber: string;
  title: string;
  increases: number;
}

export function queryPopularList(params: { type: string }) {
  return axios.get<TableData[]>('/api/popular/list', { params });
}
