import { httpClient } from './interceptor';
import type {
  LoginRequest,
  LoginResult,
  MenuItem,
  RefreshTokenRequest,
  RefreshTokenResult,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from '@admin-template/shared';

export type LoginData = LoginRequest;
export type LoginRes = LoginResult;

export function login(data: LoginData) {
  return httpClient.post<LoginRes>('/api/admin/auth/login', data);
}

export function logout() {
  return httpClient.post<void>('/api/admin/auth/logout');
}

export function getUserInfo() {
  return httpClient.get<UserProfile>('/api/admin/auth/profile');
}

export function getMenuList() {
  return httpClient.get<MenuItem[]>('/api/admin/auth/menus');
}

export function refreshToken(refreshToken: string) {
  const data: RefreshTokenRequest = { refreshToken };
  return httpClient.post<RefreshTokenResult>('/api/admin/auth/refresh', data);
}

export function updateProfile(data: UpdateProfileRequest) {
  return httpClient.put<void>('/api/admin/auth/profile', data);
}

export function updatePassword(data: UpdatePasswordRequest) {
  return httpClient.put<void>('/api/admin/auth/password', data);
}
