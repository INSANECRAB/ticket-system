import { create } from 'zustand';
import api from '../utils/api';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
    get().fetchUser();
  },
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    const token = get().token;
    if (!token) return set({ user: null });
    try {
      const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
      set({ user: res.data });
    } catch {
      set({ user: null });
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
})); 