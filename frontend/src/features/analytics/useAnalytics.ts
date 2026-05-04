import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "./analyticsApi";
import type { Department } from "@/types/api";

const KEY = ["analytics"] as const;

export function useMonthAnalytics(
  year: number,
  month: number,
  department?: Department,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...KEY, "month", year, month, department ?? "default"],
    queryFn: () => analyticsApi.month(year, month, department),
    enabled: options?.enabled ?? true,
  });
}
