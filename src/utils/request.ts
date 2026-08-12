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
      baseURL: BASE_URL,
      timeout: env.apiTimeout,
    });

    this.instance.interceptors.request.use(config => {
      const token = storageUtils.getString('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          storageUtils.remove('token');
        }
        return Promise.reject(error);
      },
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config);
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config);
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config);
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config);
  }
}

export const request = new Request();
