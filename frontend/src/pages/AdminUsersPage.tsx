import { useState } from "react";
import { Plus, Pencil, Key, Power, Search, Copy } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupBadge, RoleBadge } from "@/components/common/GroupBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetUserPassword,
  useDeleteUser,
} from "@/features/user/useUsers";
import { useAuthStore } from "@/stores/authStore";
import { copyToClipboard, generateTempPassword } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import {
  ROLE_LABELS,
  departmentOf,
  isSuperAdmin,
  type Department,
  type Role,
  type TeamGroup,
  type UserResponse,
} from "@/types/api";

const userSchema = z.object({
  username: z
    .string()
    .min(3, "En az 3 karakter")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Sadece küçük harf, rakam ve _"),
  fullName: z.string().min(1, "Ad Soyad zorunlu").max(150),
  role: z.enum(["SUPER_ADMIN", "TEAM_LEAD_DEV", "TEAM_LEAD_TEST", "DEV", "TEST"]),
  teamGroup: z.enum(["A", "B"]).nullable(),
  temporaryPassword: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

function needsGroup(role: Role): boolean {
  return role === "DEV" || role === "TEST";
}

export function AdminUsersPage() {
  const me = useAuthStore((s) => s.user);
  const isSuper = isSuperAdmin(me?.role);
  const myDept = departmentOf(me?.role);

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | "A" | "B">("all");
  const [activeFilter, setActiveFilter] = useState<"active" | "inactive" | "all">("active");
  const [loginFilter, setLoginFilter] = useState<"all" | "pending" | "logged-in">("all");
  const [departmentFilter, setDepartmentFilter] = useState<"all" | Department>(
    isSuper ? "all" : (myDept as Department)
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [resetTarget, setResetTarget] = useState<UserResponse | null>(null);
  const [createdResult, setCreatedResult] = useState<{ user: UserResponse; password: string } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserResponse | null>(null);

  const { data: users = [], isLoading } = useUsers({
    department: departmentFilter === "all" ? undefined : departmentFilter,
    group: groupFilter === "all" ? undefined : groupFilter,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    firstLogin: loginFilter === "all" ? undefined : loginFilter === "pending",
    search: search || undefined,
  });

  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  async function toggleActive(u: UserResponse) {
    if (u.active) {
      setDeactivateTarget(u);
      return;
    }
    try {
      await updateUser.mutateAsync({ id: u.id, data: { active: true } });
      toast.success("Kullanıcı aktifleştirildi");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    try {
      await deleteUser.mutateAsync(deactivateTarget.id);
      toast.success("Kullanıcı pasifleştirildi");
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Kullanıcılar"
        description={isSuper ? "Sistemdeki tüm kullanıcıları yönet." : `${myDept === "DEV" ? "Geliştirici/Analiz" : "Test/Raporlama"} ekibinin kullanıcılarını yönet.`}
        actions={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Yeni Kullanıcı
          </Button>
        }
      />

      <Card className="overflow-hidden surface-elevated">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ad veya kullanıcı adı ara…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isSuper && (
            <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v as "all" | Department)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm departmanlar</SelectItem>
                <SelectItem value="DEV">Geliştirici/Analiz</SelectItem>
                <SelectItem value="TEST">Test/Raporlama</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v as "all" | "A" | "B")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm gruplar</SelectItem>
              <SelectItem value="A">A Grubu</SelectItem>
              <SelectItem value="B">B Grubu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as "active" | "inactive" | "all")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
              <SelectItem value="all">Tümü</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={loginFilter}
            onValueChange={(v) => setLoginFilter(v as "all" | "pending" | "logged-in")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm girişler</SelectItem>
              <SelectItem value="pending">İlk giriş bekleyenler</SelectItem>
              <SelectItem value="logged-in">Giriş yapanlar</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto mono text-xs text-muted-foreground">
            {users.length} kullanıcı
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Eşleşen kullanıcı yok"
            description="Filtreleri temizlemeyi dene veya yeni bir kullanıcı ekle."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Kullanıcı adı</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Grup</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar fullName={u.fullName} group={u.teamGroup} role={u.role} />
                      <div>
                        <div className="font-medium">{u.fullName}</div>
                        {u.firstLogin && (
                          <div className="text-[11px] text-amber-700">İlk giriş bekliyor</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="mono text-xs">@{u.username}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <GroupBadge group={u.teamGroup} />
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge variant="secondary">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pasif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(u)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setResetTarget(u)}
                        aria-label="Parola sıfırla"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(u)}
                        aria-label={u.active ? "Pasifleştir" : "Aktifleştir"}
                      >
                        <Power className={u.active ? "h-4 w-4 text-destructive" : "h-4 w-4 text-emerald-600"} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {showAdd && (
        <UserFormDialog
          isSuper={isSuper}
          actorDept={myDept}
          onClose={() => setShowAdd(false)}
          onCreated={(user, password) => {
            setShowAdd(false);
            setCreatedResult({ user, password });
          }}
        />
      )}
      {editing && (
        <UserFormDialog
          user={editing}
          isSuper={isSuper}
          actorDept={myDept}
          onClose={() => setEditing(null)}
          onUpdated={() => setEditing(null)}
        />
      )}
      {resetTarget && (
        <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
      )}
      {createdResult && (
        <PasswordResultDialog
          user={createdResult.user}
          password={createdResult.password}
          title="Yeni kullanıcı oluşturuldu"
          onClose={() => setCreatedResult(null)}
        />
      )}
      <ConfirmDialog
        open={deactivateTarget !== null}
        title="Kullanıcıyı pasifleştir"
        description={
          deactivateTarget ? (
            <>
              <strong>{deactivateTarget.fullName}</strong> sistemden çıkış yapacak ve giriş yapamayacak.
              Daha sonra aynı sayfadan tekrar aktif edebilirsin.
            </>
          ) : null
        }
        confirmLabel="Pasifleştir"
        destructive
        busy={deleteUser.isPending}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </>
  );
}

interface UserFormDialogProps {
  user?: UserResponse;
  isSuper: boolean;
  actorDept: Department | null;
  onClose: () => void;
  onCreated?: (user: UserResponse, password: string) => void;
  onUpdated?: () => void;
}

function UserFormDialog({
  user,
  isSuper,
  actorDept,
  onClose,
  onCreated,
  onUpdated,
}: UserFormDialogProps) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();

  const defaultRole: Role = isEdit
    ? (user!.role)
    : (isSuper ? "DEV" : (actorDept === "DEV" ? "DEV" : "TEST"));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: user?.username ?? "",
      fullName: user?.fullName ?? "",
      role: defaultRole,
      teamGroup: (user?.teamGroup ?? "A") as TeamGroup | null,
      temporaryPassword: user ? "" : generateTempPassword(),
    },
  });

  const role = watch("role");
  const teamGroup = watch("teamGroup");

  const allowedRoles: Role[] = isSuper
    ? ["SUPER_ADMIN", "TEAM_LEAD_DEV", "TEAM_LEAD_TEST", "DEV", "TEST"]
    : actorDept === "DEV"
      ? ["TEAM_LEAD_DEV", "DEV"]
      : ["TEAM_LEAD_TEST", "TEST"];

  async function onSubmit(values: UserFormValues) {
    try {
      if (isEdit && user) {
        await update.mutateAsync({
          id: user.id,
          data: {
            fullName: values.fullName,
            role: values.role,
            teamGroup: needsGroup(values.role) ? values.teamGroup : null,
          },
        });
        toast.success("Kullanıcı güncellendi");
        onUpdated?.();
        return;
      }
      const res = await create.mutateAsync({
        username: values.username,
        fullName: values.fullName,
        role: values.role,
        teamGroup: needsGroup(values.role) ? values.teamGroup : null,
        temporaryPassword: values.temporaryPassword || undefined,
      });
      onCreated?.(res.user, res.temporaryPassword);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "İşlem başarısız"));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Kullanıcı düzenle" : "Yeni kullanıcı"}</DialogTitle>
          <DialogDescription>
            {isEdit ? user!.fullName : "Yeni hesap oluştur — kullanıcı ilk girişte parolasını değiştirecek."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Ad Soyad</Label>
            <Input {...register("fullName")} />
            {errors.fullName && (
              <span className="text-xs text-destructive">{errors.fullName.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Kullanıcı adı</Label>
            <Input className="mono" {...register("username")} disabled={isEdit} />
            {errors.username && (
              <span className="text-xs text-destructive">{errors.username.message}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setValue("role", v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Grup</Label>
              <Select
                value={teamGroup ?? "A"}
                onValueChange={(v) => setValue("teamGroup", v as TeamGroup)}
                disabled={!needsGroup(role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A Grubu</SelectItem>
                  <SelectItem value="B">B Grubu</SelectItem>
                </SelectContent>
              </Select>
              {!needsGroup(role) && (
                <span className="text-[11px] text-muted-foreground">
                  Bu rol grup atamasını gerektirmez.
                </span>
              )}
            </div>
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Geçici parola</Label>
              <div className="flex gap-2">
                <Input className="mono flex-1" {...register("temporaryPassword")} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setValue("temporaryPassword", generateTempPassword())}
                >
                  Üret
                </Button>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Kullanıcı ilk girişinde parolasını değiştirmek zorunda kalacak.
              </span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? "Kaydet" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: UserResponse; onClose: () => void }) {
  const reset = useResetUserPassword();
  const [result, setResult] = useState<string | null>(null);

  async function confirm() {
    try {
      const res = await reset.mutateAsync(user.id);
      setResult(res.temporaryPassword);
      toast.success("Parola sıfırlandı");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (result) {
    return <PasswordResultDialog user={user} password={result} title="Parola sıfırlandı" onClose={onClose} />;
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parola sıfırla</DialogTitle>
          <DialogDescription>
            <strong>{user.fullName}</strong> için yeni bir geçici parola üretilecek. Kullanıcı bir
            sonraki girişte değiştirmek zorunda kalacak.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={confirm} disabled={reset.isPending}>
            Onayla ve sıfırla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordResultDialog({
  user,
  password,
  title,
  onClose,
}: {
  user: UserResponse;
  password: string;
  title: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <strong>{user.fullName}</strong> için geçici parola. Bu parola yalnız bu seferlik
            görünür — şimdi kopyala.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input className="mono flex-1" value={password} readOnly />
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await copyToClipboard(password);
              if (ok) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
                return;
              }
              toast.error("Kopyalama başarısız. Şifreyi elle seçip kopyala.");
            }}
          >
            <Copy className="h-4 w-4" /> {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
