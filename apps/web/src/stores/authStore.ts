import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  loginGuest: (displayName: string) => Promise<User>;
  checkAuth: () => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  loginGuest: async (displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.loginGuest(displayName);
      set({ user, isLoading: false });
      return user;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false });
      return user;
    } catch {
      set({ user: null, isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Error logging out:', err);
    } finally {
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
