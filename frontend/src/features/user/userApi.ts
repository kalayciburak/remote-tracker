import { api } from "@/lib/api";
import type {
  CreateUserRequest,
  CreateUserResponse,
  Department,
  Role,
  ShuffleResponse,
  TeamGroup,
  UpdateUserRequest,
  UserResponse,
} from "@/types/api";

export interface UserListFilter {
  department?: Department;
  group?: TeamGroup;
  role?: Role;
  active?: boolean;
  firstLogin?: boolean;
  search?: string;
  asOf?: string;
}

export const userApi = {
  list: async (filter: UserListFilter = {}) => {
    const params: Record<string, string | boolean> = {};
    if (filter.department) params.department = filter.department;
    if (filter.group) params.group = filter.group;
    if (filter.role) params.role = filter.role;
    if (filter.active !== undefined) params.active = filter.active;
    if (filter.firstLogin !== undefined) params.firstLogin = filter.firstLogin;
    if (filter.search) params.search = filter.search;
    if (filter.asOf) params.asOf = filter.asOf;
    const res = await api.get<UserResponse[]>("/api/users", { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<UserResponse>(`/api/users/${id}`);
    return res.data;
  },
  create: async (data: CreateUserRequest) => {
    const res = await api.post<CreateUserResponse>("/api/users", data);
    return res.data;
  },
  update: async (id: string, data: UpdateUserRequest) => {
    const res = await api.put<UserResponse>(`/api/users/${id}`, data);
    return res.data;
  },
  updateGroup: async (id: string, teamGroup: TeamGroup) => {
    const res = await api.patch<UserResponse>(`/api/users/${id}/group`, { teamGroup });
    return res.data;
  },
  updateMyProfile: async (data: { fullName: string }) => {
    const res = await api.patch<UserResponse>("/api/users/me/profile", data);
    return res.data;
  },
  teamShuffle: async (department: Department) => {
    const res = await api.post<ShuffleResponse>("/api/users/team-shuffle", null, {
      params: { department },
    });
    return res.data;
  },
  resetPassword: async (id: string) => {
    const res = await api.post<CreateUserResponse>(`/api/users/${id}/reset-password`);
    return res.data;
  },
  remove: async (id: string) => {
    await api.delete(`/api/users/${id}`);
  },
};
