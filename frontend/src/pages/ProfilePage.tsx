import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarDays, KeyRound, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { DepartmentBadge, GroupBadge, RoleBadge } from "@/components/common/GroupBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useChangePassword } from "@/features/auth/useAuth";
import {
  useLeadTemplate,
  useUpsertLeadTemplate,
} from "@/features/leadSchedule/useLeadSchedules";
import { useUpdateMyProfile } from "@/features/user/useUsers";
import { getApiErrorMessage } from "@/lib/api";
import { cn, formatDateLong, TR_DOW_WEEK } from "@/lib/utils";
import { isTeamLead, type LeadStatus } from "@/types/api";
import { PasswordInput } from "@/components/ui/password-input";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "En az 8 karakter")
      .regex(/[A-Z]/, "En az 1 büyük harf")
      .regex(/[a-z]/, "En az 1 küçük harf")
      .regex(/[0-9]/, "En az 1 rakam"),
    newPasswordConfirm: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ["newPasswordConfirm"],
    message: "Parolalar eşleşmiyor",
  });

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  if (!user) return null;
  const isLead = isTeamLead(user.role);

  return (
    <>
      <PageHeader title="Profil" description="Hesap bilgileri ve erişim ayarları" />
      <div className="flex flex-col gap-4">
        <Card className="surface-elevated overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b bg-secondary/35 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar
                  fullName={user.fullName}
                  group={user.teamGroup}
                  role={user.role}
                  size="lg"
                  className="h-14 w-14 text-base ring-4 ring-card"
                />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-lg font-semibold tracking-tight">
                      {user.fullName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setEditNameOpen(true)}
                      aria-label="Adı düzenle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mono mt-0.5 text-xs text-muted-foreground">@{user.username}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <RoleBadge role={user.role} />
                    <GroupBadge group={user.teamGroup} />
                    <DepartmentBadge department={user.department} />
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={() => setOpen(true)} className="sm:self-center">
                <KeyRound className="h-4 w-4" />
                Parola değiştir
              </Button>
            </div>

            <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileField
                icon={UserRound}
                label="Kullanıcı adı"
                value={`@${user.username}`}
                mono
              />
              <ProfileField icon={ShieldCheck} label="Rol" value={<RoleBadge role={user.role} />} />
              <ProfileField
                icon={UserRound}
                label="Grup"
                value={user.teamGroup ? `${user.teamGroup} Grubu` : "Atanmamış"}
              />
              <ProfileField
                icon={CalendarDays}
                label="Hesap oluşturma"
                value={formatDateLong(user.createdAt)}
              />
            </dl>
          </CardContent>
        </Card>

        {isLead && <LeadTemplateCard leadId={user.id} />}
      </div>
      <ChangePasswordDialog open={open} onClose={() => setOpen(false)} />
      <EditFullNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        currentFullName={user.fullName}
      />
    </>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className={cn("mt-1 truncate text-sm font-medium", mono && "mono")}>{value}</dd>
      </div>
    </div>
  );
}

