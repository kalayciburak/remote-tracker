import { cn, isSameDayLocal, isSameMonthLocal } from "@/lib/utils";
import type { DayStatusResponse } from "@/types/api";
import { CodeBadge, DayStatusBadge } from "@/components/common/DayStatusBadge";

interface Props {
  date: Date;
  monthAnchor: Date;
  today: Date;
  status?: DayStatusResponse;
  adminCode?: "A" | "B" | "OFFICE" | "NONE" | null;
  isAdminView: boolean;
  inCurrentWeek?: boolean;
  holidayName?: string;
  isHalfHoliday?: boolean;
  onClick?: () => void;
}

export function DayCell({
  date,
  monthAnchor,
  today,
  status,
  adminCode,
  isAdminView,
  inCurrentWeek,
  holidayName,
  isHalfHoliday,
  onClick,
}: Props) {
  const isOther = !isSameMonthLocal(date, monthAnchor);
  const isToday = isSameDayLocal(date, today);
  const showHolidayTag = !!holidayName;
  const isFullHoliday = !!holidayName && !isHalfHoliday;

  const isClickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      aria-disabled={!isClickable}
      className={cn(
        "relative flex min-h-[96px] flex-col border-b border-r bg-card p-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-[-2px]",
        isClickable ? "hover:bg-secondary/40" : "cursor-default",
        isOther && !holidayName && "bg-secondary/30 text-muted-foreground",
        isFullHoliday && "cell-holiday",
        isHalfHoliday && "cell-holiday-half",
        inCurrentWeek && "ring-1 ring-inset ring-primary/30",
        "[&:nth-child(5n)]:border-r-0"
      )}
    >
      <div className="mono mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium">
        {isToday ? (
          <span className="rounded-full bg-primary px-1.5 text-primary-foreground">
            {date.getDate()}
          </span>
        ) : (
          <span className={cn(isOther && !holidayName ? "text-muted-foreground/70" : "")}>{date.getDate()}</span>
        )}
        {showHolidayTag && (
          <span
            className={cn(
              "rounded-full px-1.5 text-[9px] font-semibold uppercase",
              isHalfHoliday
                ? "border border-[#c93b4b]/40 bg-[#c93b4b]/10 text-[#c93b4b]"
                : "border border-white/30 bg-white/15 text-white"
            )}
          >
            {isHalfHoliday ? "Yarım Gün" : "Tatil"}
          </span>
        )}
      </div>
      <div className="mt-auto flex flex-col gap-1">
        {showHolidayTag && !isHalfHoliday ? (
          <>
            <DayStatusBadge status="HOLIDAY" holidayName={holidayName} />
            <span className="line-clamp-2 text-[9px] font-semibold uppercase tracking-wide text-white/95">
              {holidayName}
            </span>
          </>
        ) : isAdminView ? (
          <>
            <CodeBadge code={adminCode ?? "NONE"} />
            {isHalfHoliday && (
              <span className="line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                {holidayName}
              </span>
            )}
          </>
        ) : status ? (
          <>
            <DayStatusBadge status={status.status} />
            {isHalfHoliday && (
              <span className="line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                {holidayName}
              </span>
            )}
          </>
        ) : (
          <DayStatusBadge status="NONE" />
        )}
      </div>
    </button>
  );
}
