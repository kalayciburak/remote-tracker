import { api } from "@/lib/api";
import type { Department, MonthAnalyticsResponse } from "@/types/api";

export const analyticsApi = {
  month: async (year: number, month: number, department?: Department) => {
    const res = await api.get<MonthAnalyticsResponse>(
      `/api/schedules/analytics/month/${year}/${month}`,
      { params: department ? { department } : undefined }
    );
    return res.data;
  },
};
