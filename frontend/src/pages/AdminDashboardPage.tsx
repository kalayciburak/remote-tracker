import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { PdfExportButton } from "@/components/common/PdfExportButton";
import { MonthNav } from "@/components/calendar/MonthNav";
import { useMonthAnalytics } from "@/features/analytics/useAnalytics";
import { useAuthStore } from "@/stores/authStore";
import { downloadDashboardPdfExport } from "@/lib/exports";
import { cn, TR_MONTHS } from "@/lib/utils";
import {
  DEPARTMENT_LABELS,
  departmentOf,
  isSuperAdmin,
  type Department,
  type GroupAnalytics,
} from "@/types/api";

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const initialDept: Department = isSuperAdmin(user?.role)
    ? "DEV"
    : (departmentOf(user?.role) ?? "DEV");
  const [department, setDepartment] = useState<Department>(initialDept);

  const dataQ = useMonthAnalytics(year, month + 1, department);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function gotoToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const summary = dataQ.data?.summary;
  const rows = dataQ.data?.rows ?? [];

  const peopleCount = rows.length;
  const planned = summary
    ? summary.remoteSum + summary.officeSum + summary.everyoneOfficeSum
    : 0;
  const remotePct = useMemo(
    () => (planned === 0 ? 0 : Math.round(((summary?.remoteSum ?? 0) / planned) * 100)),
    [planned, summary?.remoteSum]
  );
  const avgRemote =
    summary && peopleCount > 0 ? Math.round(summary.remoteSum / peopleCount) : 0;
  const avgOffice =
    summary && peopleCount > 0 ? Math.round(summary.officeSum / peopleCount) : 0;
  const avgEveryone =
    summary && peopleCount > 0
      ? Math.round(summary.everyoneOfficeSum / peopleCount)
      : 0;
  const avgNone =
    summary && peopleCount > 0 ? Math.round(summary.noneSum / peopleCount) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          isSuperAdmin(user?.role)
            ? "Departman bazlı remote/ofis dağılımı."
            : "Takımınızın aylık remote/ofis dağılımı."
        }
        actions={
          <PdfExportButton
            label="Dashboard PDF"
            disabled={dataQ.isLoading}
            description={
              <>
                <strong>{DEPARTMENT_LABELS[department]}</strong> departmanının{" "}
                <strong>
                  {TR_MONTHS[month]} {year}
                </strong>{" "}
                dashboard raporu PDF olarak indirilecek. Devam etmek istiyor musun?
              </>
            }
            onConfirm={() => downloadDashboardPdfExport(year, month + 1, department)}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Card className="surface-elevated">
          <div className="flex items-center gap-3 p-3">
            <MonthNav
              year={year}
              month={month}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              onToday={gotoToday}
            />
          </div>
        </Card>
        {isSuperAdmin(user?.role) && (
          <div className="inline-flex gap-1 rounded-md border bg-secondary/40 p-1">
            {(["DEV", "TEST"] as Department[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepartment(d)}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-semibold transition-colors",
                  department === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {DEPARTMENT_LABELS[d]}
              </button>
            ))}
          </div>
        )}
      </div>

      {dataQ.isLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : !summary ? (
        <Card className="surface-elevated">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Veri yüklenemedi.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Ort. Remote"
              value={avgRemote}
              unit="gün / kişi"
              accent="hsl(var(--remote-line))"
              suffix={`${remotePct}% planlamada · ${peopleCount} kişi`}
            />
            <SummaryCard
              label="Ort. Ofiste"
              value={avgOffice}
              unit="gün / kişi"
              accent="hsl(var(--office-line))"
            />
            <SummaryCard
              label="Tüm ekip ofiste"
              value={avgEveryone}
              unit="gün"
              accent="hsl(var(--deploy-line))"
            />
            <SummaryCard
              label="Ort. Plansız"
              value={avgNone}
              unit="gün / kişi"
              accent="hsl(var(--muted-foreground))"
            />
          </div>

          <Card className="surface-elevated mb-4">
            <CardContent className="p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Grup karşılaştırması
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <GroupCard label="A Grubu" group={summary.groupA} />
                <GroupCard label="B Grubu" group={summary.groupB} />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated overflow-hidden">
            <div className="border-b p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm font-semibold">Kullanıcı kırılımı</div>
                <div className="text-xs text-muted-foreground">
                  {peopleCount} kişi · {summary.totalWorkDays} iş günü
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">İsim</th>
                    <th className="px-3 py-2 text-left">Grup</th>
                    <th className="px-3 py-2 text-right">Remote</th>
                    <th className="px-3 py-2 text-right">Ofiste</th>
                    <th className="px-3 py-2 text-right">Tüm ekip</th>
                    <th className="px-3 py-2 text-right">Tatil</th>
                    <th className="px-3 py-2 text-right">Plansız</th>
                    <th className="px-3 py-2 text-right">Toplam</th>
                    <th className="px-3 py-2 text-left">Remote %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                        Bu ay için kullanıcı bulunmadı.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.userId} className="border-t hover:bg-secondary/30">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.fullName}</div>
                        <div className="mono text-[11px] text-muted-foreground">@{r.username}</div>
                      </td>
                      <td className="px-3 py-2">{r.teamGroup ?? "—"}</td>
                      <td className="mono px-3 py-2 text-right">{r.remote}</td>
                      <td className="mono px-3 py-2 text-right">{r.office}</td>
                      <td className="mono px-3 py-2 text-right">{r.everyoneOffice}</td>
                      <td className="mono px-3 py-2 text-right">{r.holiday}</td>
                      <td className="mono px-3 py-2 text-right">{r.none}</td>
                      <td className="mono px-3 py-2 text-right">{r.totalWorkDays}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded bg-secondary">
                            <div
                              className="h-full"
                              style={{
                                width: `${Math.min(100, r.remotePercent)}%`,
                                backgroundColor: "hsl(var(--remote-line))",
                              }}
                            />
                          </div>
                          <span className="mono text-xs">{r.remotePercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  unit?: string;
  accent: string;
  suffix?: string;
}) {
  return (
    <Card className="surface-elevated">
      <CardContent className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mono mt-1 flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight">
          {value}
          {unit && (
            <span className="text-xs font-medium text-muted-foreground">{unit}</span>
          )}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded bg-secondary">
          <div className="h-full" style={{ width: "100%", backgroundColor: accent }} />
        </div>
        {suffix && <div className="mt-2 text-[11px] text-muted-foreground">{suffix}</div>}
      </CardContent>
    </Card>
  );
}

function GroupCard({ label, group }: { label: string; group: GroupAnalytics }) {
  const avgRemote =
    group.memberCount === 0 ? 0 : Math.round(group.remoteSum / group.memberCount);
  const avgOffice =
    group.memberCount === 0 ? 0 : Math.round(group.officeSum / group.memberCount);
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{group.memberCount} kişi</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="mono text-2xl font-semibold">{group.remotePercent}%</span>
        <span className="text-xs text-muted-foreground">remote</span>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Kişi başı ortalama:{" "}
        <span className="mono font-medium text-foreground">{avgRemote}</span> gün remote ·{" "}
        <span className="mono font-medium text-foreground">{avgOffice}</span> gün ofiste
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-secondary">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, group.remotePercent)}%`,
            backgroundColor: "hsl(var(--remote-line))",
          }}
        />
      </div>
    </div>
  );
}
