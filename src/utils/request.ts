import { AppAlert } from '@/components/AppAlert';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { storageUtils } from './storage';
import { env } from '@/config/env';
import { resetToLogin } from '@/route/navigationRef';

export const BASE_URL = env.apiUrl;

export function isBbsUnavailable(message?: string) {
  return /动态不存在|动态已删除|动态已下架|帖子不存在|帖子已删除|帖子已下架/.test(message ?? '');
}

declare module 'axios' {
  interface AxiosRequestConfig {
    handleBbsUnavailable?: boolean;
  }
}

export interface ResponseResult<T = any> {
  code: string;
  msg: string;
  data: T;
}

const AUTH_ERROR_CODES = ['401', '10001', '10002', '10003'];

let authAlertShowing = false;

function handleAuthError() {
  storageUtils.remove('token');
  storageUtils.remove('userInfo');
  if (authAlertShowing) return;
  authAlertShowing = true;
  AppAlert.alert('提示', '登录已过期，请重新登录', [
    {
      text: '取消',
      style: 'cancel',
      onPress: () => {
        authAlertShowing = false;
      },
    },
    {
      text: '去登录',
      onPress: () => {
        authAlertShowing = false;
        resetToLogin();
      },
    },
  ], {
    // 返回键关闭时也要解除锁，避免后续 401 不再提示
    onDismiss: () => {
      authAlertShowing = false;
    },
  });
}

export interface PageList<T = any> {
  code: string;
  msg: string;
  data: {
    list: T[];
    total: number;
    pageNum: number;
    pageSize?: number;
    pages?: number;
    isLastPage?: boolean;
  };
}

export interface FetchPageParams {
  pageNum?: number;
  pageSize?: number;
  loading?: boolean;
}

class Request {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      // baseURL: `${BASE_URL.replace(/\/+$/, '')}/v1`,
      // baseURL: `http://192.168.110.222:9090/v1`,
      baseURL: `https://apptest.cqwqjl.com/v1`,
      timeout: env.apiTimeout,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
    });

    this.instance.interceptors.request.use(config => {
      const token = storageUtils.getString('token');
      console.log(token, 'token')
      if (token) {
        if (!config.headers) {
          config.headers = {} as any;
        }
        (config.headers as any).token = token;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      response => {
        const data = response.data as ResponseResult<any>;
        if (data.code !== '200') {
          if (AUTH_ERROR_CODES.includes(String(data?.code))) {
            handleAuthError();
            return Promise.reject(data);
          }
          if (data?.msg && !(response.config.handleBbsUnavailable && isBbsUnavailable(data.msg))) {
            AppAlert.alert('提示', data.msg);
          }
          return Promise.reject(data);
        }
        return data as any;
      },
      error => {
        const code = String(error.response?.data?.code ?? error.code ?? error.response?.status ?? '');
        if (error.response?.status === 401 || AUTH_ERROR_CODES.includes(code)) {
          handleAuthError();
        }
        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<ResponseResult<T>> {
    return this.instance.get(url, config) as any;
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseResult<T>> {
    return this.instance.post(url, data, config) as any;
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseResult<T>> {
    return this.instance.put(url, data, config) as any;
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ResponseResult<T>> {
    return this.instance.delete(url, config) as any;
  }
}

export const request = new Request();
