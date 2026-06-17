import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>) => {
    const res = response.data;
    if (res.code === 200) {
      return res.data as T;
    }
    message.error(res.message || '请求失败');
    return Promise.reject(res);
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request as unknown as <T = any>(config: any) => Promise<T>;
