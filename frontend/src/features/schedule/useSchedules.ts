import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduleApi } from "./scheduleApi";
import type { Department, SetDayRequest } from "@/types/api";

const KEY = ["schedules"] as const;

export function useScheduleMonth(
  year: number,
  month: number,
  department?: Department,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...KEY, "month", year, month, department ?? "all"],
    queryFn: () => scheduleApi.month(year, month, department),
    enabled: options?.enabled ?? true,
  });
}

export function useMyDayStatuses(year: number, month: number) {
  return useQuery({
    queryKey: [...KEY, "me", year, month],
    queryFn: () => scheduleApi.myMonth(year, month),
  });
}

export function useSetDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetDayRequest) => scheduleApi.setDay(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      department,
      weekStartDate,
      note,
    }: {
      department: Department;
      weekStartDate: string;
      note: string;
    }) => scheduleApi.setNote(department, weekStartDate, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
