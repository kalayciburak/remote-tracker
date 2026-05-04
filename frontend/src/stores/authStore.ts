import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "@/types/api";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  expiresAt: string | null;
  setAuth: (token: string, user: UserResponse, expiresAt: string) => void;
  setUser: (user: UserResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      expiresAt: null,
      setAuth: (token, user, expiresAt) => set({ token, user, expiresAt }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null, expiresAt: null }),
    }),
    { name: "remote-tracker-auth-v1" }
  )
);
