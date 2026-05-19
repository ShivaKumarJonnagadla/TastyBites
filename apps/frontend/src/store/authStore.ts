import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  username: string;
  email: string;
}

interface AuthStore {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,

      login: (token, admin) => set({ token, admin, isAuthenticated: true }),
      logout: () => set({ token: null, admin: null, isAuthenticated: false }),
    }),
    {
      name: 'tastybites-auth',
      partialize: (state) => ({ token: state.token, admin: state.admin, isAuthenticated: state.isAuthenticated }),
    }
  )
);
