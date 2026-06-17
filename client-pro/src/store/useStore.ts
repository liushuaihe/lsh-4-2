import { create } from 'zustand';
import request from '../utils/request';

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

interface AppState {
  user: User | null;
  token: string | null;
  unreadCount: number;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (username: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  switchRole: (role: string) => Promise<any>;
}

const useStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  unreadCount: 0,

  setUser: (user) => {
    set({ user });
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
    const res = await request.post('/auth/login', { username, password });
    set({ user: res.user, token: res.token });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  register: async (data) => {
    const res = await request.post('/auth/register', data);
    set({ user: res.user, token: res.token });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  logout: () => {
    request.post('/auth/logout').catch(() => {});
    set({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  fetchProfile: async () => {
    try {
      const user = await request.get('/auth/profile');
      set({ user });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await request.get('/messages/unread/count');
      set({ unreadCount: res.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  switchRole: async (role) => {
    const res = await request.post('/auth/switch-role', { role });
    set({ user: res.user, token: res.token });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  }
}));

const savedUser = localStorage.getItem('user');
if (savedUser) {
  try {
    useStore.setState({ user: JSON.parse(savedUser) });
  } catch (e) {
    console.error('Failed to parse saved user:', e);
  }
}

export default useStore;
