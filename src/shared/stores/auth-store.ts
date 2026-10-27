import { create } from 'zustand';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
