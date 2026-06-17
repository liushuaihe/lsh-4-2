import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

interface RequestInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  interceptors: {
    request: any;
    response: any;
  };
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
}) as unknown as RequestInstance;

request.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response: any) => {
    const res = response.data as ApiResponse;
    if (res.code === 200) {
      return res.data;
    }
    message.error(res.message || '请求失败');
    return Promise.reject(res);
  },
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
