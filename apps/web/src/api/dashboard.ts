import { httpClient } from './interceptor';
import type { DashboardStats } from '@admin-template/shared';

/** 获取工作台统计数据 */
export function getDashboardStats() {
  return httpClient.get<DashboardStats>('/api/dashboard/stats');
}
