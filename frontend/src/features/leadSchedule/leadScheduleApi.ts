import { api } from "@/lib/api";
import type {
  Department,
  LeadDayResponse,
  LeadTemplateRequest,
  LeadTemplateResponse,
  SetLeadDayRequest,
} from "@/types/api";

export const leadScheduleApi = {
  templates: async (department?: Department) => {
    const res = await api.get<LeadTemplateResponse[]>("/api/lead-schedules/templates", {
      params: department ? { department } : undefined,
    });
    return res.data;
  },
  template: async (leadUserId: string) => {
    const res = await api.get<LeadTemplateResponse>(
      `/api/lead-schedules/templates/${leadUserId}`
    );
    return res.data;
  },
  upsertTemplate: async (leadUserId: string, data: LeadTemplateRequest) => {
    const res = await api.put<LeadTemplateResponse>(
      `/api/lead-schedules/templates/${leadUserId}`,
      data
    );
    return res.data;
  },
  setDay: async (data: SetLeadDayRequest) => {
    const res = await api.put<LeadDayResponse>("/api/lead-schedules/day", data);
    return res.data;
  },
  month: async (year: number, month: number, department?: Department) => {
    const res = await api.get<LeadDayResponse[]>(
      `/api/lead-schedules/month/${year}/${month}`,
      { params: department ? { department } : undefined }
    );
    return res.data;
  },
};
