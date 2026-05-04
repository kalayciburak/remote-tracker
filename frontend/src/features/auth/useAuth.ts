import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./authApi";
import { useAuthStore } from "@/stores/authStore";
import type { ChangePasswordRequest, LoginRequest } from "@/types/api";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.expiresAt);
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: async () => {
      const me = await authApi.me();
      setUser(me);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled,
    staleTime: 60_000,
  });
}
