import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { holidayApi } from "./holidayApi";
import type { CreateHolidayRequest } from "@/types/api";

const KEY = ["holidays"] as const;

export function useHolidays(year: number) {
  return useQuery({
    queryKey: [...KEY, year],
    queryFn: () => holidayApi.list(year),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHolidayRequest) => holidayApi.add(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => holidayApi.remove(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetHolidayHalfDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, isHalfDay }: { date: string; isHalfDay: boolean }) =>
      holidayApi.setHalfDay(date, isHalfDay),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncHolidays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => holidayApi.sync(year),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
