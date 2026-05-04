import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadScheduleApi } from "./leadScheduleApi";
import type { Department, LeadTemplateRequest, SetLeadDayRequest } from "@/types/api";

const KEY = ["leadSchedules"] as const;

export function useLeadTemplates(
  department?: Department,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...KEY, "templates", department ?? "all"],
    queryFn: () => leadScheduleApi.templates(department),
    enabled: options?.enabled ?? true,
  });
}

export function useLeadTemplate(leadUserId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, "template", leadUserId],
    queryFn: () => leadScheduleApi.template(leadUserId!),
    enabled: !!leadUserId,
  });
}

export function useUpsertLeadTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadUserId,
      data,
    }: {
      leadUserId: string;
      data: LeadTemplateRequest;
    }) => leadScheduleApi.upsertTemplate(leadUserId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetLeadDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetLeadDayRequest) => leadScheduleApi.setDay(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useLeadMonth(
  year: number,
  month: number,
  department?: Department,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...KEY, "month", year, month, department ?? "all"],
    queryFn: () => leadScheduleApi.month(year, month, department),
    enabled: options?.enabled ?? true,
  });
}
