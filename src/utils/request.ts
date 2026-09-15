import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { storageUtils } from './storage';
import { env } from '@/config/env';

export const BASE_URL = env.apiUrl;

export interface ResponseResult<T = any> {
  code: string;
  msg: string;
  data: T;
}

export interface PageList<T = any> {
  code: string;
  msg: string;
  data: {
    list: T[];
    total: number;
    pageNum: number;
    pageSize: number;
    isLastPage: boolean;
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
      baseURL: `http://192.168.110.222:9090/v1`,
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
          return Promise.reject(data);
        }
        return data as any;
      },
      error => {
        if (error.response?.status === 401 || error.code === '401' || error.code === '10001' || error.code === '10002' || error.code === '10003') {
          storageUtils.remove('token');
          storageUtils.remove('userInfo');
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
