import { TR_DOW_WEEK, cn, isSameDayLocal, isSameMonthLocal, ymd } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type {
  HolidayResponse,
  LeadDayResponse,
  LeadTemplateResponse,
} from "@/types/api";

interface Props {
  cells: Date[];
  monthAnchor: Date;
  today: Date;
  templates: LeadTemplateResponse[];
  days: LeadDayResponse[];
  holidays: HolidayResponse[];
  onPickDay: (date: Date) => void;
}

export function LeadCalendar({
  cells,
  monthAnchor,
  today,
  templates,
  days,
  holidays,
  onPickDay,
}: Props) {
  const dayMap = new Map<string, LeadDayResponse[]>();
  for (const d of days) {
    const k = d.date;
    const arr = dayMap.get(k) ?? [];
    arr.push(d);
    dayMap.set(k, arr);
  }
  const holidayMap = new Map(holidays.map((h) => [h.date, h]));
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
          const holiday = holidayMap.get(ymdKey);
          const holidayName = holiday?.name;
          const isHoliday = !!holiday;
          const isHalfHoliday = !!holiday?.isHalfDay;
          const isFullHoliday = isHoliday && !isHalfHoliday;
          const isOther = !isSameMonthLocal(d, monthAnchor);
          const isToday = isSameDayLocal(d, today);
          const dayLeads = dayMap.get(ymdKey) ?? [];

          return (
            <button
              key={d.getTime()}
              type="button"
              onClick={() => onPickDay(d)}
              className={cn(
                "flex min-h-[96px] flex-col border-b border-r p-2.5 text-left transition-colors hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-[-2px]",
                isOther && !isHoliday && "bg-secondary/30 text-muted-foreground",
                isFullHoliday && "cell-holiday",
                isHalfHoliday && "cell-holiday-half",
                "[&:nth-child(5n)]:border-r-0"
              )}
            >
              <div className="mono mb-1 inline-flex items-center gap-1.5 text-[12px] font-medium">
                {isToday ? (
                  <span className="rounded-full bg-primary px-1.5 text-primary-foreground">
                    {d.getDate()}
                  </span>
                ) : (
                  <span>{d.getDate()}</span>
                )}
              </div>
              {!isFullHoliday && (
                <div className="mt-auto flex flex-col gap-1">
                  {templates.map((t) => {
                    const ld = dayLeads.find((x) => x.lead.id === t.lead.id);
                    if (!ld) return null;
                    return (
                      <div
                        key={t.lead.id}
                        className={cn(
                          "flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                          ld.status === "REMOTE"
                            ? "border-remote-line bg-remote-bg text-remote-fg"
                            : ld.status === "OFFICE"
                              ? "border-office-line bg-office-bg text-office-fg"
                              : "border-input bg-card text-muted-foreground"
                        )}
                      >
                        <Avatar
                          fullName={t.lead.fullName}
                          role="TEAM_LEAD_DEV"
                          size="sm"
                          className="!h-4 !w-4 !text-[8px]"
                        />
                        <span className="truncate">
                          {ld.status === "REMOTE"
                            ? "Remote"
                            : ld.status === "OFFICE"
                              ? "Ofiste"
                              : "Yok"}
                        </span>
                      </div>
                    );
                  })}
                  {isHalfHoliday && holidayName && (
                    <div className="text-[9px] font-semibold uppercase text-white">
                      Yarım Gün — <span className="line-clamp-1">{holidayName}</span>
                    </div>
                  )}
                </div>
              )}
              {isFullHoliday && (
                <div className="mt-auto text-[9px] font-semibold uppercase text-white">
                  <div>Tatil</div>
                  {holidayName && <div className="mt-0.5 line-clamp-2">{holidayName}</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
