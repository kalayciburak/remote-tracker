import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi, type UserListFilter } from "./userApi";
import { useAuthStore } from "@/stores/authStore";
import type {
  CreateUserRequest,
  Department,
  TeamGroup,
  UpdateUserRequest,
  UserResponse,
} from "@/types/api";

const KEY = ["users"] as const;
const ME_KEY = ["me"] as const;

function syncCurrentUser(updated: UserResponse | undefined): void {
  if (!updated) return;
  const { user, setUser } = useAuthStore.getState();
  if (user?.id === updated.id) setUser(updated);
}

export function useUsers(
  filter: UserListFilter = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...KEY, filter],
    queryFn: () => userApi.list(filter),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => userApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userApi.update(id, data),
    onSuccess: (updated) => {
      syncCurrentUser(updated);
      qc.setQueryData(ME_KEY, (old: UserResponse | undefined) =>
        old?.id === updated.id ? updated : old
      );
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName: string }) => userApi.updateMyProfile(data),
    onSuccess: (updated) => {
      syncCurrentUser(updated);
      qc.setQueryData(ME_KEY, updated);
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useUpdateUserGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teamGroup }: { id: string; teamGroup: TeamGroup }) =>
      userApi.updateGroup(id, teamGroup),
    onSuccess: (updated) => {
      syncCurrentUser(updated);
      qc.setQueryData(ME_KEY, (old: UserResponse | undefined) =>
        old?.id === updated.id ? updated : old
      );
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useTeamShuffle() {
  return useMutation({
    mutationFn: (department: Department) => userApi.teamShuffle(department),
  });
}

export function useResetUserPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.remove(id),
    onSuccess: (_, id) => {
      const { user, clearAuth } = useAuthStore.getState();
      if (user?.id === id) clearAuth();
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}
