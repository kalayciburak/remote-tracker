import { TR_DOW_WEEK, ymd } from "@/lib/utils";
import { DayCell } from "./DayCell";
import type { DayStatusResponse, HolidayResponse, ScheduleResponse } from "@/types/api";
import { codeForDate, findScheduleForDate } from "@/lib/calendar";

interface Props {
  cells: Date[];
  monthAnchor: Date;
  today: Date;
  currentWeekStart: Date;
  isAdminView: boolean;
  schedules: ScheduleResponse[];
  dayStatuses: DayStatusResponse[];
  holidays: HolidayResponse[];
  onPickDay?: (date: Date) => void;
}

export function MonthGrid({
  cells,
  monthAnchor,
  today,
  currentWeekStart,
  isAdminView,
  schedules,
  dayStatuses,
  holidays,
  onPickDay,
}: Props) {
  const statusByDate = new Map(dayStatuses.map((s) => [s.date, s]));
  const holidayByDate = new Map(holidays.map((h) => [h.date, h]));
  const cwsKey = currentWeekStart.toDateString();

  const weekdays = TR_DOW_WEEK.slice(0, 5);
  return (
    <div>
      <div className="calendar-weekdays grid grid-cols-5 border-b">
        {weekdays.map((d) => (
          <div
            key={d}
            className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5">
        {cells.map((d) => {
          const ymdKey = ymd(d);
          const status = statusByDate.get(ymdKey);
          const holiday = holidayByDate.get(ymdKey);
          const sched = isAdminView ? findScheduleForDate(schedules, d) : undefined;
          const code = isAdminView ? codeForDate(sched, d) ?? null : undefined;
          const monthlyMon = new Date(d);
          monthlyMon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          const inCurrentWeek = monthlyMon.toDateString() === cwsKey;
          return (
            <DayCell
              key={d.getTime()}
              date={d}
              monthAnchor={monthAnchor}
              today={today}
              status={status}
              adminCode={code as "A" | "B" | "OFFICE" | "NONE" | null | undefined}
              isAdminView={isAdminView}
              inCurrentWeek={inCurrentWeek}
              holidayName={holiday?.name}
              isHalfHoliday={holiday?.isHalfDay}
              onClick={onPickDay ? () => onPickDay(d) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
