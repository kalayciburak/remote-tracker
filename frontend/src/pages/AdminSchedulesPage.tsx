import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { PdfExportButton } from "@/components/common/PdfExportButton";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { MonthNav } from "@/components/calendar/MonthNav";
import { LeadCalendar } from "@/components/calendar/LeadCalendar";
import { DaySidesheet } from "@/components/calendar/DaySidesheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useScheduleMonth,
  useMyDayStatuses,
} from "@/features/schedule/useSchedules";
import { useUsers } from "@/features/user/useUsers";
import { useHolidays } from "@/features/holiday/useHolidays";
import {
  useLeadTemplates,
  useLeadMonth,
} from "@/features/leadSchedule/useLeadSchedules";
import { useAuthStore } from "@/stores/authStore";
import { monthGrid, startOfWeekMon, ymd, cn, TR_MONTHS } from "@/lib/utils";
import { downloadLeadsPdfExport, downloadPdfExport } from "@/lib/exports";
import {
  DEPARTMENT_LABELS,
  departmentOf,
  isSuperAdmin,
  type Department,
} from "@/types/api";

export function AdminSchedulesPage() {
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [openDay, setOpenDay] = useState<Date | null>(null);
  const [tab, setTab] = useState<"team" | "leads">("team");

  const initialDept = isSuperAdmin(user?.role)
    ? "DEV"
    : (departmentOf(user?.role) ?? "DEV");
  const [gridDepartment, setGridDepartment] = useState<Department>(initialDept);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const monthAnchor = new Date(year, month, 1);
  const currentWeekStart = startOfWeekMon(today);

  const allSchedulesQ = useScheduleMonth(year, month + 1, undefined);
  const myDaysQ = useMyDayStatuses(year, month + 1);
  const usersQ = useUsers({ active: true, asOf: openDay ? ymd(openDay) : undefined });
  const holidaysQ = useHolidays(year);
  const leadTemplatesQ = useLeadTemplates(undefined);
  const leadMonthQ = useLeadMonth(year, month + 1, undefined);

  const gridSchedules = useMemo(
    () =>
      (allSchedulesQ.data ?? []).filter((s) => s.department === gridDepartment),
    [allSchedulesQ.data, gridDepartment]
  );

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const isLoading = allSchedulesQ.isLoading || holidaysQ.isLoading;

  return (
    <>
      <PageHeader
        title="Haftalık Planlama"
        description="Bir günü düzenlemek için takvim hücresine tıkla. Değişiklikler anında kaydedilir."
        actions={
          <PdfExportButton
            label={tab === "leads" ? "Lead PDF" : "Plan PDF"}
            description={
              <>
                <strong>{DEPARTMENT_LABELS[gridDepartment]}</strong> departmanının{" "}
                <strong>
                  {TR_MONTHS[month]} {year}
                </strong>{" "}
                ayına ait{" "}
                {tab === "leads" ? "lead çalışma takvimi" : "haftalık planlama"} PDF
                olarak indirilecek. Devam etmek istiyor musun?
              </>
            }
            onConfirm={() =>
              tab === "leads"
                ? downloadLeadsPdfExport(year, month + 1, gridDepartment)
                : downloadPdfExport(year, month + 1, gridDepartment)
            }
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedTab
          value={tab}
          onChange={setTab}
          options={[
            { value: "team", label: "Ekip" },
            { value: "leads", label: "Lead'ler" },
          ]}
        />
        {isSuperAdmin(user?.role) && (
          <SegmentedTab
            value={gridDepartment}
            onChange={(v) => setGridDepartment(v as Department)}
            options={[
              { value: "DEV", label: "Geliştirici/Analiz" },
              { value: "TEST", label: "Test/Raporlama" },
            ]}
          />
        )}
      </div>

      <Card className="overflow-hidden surface-elevated">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <MonthNav
            year={year}
            month={month}
            onPrev={() => shift(-1)}
            onNext={() => shift(1)}
            onToday={() => {
              setYear(today.getFullYear());
              setMonth(today.getMonth());
            }}
          />
          <div className="ml-auto">
            <CalendarLegend mode="schedule" />
          </div>
        </div>
        {isLoading ? (
          <div className="p-6">
            <Skeleton className="h-[480px] w-full" />
          </div>
        ) : tab === "team" ? (
          <MonthGrid
            cells={cells}
            monthAnchor={monthAnchor}
            today={today}
            currentWeekStart={currentWeekStart}
            isAdminView
            schedules={gridSchedules}
            dayStatuses={myDaysQ.data ?? []}
            holidays={holidaysQ.data ?? []}
            onPickDay={(d) => setOpenDay(d)}
          />
        ) : (
          <LeadCalendar
            cells={cells}
            monthAnchor={monthAnchor}
            today={today}
            templates={leadTemplatesQ.data ?? []}
            days={leadMonthQ.data ?? []}
            holidays={holidaysQ.data ?? []}
            onPickDay={(d) => setOpenDay(d)}
          />
        )}
      </Card>

      <DaySidesheet
        date={openDay}
        open={openDay !== null}
        onOpenChange={(o) => !o && setOpenDay(null)}
        schedules={allSchedulesQ.data ?? []}
        users={usersQ.data ?? []}
        holidays={holidaysQ.data ?? []}
        leadTemplates={leadTemplatesQ.data ?? []}
        leadDays={leadMonthQ.data ?? []}
      />
    </>
  );
}

function SegmentedTab<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex gap-1 rounded-md border bg-secondary/40 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-3 py-1 text-xs font-semibold transition-colors",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
