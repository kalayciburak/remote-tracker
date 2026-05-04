import type {
  DayCode,
  HolidayResponse,
  ScheduleResponse,
  TeamGroup,
  UserResponse,
} from "@/types/api";
import { startOfWeekMon, ymd } from "./utils";

export function findScheduleForDate(
  schedules: ScheduleResponse[],
  date: Date
): ScheduleResponse | undefined {
  const monday = ymd(startOfWeekMon(date));
  return schedules.find((s) => s.weekStartDate === monday);
}

const DAY_KEYS: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday")[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export function codeForDate(
  schedule: ScheduleResponse | undefined,
  date: Date
): DayCode | null {
  if (!schedule) return null;
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return null;
  return schedule[DAY_KEYS[dow - 1]];
}

export function whoIsRemote(
  users: UserResponse[],
  schedule: ScheduleResponse | undefined,
  date: Date
): { remote: UserResponse[]; office: UserResponse[]; code: DayCode | null } {
  const code = codeForDate(schedule, date);
  const active = users.filter(
    (u) => u.active && (u.role === "DEV" || u.role === "TEST")
  );
  if (!schedule || code === null || code === "NONE") {
    return { remote: [], office: [], code };
  }
  if (code === "OFFICE") return { remote: [], office: active, code };

  const targetGroup = code as TeamGroup;
  const remote = active.filter((u) => u.teamGroup === targetGroup);
  const office = active.filter((u) => u.teamGroup && u.teamGroup !== targetGroup);
  return { remote, office, code };
}

export function isHolidayDate(holidays: HolidayResponse[], date: Date): HolidayResponse | undefined {
  const k = ymd(date);
  return holidays.find((h) => h.date === k);
}
