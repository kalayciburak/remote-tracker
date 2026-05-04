import { api } from "@/lib/api";
import type {
  DayStatusResponse,
  Department,
  ScheduleResponse,
  SetDayRequest,
} from "@/types/api";

export const scheduleApi = {
  month: async (year: number, month: number, department?: Department) => {
    const res = await api.get<ScheduleResponse[]>(
      `/api/schedules/month/${year}/${month}`,
      { params: department ? { department } : undefined }
    );
    return res.data;
  },
  myMonth: async (year: number, month: number) => {
    const res = await api.get<DayStatusResponse[]>(`/api/schedules/me/month/${year}/${month}`);
    return res.data;
  },
  setDay: async (data: SetDayRequest) => {
    const res = await api.put<ScheduleResponse>("/api/schedules/day", data);
    return res.data;
  },
  setNote: async (department: Department, weekStartDate: string, note: string) => {
    const res = await api.put<ScheduleResponse>("/api/schedules/note", null, {
      params: { department, weekStartDate, note },
    });
    return res.data;
  },
};
