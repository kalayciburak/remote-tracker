import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  addDays,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { tr } from "date-fns/locale";

export { addDays };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export const TR_DOW_LONG = [
  "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi",
];

export const TR_DOW_WEEK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: tr });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM", { locale: tr });
}

export function formatWeekRange(monday: Date | string): string {
  const m = typeof monday === "string" ? new Date(monday) : monday;
  const fri = addDays(m, 4);
  if (m.getMonth() === fri.getMonth()) {
    return `${m.getDate()}–${fri.getDate()} ${TR_MONTHS[fri.getMonth()]}`;
  }
  return `${m.getDate()} ${TR_MONTHS[m.getMonth()].slice(0, 3)} – ${fri.getDate()} ${TR_MONTHS[fri.getMonth()].slice(0, 3)}`;
}

export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeekMon(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function isWeekend(date: Date): boolean {
  const d = getDay(date);
  return d === 0 || d === 6;
}

export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeekMon(first);
  const cells: Date[] = [];
  // 6 weeks × 5 weekdays (Mon-Fri) — weekends excluded
  for (let week = 0; week < 6; week++) {
    for (let dow = 0; dow < 5; dow++) {
      cells.push(addDays(start, week * 7 + dow));
    }
  }
  return cells;
}

export function isSameDayLocal(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function isSameMonthLocal(a: Date, b: Date): boolean {
  return isSameMonth(a, b);
}

export function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = startOfMonth(new Date(year, month, 1));
  const end = endOfMonth(start);
  return { start, end };
}

export function initialsOf(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function generateTempPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const arr = [pick(upper), pick(lower), pick(digits)];
  while (arr.length < length) arr.push(pick(all));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
