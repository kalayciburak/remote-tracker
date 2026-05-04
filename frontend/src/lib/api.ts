import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { ProblemDetail } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

function isStaleAuthError(err: AxiosError<ProblemDetail>): boolean {
  if (err.response?.status === 401) return true;
  if (err.response?.status !== 404) return false;
  const detail = err.response?.data?.detail ?? "";
  return /kullan[ıi]c[ıi].*bulunamad[ıi]/i.test(detail);
}

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ProblemDetail>) => {
    if (isStaleAuthError(err)) {
      useAuthStore.getState().clearAuth();
      const path = window.location.pathname;
      if (path !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export function getApiErrorMessage(err: unknown, fallback = "Beklenmeyen bir hata oluştu"): string {
  const ax = err as AxiosError<ProblemDetail>;
  return ax?.response?.data?.detail || ax?.message || fallback;
}

export function getFieldErrors(err: unknown): { field: string; message: string }[] {
  const ax = err as AxiosError<ProblemDetail>;
  return ax?.response?.data?.fields ?? [];
}
