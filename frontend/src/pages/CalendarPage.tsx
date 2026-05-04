import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { PdfExportButton } from "@/components/common/PdfExportButton";
import { CalendarLegend } from "@/components/calendar/CalendarLegend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { MonthNav } from "@/components/calendar/MonthNav";
import { DaySidesheet } from "@/components/calendar/DaySidesheet";
import { LeadCalendar } from "@/components/calendar/LeadCalendar";
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
import { downloadLeadsPdfExport, downloadMyPdfExport, downloadPdfExport } from "@/lib/exports";
import {
  DEPARTMENT_LABELS,
  canManage,
  departmentOf,
  isSuperAdmin,
  type Department,
} from "@/types/api";

export function CalendarPage() {
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

  const isAdminView = canManage(user?.role);

  const allSchedulesQ = useScheduleMonth(year, month + 1, undefined, { enabled: isAdminView });
  const myDaysQ = useMyDayStatuses(year, month + 1);
  const usersQ = useUsers(
    { active: true, asOf: openDay ? ymd(openDay) : undefined },
    { enabled: isAdminView }
  );
  const holidaysQ = useHolidays(year);
  const leadTemplatesQ = useLeadTemplates(undefined, { enabled: isAdminView });
  const leadMonthQ = useLeadMonth(year, month + 1, undefined, { enabled: isAdminView });

  const gridSchedules = useMemo(
    () =>
      (allSchedulesQ.data ?? []).filter((s) => s.department === gridDepartment),
    [allSchedulesQ.data, gridDepartment]
  );

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function gotoToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const isLoading =
    allSchedulesQ.isLoading ||
    myDaysQ.isLoading ||
    usersQ.isLoading ||
    holidaysQ.isLoading;

  const stats = useMemo(() => {
    const days = myDaysQ.data ?? [];
    let remote = 0;
    let office = 0;
    let deploy = 0;
    let none = 0;
    let total = 0;
    let hol = 0;
    for (const d of days) {
      const date = new Date(d.date);
      if (date.getMonth() !== month) continue;
      if (d.status === "WEEKEND") continue;
      if (d.status === "HOLIDAY") {
        hol++;
        continue;
      }
      total++;
      if (d.status === "REMOTE") remote++;
      else if (d.status === "OFFICE") office++;
      else if (d.status === "EVERYONE_OFFICE") deploy++;
      else none++;
    }
    return { remote, office, deploy, none, total, hol };
  }, [myDaysQ.data, month]);

  return (
    <>
      <PageHeader
        title="Takvim"
        description={
          isAdminView
            ? "Ekibin haftalık planı. Bir günü düzenlemek için tıkla."
            : "Senin aylık takvim görünümün."
        }
        actions={
          isAdminView ? (
            <PdfExportButton
              label={tab === "leads" ? "Lead PDF" : "Plan PDF"}
              description={
                <>
                  <strong>{DEPARTMENT_LABELS[gridDepartment]}</strong> departmanının{" "}
                  <strong>
                    {TR_MONTHS[month]} {year}
                  </strong>{" "}
                  ayına ait{" "}
                  {tab === "leads" ? "lead çalışma takvimi" : "ekip çalışma takvimi"} PDF
                  olarak indirilecek. Devam etmek istiyor musun?
                </>
              }
              onConfirm={() =>
                tab === "leads"
                  ? downloadLeadsPdfExport(year, month + 1, gridDepartment)
                  : downloadPdfExport(year, month + 1, gridDepartment)
              }
            />
          ) : (
            <PdfExportButton
              label="Takvimimi PDF al"
              description={
                <>
                  <strong>
                    {TR_MONTHS[month]} {year}
                  </strong>{" "}
                  ayına ait kişisel çalışma takvimin PDF olarak indirilecek. Devam
                  etmek istiyor musun?
                </>
              }
              onConfirm={() => downloadMyPdfExport(year, month + 1)}
            />
          )
        }
      />

      {isAdminView && (
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
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden surface-elevated">
          <div className="flex flex-wrap items-center gap-3 border-b p-4">
            <MonthNav
              year={year}
              month={month}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              onToday={gotoToday}
            />
            <div className="ml-auto">
              <CalendarLegend mode={isAdminView ? "schedule" : "personal"} />
            </div>
          </div>
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-[480px] w-full" />
            </div>
          ) : !isAdminView ? (
            <MonthGrid
              cells={cells}
              monthAnchor={monthAnchor}
              today={today}
              currentWeekStart={currentWeekStart}
              isAdminView={false}
              schedules={[]}
              dayStatuses={myDaysQ.data ?? []}
              holidays={holidaysQ.data ?? []}
            />
          ) : tab === "team" ? (
            <MonthGrid
              cells={cells}
              monthAnchor={monthAnchor}
              today={today}
              currentWeekStart={currentWeekStart}
              isAdminView={isAdminView}
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
        <div className="hidden flex-col gap-4 xl:flex">
          <Card className="surface-elevated">
            <CardContent className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bu ay senin için
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat
                  label="Remote gün"
                  val={stats.remote}
                  total={stats.total}
                  accent="hsl(var(--remote-line))"
                />
                <Stat
                  label="Ofis gün"
                  val={stats.office}
                  total={stats.total}
                  accent="hsl(var(--office-line))"
                />
              </div>
              {!isAdminView && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Stat
                    label="Tüm ekip ofiste"
                    val={stats.deploy}
                    total={stats.total}
                    accent="hsl(var(--deploy-line))"
                  />
                  <Stat
                    label="Plansız"
                    val={stats.none}
                    total={stats.total}
                    accent="hsl(var(--muted-foreground))"
                  />
                </div>
              )}
              {stats.hol > 0 && (
                <div className="mt-3 rounded-md border border-[#c93b4b] bg-[#c93b4b] px-3 py-2 text-xs text-white">
                  Bu ay <strong>{stats.hol}</strong> resmi tatil var.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isAdminView && (
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
      )}
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

function Stat({
  label,
  val,
  total,
  accent,
}: {
  label: string;
  val: number;
  total: number;
  accent: string;
}) {
  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mono mt-1 text-2xl font-semibold tracking-tight">
        {val}
        <span className="ml-1 text-sm font-medium text-muted-foreground">/ {total}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-secondary">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
      </div>
    </div>
  );
}
