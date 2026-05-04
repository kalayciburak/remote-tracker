import { api } from "@/lib/api";
import type { CreateHolidayRequest, HolidayResponse } from "@/types/api";

export const holidayApi = {
  list: async (year: number) => {
    const res = await api.get<HolidayResponse[]>("/api/holidays", { params: { year } });
    return res.data;
  },
  add: async (data: CreateHolidayRequest) => {
    const res = await api.post<HolidayResponse>("/api/holidays", data);
    return res.data;
  },
  remove: async (date: string) => {
    await api.delete(`/api/holidays/${date}`);
  },
  setHalfDay: async (date: string, isHalfDay: boolean) => {
    const res = await api.patch<HolidayResponse>(`/api/holidays/${date}/half-day`, null, {
      params: { isHalfDay },
    });
    return res.data;
  },
  sync: async (year: number) => {
    const res = await api.post<number>(`/api/holidays/sync/${year}`);
    return res.data;
  },
};
