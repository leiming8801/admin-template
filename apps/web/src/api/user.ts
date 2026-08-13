import axios from 'axios';
import type { MenuItem } from '@admin-template/shared';
import type { UserState } from '@/store/modules/user/types';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginRes {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function login(data: LoginData) {
  return axios.post<LoginRes>('/api/auth/login', data);
}

export function logout() {
  return axios.post('/api/auth/logout');
}

export function getUserInfo() {
  return axios.get<UserState>('/api/auth/profile');
}

export function getMenuList() {
  return axios.get<MenuItem[]>('/api/auth/menus');
}

export function refreshToken(refreshToken: string) {
  return axios.post<{ accessToken: string; expiresIn: number }>(
    '/api/auth/refresh',
    { refreshToken }
  );
}

export function updateProfile(data: { nickname?: string }) {
  return axios.put('/api/user/profile', data);
}

export function updatePassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return axios.put('/api/user/password', data);
}

// 保持向后兼容
export type { UserState };
