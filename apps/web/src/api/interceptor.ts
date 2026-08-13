import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Message } from '@arco-design/web-vue';
import { getToken, clearToken, getRefreshToken, setToken } from '@/utils/auth';
import i18n from '@/locale';

export interface HttpResponse<T = unknown> {
  status: number;
  message: string;
  code: number;
  data: T;
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

let isRedirecting = false;
let isRefreshing = false;
let pendingRequests: ((token: string | null) => void)[] = [];

export function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  clearToken();
  const redirect = encodeURIComponent(
    window.location.pathname + window.location.search
  );
  window.location.href = `/login?redirect=${redirect}`;
}

/** 判断是否为登录/刷新接口（这些接口的 401 不应该跳转） */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = i18n.global.locale.value;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await axios.post<
      HttpResponse<{ accessToken: string; expiresIn: number }>
    >('/api/auth/refresh', { refreshToken });
    if (res.data.code === 200) {
      const newToken = res.data.data.accessToken;
      setToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

axios.interceptors.response.use(
  (response: AxiosResponse<HttpResponse>) => {
    const res = response.data;

    if (res.code !== 200) {
      Message.error({
        content: res.message || 'Error',
        duration: 5 * 1000,
      });
      // 业务层 401 且非登录接口 → 跳转登录页
      if (res.code === 401 && !isAuthEndpoint(response.config.url)) {
        redirectToLogin();
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res as any;
  },
  async (error) => {
    const { response, config } = error;
    const status = response?.status;

    // 401 处理
    if (status === 401 && config) {
      // 登录/刷新接口的 401：弹全局提示，不跳转，交给组件处理
      if (isAuthEndpoint(config.url)) {
        Message.error({
          content: response?.data?.message || '登录失败',
          duration: 5 * 1000,
        });
        return Promise.reject(
          new Error(response?.data?.message || '登录失败')
        );
      }

      // 其他接口的 401：尝试刷新 token
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          pendingRequests.forEach((cb) => cb(newToken));
          pendingRequests = [];
          config.headers.Authorization = `Bearer ${newToken}`;
          return axios(config);
        } else {
          pendingRequests.forEach((cb) => cb(null));
          pendingRequests = [];
          redirectToLogin();
          return Promise.reject(error);
        }
      } else {
        return new Promise((resolve, reject) => {
          pendingRequests.push((token: string | null) => {
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(axios(config));
            } else {
              reject(error);
            }
          });
        });
      }
    }

    // 403
    if (status === 403) {
      Message.error({
        content: response?.data?.message || '无权限访问',
        duration: 3 * 1000,
      });
      return Promise.reject(error);
    }

    // 其他错误
    const message = response?.data?.message || '请求失败';
    Message.error({
      content: message,
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  }
);
