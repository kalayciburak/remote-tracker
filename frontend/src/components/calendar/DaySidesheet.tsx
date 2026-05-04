import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { GroupBadge } from "@/components/common/GroupBadge";
import { CodeBadge } from "@/components/common/DayStatusBadge";
import {
  whoIsRemote,
  findScheduleForDate,
  codeForDate,
} from "@/lib/calendar";
import {
  formatDateLong,
  isSameDayLocal,
  TR_DOW_LONG,
  ymd,
  cn,
} from "@/lib/utils";
import { useSetDay } from "@/features/schedule/useSchedules";
import { useSetLeadDay } from "@/features/leadSchedule/useLeadSchedules";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/lib/api";
import {
  isSuperAdmin,
  type DayCode,
  type Department,
  type HolidayResponse,
  type LeadDayResponse,
  type LeadStatus,
  type LeadTemplateResponse,
  type ScheduleResponse,
  type UserResponse,
} from "@/types/api";

interface Props {
  date: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: ScheduleResponse[];
  users: UserResponse[];
  holidays: HolidayResponse[];
  leadTemplates: LeadTemplateResponse[];
  leadDays: LeadDayResponse[];
}

const DEPARTMENTS: { code: Department; label: string }[] = [
  { code: "DEV", label: "Geliştirici/Analiz" },
  { code: "TEST", label: "Test/Raporlama" },
];