function LeadTemplateCard({ leadId }: { leadId: string }) {
  const templateQ = useLeadTemplate(leadId);
  const upsert = useUpsertLeadTemplate();
  const [draft, setDraft] = useState<Record<string, LeadStatus>>({});

  useEffect(() => {
    if (!templateQ.data) return;
    setDraft({
      monday: templateQ.data.monday,
      tuesday: templateQ.data.tuesday,
      wednesday: templateQ.data.wednesday,
      thursday: templateQ.data.thursday,
      friday: templateQ.data.friday,
    });
  }, [templateQ.data]);

  const days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday")[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ];

  function setDay(day: string, status: LeadStatus) {
    setDraft({ ...draft, [day]: status });
  }

  function isDirty(): boolean {
    if (!templateQ.data) return false;
    return days.some((d) => draft[d] !== templateQ.data?.[d]);
  }

  async function save() {
    try {
      await upsert.mutateAsync({
        leadUserId: leadId,
        data: {
          monday: draft.monday ?? "OFFICE",
          tuesday: draft.tuesday ?? "OFFICE",
          wednesday: draft.wednesday ?? "OFFICE",
          thursday: draft.thursday ?? "OFFICE",
          friday: draft.friday ?? "OFFICE",
        },
      });
      toast.success("Lead şablonu güncellendi");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card className="surface-elevated">
      <CardContent className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Lead haftalık şablonu</div>
            <div className="text-xs text-muted-foreground">
              Her hafta bu varsayılan tekrar eder. Tek bir gün değiştirmek için takvimden o güne tıkla.
            </div>
          </div>
          <Button disabled={!isDirty() || upsert.isPending} onClick={save} className="sm:self-start">
            {upsert.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {days.map((d, i) => (
            <div key={d} className="flex flex-col gap-1.5">
              <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {TR_DOW_WEEK[i]}
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-md border">
                {(["REMOTE", "OFFICE", "NONE"] as LeadStatus[]).map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDay(d, s)}
                    className={cn(
                      "py-2 text-[11px] font-semibold transition-colors",
                      draft[d] === s
                        ? s === "REMOTE"
                          ? "bg-remote-bg text-remote-fg"
                          : s === "OFFICE"
                            ? "bg-office-bg text-office-fg"
                            : "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-secondary/60",
                      idx < 2 && "border-r"
                    )}
                  >
                    {s === "REMOTE" ? "Remote" : s === "OFFICE" ? "Ofiste" : "Yok"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const change = useChangePassword();
  const user = useAuthStore((s) => s.user);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await change.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Parola güncellendi");
      reset();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Parola değiştirilemedi"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parolanı değiştir</DialogTitle>
          <DialogDescription>Yeni parolan için bir kez giriş yapman istenecek.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.username ?? ""}
            readOnly
            hidden
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cur">Mevcut parola</Label>
            <PasswordInput
              id="cur"
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <span className="text-xs text-destructive">{errors.currentPassword.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="np">Yeni parola</Label>
            <PasswordInput id="np" autoComplete="new-password" {...register("newPassword")} />
            <span className="text-[11px] text-muted-foreground">
              En az 8 karakter, 1 büyük, 1 küçük harf, 1 rakam.
            </span>
            {errors.newPassword && (
              <span className="text-xs text-destructive">{errors.newPassword.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="np2">Yeni parola (tekrar)</Label>
            <PasswordInput
              id="np2"
              autoComplete="new-password"
              {...register("newPasswordConfirm")}
            />
            {errors.newPasswordConfirm && (
              <span className="text-xs text-destructive">{errors.newPasswordConfirm.message}</span>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFullNameDialog({
  open,
  onClose,
  currentFullName,
}: {
  open: boolean;
  onClose: () => void;
  currentFullName: string;
}) {
  const [value, setValue] = useState(currentFullName);
  const [err, setErr] = useState<string | null>(null);
  const update = useUpdateMyProfile();

  useEffect(() => {
    if (open) {
      setValue(currentFullName);
      setErr(null);
    }
  }, [open, currentFullName]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setErr("En az 2 karakter girmelisin");
      return;
    }
    if (trimmed.length > 150) {
      setErr("En fazla 150 karakter olabilir");
      return;
    }
    if (trimmed === currentFullName.trim()) {
      onClose();
      return;
    }
    try {
      await update.mutateAsync({ fullName: trimmed });
      toast.success("Adın güncellendi");
      onClose();
    } catch (e2) {
      toast.error(getApiErrorMessage(e2, "Güncellenemedi"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adı düzenle</DialogTitle>
          <DialogDescription>
            Bu ad takvim, ekip listesi ve raporlarda görünür.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input
              id="fullName"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setErr(null);
              }}
              autoFocus
            />
            {err && <span className="text-xs text-destructive">{err}</span>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
