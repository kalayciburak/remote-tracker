export type Role =
  | "SUPER_ADMIN"
  | "TEAM_LEAD_DEV"
  | "TEAM_LEAD_TEST"
  | "DEV"
  | "TEST";

export type Department = "DEV" | "TEST";
export type TeamGroup = "A" | "B";
export type DayCode = "A" | "B" | "OFFICE" | "NONE";
export type DayStatus =
  | "REMOTE"
  | "OFFICE"
  | "EVERYONE_OFFICE"
  | "WEEKEND"
  | "HOLIDAY"
  | "NONE";
export type LeadStatus = "REMOTE" | "OFFICE" | "NONE";
export type HolidaySource = "AUTO" | "MANUAL";

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  department: Department | null;
  teamGroup: TeamGroup | null;
  firstLogin: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  role: Role;
  teamGroup: TeamGroup | null;
  temporaryPassword?: string;
}

export interface CreateUserResponse {
  user: UserResponse;
  temporaryPassword: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: Role;
  teamGroup?: TeamGroup | null;
  active?: boolean;
}

export interface ShuffleProposal {
  userId: string;
  fullName: string;
  currentGroup: TeamGroup | null;
  suggestedGroup: TeamGroup;
}

export interface ShuffleResponse {
  proposals: ShuffleProposal[];
}

export interface ScheduleResponse {
  id: string;
  department: Department;
  weekStartDate: string;
  monday: DayCode;
  tuesday: DayCode;
  wednesday: DayCode;
  thursday: DayCode;
  friday: DayCode;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserSummary | null;
}

export interface SetDayRequest {
  department: Department;
  date: string;
  code: DayCode;
}

export interface DayStatusResponse {
  date: string;
  status: DayStatus;
  holidayName: string | null;
}

export interface HolidayResponse {
  date: string;
  name: string;
  source: HolidaySource;
  isHalfDay: boolean;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  isHalfDay?: boolean;
}

export interface LeadTemplateResponse {
  lead: UserSummary;
  monday: LeadStatus;
  tuesday: LeadStatus;
  wednesday: LeadStatus;
  thursday: LeadStatus;
  friday: LeadStatus;
}

export interface LeadTemplateRequest {
  monday: LeadStatus;
  tuesday: LeadStatus;
  wednesday: LeadStatus;
  thursday: LeadStatus;
  friday: LeadStatus;
}

export interface SetLeadDayRequest {
  leadUserId: string;
  date: string;
  status: LeadStatus;
}

export interface LeadDayResponse {
  lead: UserSummary;
  date: string;
  status: LeadStatus;
}

export interface UserAnalyticsRow {
  userId: string;
  username: string;
  fullName: string;
  teamGroup: TeamGroup | null;
  remote: number;
  office: number;
  everyoneOffice: number;
  holiday: number;
  none: number;
  totalWorkDays: number;
  remotePercent: number;
}

export interface GroupAnalytics {
  memberCount: number;
  remoteSum: number;
  officeSum: number;
  remotePercent: number;
}

export interface AnalyticsSummary {
  totalWorkDays: number;
  remoteSum: number;
  officeSum: number;
  everyoneOfficeSum: number;
  noneSum: number;
  holidaySum: number;
  groupA: GroupAnalytics;
  groupB: GroupAnalytics;
}

export interface MonthAnalyticsResponse {
  year: number;
  month: number;
  department: Department;
  summary: AnalyticsSummary;
  rows: UserAnalyticsRow[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  timestamp?: string;
  fields?: { field: string; message: string }[];
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Proje Yöneticisi",
  TEAM_LEAD_DEV: "Geliştirici/Analiz Lideri",
  TEAM_LEAD_TEST: "Test/Raporlama Lideri",
  DEV: "Geliştirici/Analiz",
  TEST: "Test/Raporlama",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  DEV: "Geliştirici/Analiz",
  TEST: "Test/Raporlama",
};

export function isSuperAdmin(role: Role | undefined): boolean {
  return role === "SUPER_ADMIN";
}

export function isTeamLead(role: Role | undefined): boolean {
  return role === "TEAM_LEAD_DEV" || role === "TEAM_LEAD_TEST";
}

export function canManage(role: Role | undefined): boolean {
  return isSuperAdmin(role) || isTeamLead(role);
}

export function departmentOf(role: Role | undefined): Department | null {
  if (role === "TEAM_LEAD_DEV" || role === "DEV") return "DEV";
  if (role === "TEAM_LEAD_TEST" || role === "TEST") return "TEST";
  return null;
}
