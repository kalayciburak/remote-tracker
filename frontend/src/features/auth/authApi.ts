import { api } from "@/lib/api";
import type {
  ChangePasswordRequest,
  LoginRequest,
  MessageResponse,
  TokenResponse,
  UserResponse,
} from "@/types/api";

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await api.post<TokenResponse>("/api/auth/login", data);
    return res.data;
  },
  changePassword: async (data: ChangePasswordRequest) => {
    const res = await api.post<MessageResponse>("/api/auth/change-password", data);
    return res.data;
  },
  me: async () => {
    const res = await api.get<UserResponse>("/api/auth/me");
    return res.data;
  },
};
