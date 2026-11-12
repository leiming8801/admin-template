import axios from 'axios';
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { Message } from '@arco-design/web-vue';
import type { ApiResponse, RefreshTokenResult } from '@admin-template/shared';
import {
  getToken,
  clearToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
} from '@/utils/auth';
import i18n from '@/locale';

// baseURL 为后端服务源地址（不含 /api）；留空时使用同源 Vite/Nginx 代理。
const baseURL = import.meta.env.VITE_API_BASE_URL || undefined;
const httpInstance = axios.create({ baseURL });
const refreshInstance = axios.create({ baseURL });

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRedirecting = false;
let isRefreshing = false;
let pendingRequests: ((token: string | null) => void)[] = [];

function t(key: string): string {
  return i18n.global.t(key) as string;
}

export function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  clearToken();
  const redirect = encodeURIComponent(
    window.location.pathname + window.location.search,
  );
  window.location.href = `/login?redirect=${redirect}`;
}

/** 登录接口的 401 交给登录页处理，不参与自动刷新。 */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

httpInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = i18n.global.locale.value;
    return config;
  },
  (error) => Promise.reject(error),
);

/** 刷新请求不经过业务响应拦截器，只在这里解析一次原始响应信封。 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await refreshInstance.post<ApiResponse<RefreshTokenResult>>(
      '/api/admin/auth/refresh',
      { refreshToken },
    );
    const result = response.data;
    if (
      result.code === 200 &&
      result.data?.accessToken &&
      result.data.refreshToken
    ) {
      setToken(result.data.accessToken);
      setRefreshToken(result.data.refreshToken);
      return result.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

httpInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const result = response.data;

    if (!result || typeof result.code !== 'number') {
      const message = t('http.invalidResponse');
      Message.error({ content: message, duration: 5 * 1000 });
      return Promise.reject(new Error(message));
    }

    if (result.code !== 200) {
      const message = result.message || t('http.error');
      Message.error({ content: message, duration: 5 * 1000 });
      if (result.code === 401 && !isAuthEndpoint(response.config.url)) {
        redirectToLogin();
      }
      return Promise.reject(new Error(message));
    }

    // Axios 类型未覆盖响应解包，实际返回业务数据，由 request 统一恢复泛型。
    return result.data as unknown as AxiosResponse;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const response = error.response;
    const config = error.config as RetryRequestConfig | undefined;
    const status = response?.status;

    if (status === 401 && config) {
      if (isAuthEndpoint(config.url)) {
        const message = response?.data?.message || t('http.loginFailed');
        Message.error({ content: message, duration: 5 * 1000 });
        return Promise.reject(new Error(message));
      }

      // 每个请求最多自动刷新并重试一次，避免持续 401 时循环刷新。
      if (config._retry) {
        redirectToLogin();
        return Promise.reject(error);
      }
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          pendingRequests.forEach((callback) => callback(newToken));
          pendingRequests = [];
          config.headers.Authorization = `Bearer ${newToken}`;
          return httpInstance.request(config);
        }

        pendingRequests.forEach((callback) => callback(null));
        pendingRequests = [];
        redirectToLogin();
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        pendingRequests.push((token: string | null) => {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(httpInstance.request(config));
          } else {
            reject(error);
          }
        });
      });
    }

    if (status === 403) {
      Message.error({
        content: response?.data?.message || t('http.forbidden'),
        duration: 3 * 1000,
      });
      return Promise.reject(error);
    }

    const message = response?.data?.message || t('http.error');
    Message.error({ content: message, duration: 5 * 1000 });
    return Promise.reject(error);
  },
);

function request<T>(config: AxiosRequestConfig): Promise<T> {
  return httpInstance.request(config) as unknown as Promise<T>;
}

/** 类型化的业务请求入口：成功返回 T，失败抛出异常。 */
export const httpClient = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'get', url });
  },
  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request<T>({ ...config, method: 'post', url, data });
  },
  put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request<T>({ ...config, method: 'put', url, data });
  },
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request<T>({ ...config, method: 'patch', url, data });
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request<T>({ ...config, method: 'delete', url });
  },
};
