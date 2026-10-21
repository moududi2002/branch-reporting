// apps/web/lib/auth-store.ts
'use client';
import { create } from 'zustand';
import { api } from './api';

type User = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'THANA_ADMIN' | 'VIEWER';
  branchId?: string | null;
  thanaId?: string | null;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  load: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async load() {
    set({ loading: true });
    try {
      const u = await api<User>('/auth/me');
      set({ user: u });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
  async login(email, password) {
    const u = await api<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: u });
  },
  async logout() {
    await api('/auth/logout', { method: 'POST' });
    set({ user: null });
  },
}));