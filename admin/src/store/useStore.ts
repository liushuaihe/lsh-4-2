import { create } from 'zustand';
import request from '@/utils/request';

interface User {
  id: string;
  username: string;
  nickname: string;
  role: string;
  avatar: string;
  balance: number;
  phone?: string;
  isOnline: boolean;
  acceptOrders: boolean;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const useStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAdmin: false,

  setUser: (user) => {
    set({ user, isAdmin: user?.role === 'ADMIN' });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  login: async (username, password) => {
    const res = await request<LoginResponse>({
      method: 'post',
      url: '/auth/login',
      data: { username, password }
    });
    if (res.user.role !== 'ADMIN') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('只有管理员可以登录');
    }
    set({ user: res.user, token: res.token, isAdmin: true });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  logout: () => {
    request({ method: 'post', url: '/auth/logout' }).catch(() => {});
    set({ user: null, token: null, isAdmin: false });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  fetchProfile: async () => {
    try {
      const user = await request<User>({
        method: 'get',
        url: '/auth/profile'
      });
      set({ user, isAdmin: user.role === 'ADMIN' });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }
}));

const savedUser = localStorage.getItem('user');
if (savedUser) {
  try {
    const user = JSON.parse(savedUser);
    useStore.setState({ user, isAdmin: user.role === 'ADMIN' });
  } catch (e) {
    console.error('Failed to parse saved user:', e);
  }
}

export default useStore;