export function DaySidesheet({
  date,
  open,
  onOpenChange,
  schedules,
  users,
  holidays,
  leadTemplates,
  leadDays,
}: Props) {
  const me = useAuthStore((s) => s.user);
  const setDay = useSetDay();
  const setLeadDay = useSetLeadDay();
  const [pastEditEnabled, setPastEditEnabled] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPastEditEnabled(false);
  }, [date ? ymd(date) : null]);

  const data = useMemo(() => {
    if (!date) return null;
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const ymdKey = ymd(date);
    const holiday = holidays.find((h) => h.date === ymdKey);
    const leadDayMap = new Map<string, LeadDayResponse>();
    leadDays
      .filter((l) => l.date === ymdKey)
      .forEach((l) => leadDayMap.set(l.lead.id, l));
    return { isWeekend, holiday, dow, leadDayMap };
  }, [date, holidays, leadDays]);

  if (!date || !data) return null;

  const today = new Date();
  const isToday = isSameDayLocal(date, today);
  const selectedStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isPastDate = selectedStart < todayStart;
  const userRole = me?.role;
  const canEditDept = (dept: Department): boolean => {
    if (isSuperAdmin(userRole)) return true;
    if (userRole === "TEAM_LEAD_DEV" && dept === "DEV") return true;
    if (userRole === "TEAM_LEAD_TEST" && dept === "TEST") return true;
    return false;
  };
  const canEditLead = (leadUserId: string): boolean =>
    isSuperAdmin(userRole) || me?.id === leadUserId;
  const hasEditAccess =
    DEPARTMENTS.some((dept) => canEditDept(dept.code)) ||
    leadTemplates.some((t) => canEditLead(t.lead.id));
  const editUnlocked = !isPastDate || pastEditEnabled;

  function bounceDrawer() {
    const el = drawerRef.current;
    if (!el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "drawer-bounce 420ms cubic-bezier(0.34, 1.56, 0.64, 1)";
  }

  async function handleSetCode(department: Department, code: DayCode) {
    if (!date) return;
    try {
      await setDay.mutateAsync({ department, date: ymd(date), code });
      toast.success(`${department === "DEV" ? "Geliştirici" : "Test"} planı güncellendi`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Güncelleme başarısız"));
    }
  }

  async function handleSetLeadStatus(leadUserId: string, status: LeadStatus) {
    if (!date) return;
    try {
      await setLeadDay.mutateAsync({ leadUserId, date: ymd(date), status });
      toast.success("Lead planı güncellendi");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lead planı güncellenemedi"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={drawerRef}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          bounceDrawer();
        }}
        onPointerDownOutside={(event) => {
          event.preventDefault();
          bounceDrawer();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
          bounceDrawer();
        }}
        className={cn(
          "!max-w-none w-[min(1080px,96vw)] right-0 left-auto top-0 bottom-0 max-h-screen translate-x-0 translate-y-0 sm:rounded-none border-l border-y-0 border-r-0 fixed grid-rows-[auto_1fr_auto] gap-0 p-0",
          "data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full",
          "data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0",
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        )}
      >
        <div className="border-b p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {TR_DOW_LONG[data.dow]}
            {isToday ? " · Bugün" : ""}
          </div>
          <DialogTitle className="mt-1 text-xl font-semibold">
            {formatDateLong(date)}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Seçili gün için departman planı, remote/ofis dağılımı ve takım lideri durumları.
          </DialogDescription>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.isWeekend && <Badge variant="secondary">Hafta sonu</Badge>}
            {data.holiday && (
              <Badge
                variant="outline"
                className="border-[#c93b4b] bg-[#c93b4b] text-white"
              >
                {data.holiday.isHalfDay ? "Yarım gün resmi tatil" : "Resmi tatil"} · {data.holiday.name}
              </Badge>
            )}
          </div>
          {isPastDate && hasEditAccess && (!data.holiday || data.holiday.isHalfDay) && (
            <div
              className={cn(
                "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs",
                pastEditEnabled
                  ? "border-deploy-line/40 bg-deploy-bg/55 text-deploy-fg"
                  : "border-input bg-secondary/35 text-muted-foreground"
              )}
            >
              <span className="font-medium">
                {pastEditEnabled
                  ? "Geçmiş tarih düzenlemeye açık."
                  : "Geçmiş tarih arşiv modunda."}
              </span>
              {!pastEditEnabled && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-card"
                  onClick={() => setPastEditEnabled(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Düzenle
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-auto p-6">
          {data.isWeekend ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Hafta sonu — planlamaya dahil değildir.
            </div>
          ) : data.holiday && !data.holiday.isHalfDay ? (
            <HolidayNoPlanning name={data.holiday.name} />
          ) : (
            <div className="space-y-6">
              {data.holiday?.isHalfDay && <HolidayHalfDayBanner name={data.holiday.name} />}
              {DEPARTMENTS.map((dept) => (
                <DepartmentSection
                  key={dept.code}
                  department={dept.code}
                  label={dept.label}
                  date={date}
                  schedules={schedules}
                  users={users}
                  canEdit={canEditDept(dept.code) && editUnlocked}
                  lockedByArchive={canEditDept(dept.code) && !editUnlocked}
                  busy={setDay.isPending}
                  onSetCode={(code) => handleSetCode(dept.code, code)}
                />
              ))}

              {leadTemplates.length > 0 && (
                <div>
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Takım liderleri
                  </div>
                  <div className="space-y-2">
                    {leadTemplates.map((t) => (
                      <LeadRow
                        key={t.lead.id}
                        templateLead={t}
                        leadDay={data.leadDayMap.get(t.lead.id)}
                        canEdit={canEditLead(t.lead.id) && editUnlocked}
                        lockedByArchive={canEditLead(t.lead.id) && !editUnlocked}
                        busy={setLeadDay.isPending}
                        onSetStatus={(status) => handleSetLeadStatus(t.lead.id, status)}
                      />
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Lead planı haftalık şablondan başlar; seçilen gün ayrıca düzenlenebilir.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t p-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SectionProps {
  department: Department;
  label: string;
  date: Date;
  schedules: ScheduleResponse[];
  users: UserResponse[];
  canEdit: boolean;
  lockedByArchive: boolean;
  busy: boolean;
  onSetCode: (code: DayCode) => void;
}

function DepartmentSection({
  department,
  label,
  date,
  schedules,
  users,
  canEdit,
  lockedByArchive,
  busy,
  onSetCode,
}: SectionProps) {
  const deptSchedules = schedules.filter((s) => s.department === department);
  const schedule = findScheduleForDate(deptSchedules, date);
  const code = codeForDate(schedule, date);
  const targetRole = department === "DEV" ? "DEV" : "TEST";
  const deptUsers = users.filter(
    (u) => u.active && u.role === targetRole
  );
  const { remote, office } = whoIsRemote(deptUsers, schedule, date);

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-[11px] text-muted-foreground">
            {deptUsers.length} kişi
          </span>
        </div>
        <CodeBadge code={(code as DayCode) ?? "NONE"} />
      </div>

      {canEdit ? (
        <div className="mb-4 grid grid-cols-4 overflow-hidden rounded-md border">
          {(["A", "B", "OFFICE", "NONE"] as DayCode[]).map((c, idx) => (
            <button
              key={c}
              type="button"
              disabled={busy}
              onClick={() => onSetCode(c)}
              className={cn(
                "border-r py-2 text-xs font-semibold transition-colors last:border-r-0 disabled:opacity-50",
                (code ?? "NONE") === c
                  ? c === "A"
                    ? "bg-remote-bg text-remote-fg"
                    : c === "B"
                      ? "bg-office-bg text-office-fg"
                      : c === "OFFICE"
                        ? "bg-deploy-bg text-deploy-fg"
                        : "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-secondary/60",
                idx === 0 && "rounded-l-md",
                idx === 3 && "rounded-r-md"
              )}
            >
              {c === "OFFICE" ? "Tümü" : c === "NONE" ? "— Yok" : c}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-4 rounded-md border border-dashed bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
          {lockedByArchive
            ? "Geçmiş tarihi değiştirmek için üstteki düzenleme kilidini açın."
            : "Bu departmanı sadece kendi takım lideri düzenleyebilir."}
        </div>
      )}

      {code !== null && code !== "NONE" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RosterColumn label="Remote" users={remote} variant="remote" />
          <RosterColumn label="Ofiste" users={office} variant="office" />
        </div>
      ) : (
        <div className="text-xs italic text-muted-foreground">Bu gün için plan girilmemiş.</div>
      )}
    </section>
  );
}

function RosterColumn({
  label,
  users,
  variant,
}: {
  label: string;
  users: UserResponse[];
  variant: "remote" | "office";
}) {
  return (
    <div>
      <div
        className={cn(
          "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider",
          variant === "remote" ? "text-remote-fg" : "text-office-fg"
        )}
      >
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            variant === "remote" ? "bg-remote-line" : "bg-office-line"
          )}
        />
        {label} ({users.length})
      </div>
      {users.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <div className="space-y-1.5">
          {users.map((u) => (
            <PersonRow key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonRow({ user }: { user: UserResponse }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar
        fullName={user.fullName}
        group={user.teamGroup}
        role={user.role}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user.fullName}</div>
        <div className="mono truncate text-[11px] text-muted-foreground">
          @{user.username}
        </div>
      </div>
      <GroupBadge group={user.teamGroup} />
    </div>
  );
}

function HolidayNoPlanning({ name }: { name: string }) {
  return (
    <div className="rounded-md border border-[#c93b4b] bg-[#c93b4b] p-4 text-white shadow-sm">
      <div className="text-sm font-semibold">Resmi tatil: {name}</div>
      <div className="mt-1 text-xs text-white/85">
        Bu güne takım veya lead planı girilemez. Takvim bu tarihi arşiv ve tatil olarak gösterir.
      </div>
    </div>
  );
}

function HolidayHalfDayBanner({ name }: { name: string }) {
  return (
    <div className="rounded-md border border-[#c93b4b] bg-gradient-to-r from-[#c93b4b]/15 to-[#c93b4b]/35 p-4 shadow-sm">
      <div className="text-sm font-semibold text-[#c93b4b]">Yarım gün resmi tatil: {name}</div>
      <div className="mt-1 text-xs text-foreground/80">
        Öğleden sonra tatil. Bu güne takım veya lead planı girilebilir.
      </div>
    </div>
  );
}

function LeadRow({
  templateLead,
  leadDay,
  canEdit,
  lockedByArchive,
  busy,
  onSetStatus,
}: {
  templateLead: LeadTemplateResponse;
  leadDay: LeadDayResponse | undefined;
  canEdit: boolean;
  lockedByArchive: boolean;
  busy: boolean;
  onSetStatus: (status: LeadStatus) => void;
}) {
  const status = leadDay?.status;
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-2.5">
      <Avatar fullName={templateLead.lead.fullName} role="TEAM_LEAD_DEV" size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{templateLead.lead.fullName}</div>
        <div className="text-[11px] text-muted-foreground">
          {lockedByArchive
            ? "Arşiv kilidi açık"
            : status === "REMOTE"
              ? "Remote"
              : status === "OFFICE"
                ? "Ofiste"
                : "Yok"}
        </div>
      </div>
      {canEdit ? (
        <div className="grid w-[210px] grid-cols-3 overflow-hidden rounded-md border">
          {(["REMOTE", "OFFICE", "NONE"] as LeadStatus[]).map((s, idx) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => onSetStatus(s)}
              className={cn(
                "px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50",
                idx < 2 && "border-r",
                status === s
                  ? s === "REMOTE"
                    ? "bg-remote-bg text-remote-fg"
                    : s === "OFFICE"
                      ? "bg-office-bg text-office-fg"
                      : "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-secondary/60"
              )}
            >
              {s === "REMOTE" ? "Remote" : s === "OFFICE" ? "Ofiste" : "Yok"}
            </button>
          ))}
        </div>
      ) : (
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            status === "REMOTE"
              ? "border-remote-line bg-remote-bg text-remote-fg"
              : status === "OFFICE"
                ? "border-office-line bg-office-bg text-office-fg"
                : "border-input bg-card text-muted-foreground"
          )}
        >
          {status === "REMOTE" ? "Remote" : status === "OFFICE" ? "Ofiste" : "Yok"}
        </span>
      )}
    </div>
  );
}
