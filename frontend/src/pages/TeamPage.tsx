import { useMemo, useState } from "react";
import { GripVertical, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsers, useUpdateUserGroup, useTeamShuffle } from "@/features/user/useUsers";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { canManage, departmentOf, isSuperAdmin, type Department, type TeamGroup, type UserResponse } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export function TeamPage() {
  const me = useAuthStore((s) => s.user);
  const canEdit = canManage(me?.role);
  const isSuper = isSuperAdmin(me?.role);

  const initialDept: Department = isSuper ? "DEV" : (departmentOf(me?.role) ?? "DEV");
  const [department, setDepartment] = useState<Department>(initialDept);

  const usersQ = useUsers({ active: true, department });
  const updateGroup = useUpdateUserGroup();

  const [pending, setPending] = useState<Record<string, TeamGroup>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overGroup, setOverGroup] = useState<TeamGroup | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shuffleConfirmOpen, setShuffleConfirmOpen] = useState(false);
  const shuffle = useTeamShuffle();

  const members = useMemo(
    () => (usersQ.data ?? []).filter((u) => u.role === "DEV" || u.role === "TEST"),
    [usersQ.data]
  );

  function effectiveGroup(u: UserResponse): TeamGroup {
    return (pending[u.id] ?? u.teamGroup ?? "A") as TeamGroup;
  }
  function isPending(u: UserResponse): boolean {
    return pending[u.id] !== undefined && pending[u.id] !== u.teamGroup;
  }
  const groupA = members.filter((u) => effectiveGroup(u) === "A");
  const groupB = members.filter((u) => effectiveGroup(u) === "B");
  const pendingCount = Object.entries(pending).filter(([id, g]) => {
    const u = members.find((m) => m.id === id);
    return u && u.teamGroup !== g;
  }).length;

  function moveTo(userId: string, group: TeamGroup) {
    if (!canEdit) return;
    const user = members.find((m) => m.id === userId);
    if (!user) return;
    if (user.teamGroup === group) {
      const next = { ...pending };
      delete next[userId];
      setPending(next);
    } else {
      setPending({ ...pending, [userId]: group });
    }
  }

  async function save() {
    try {
      const entries = Object.entries(pending).filter(([id, g]) => {
        const u = members.find((m) => m.id === id);
        return u && u.teamGroup !== g;
      });
      for (const [id, g] of entries) {
        await updateGroup.mutateAsync({ id, teamGroup: g });
      }
      toast.success(`${entries.length} kişi yeni gruba atandı`);
      setPending({});
      setConfirmOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Güncelleme başarısız"));
    }
  }

  async function runShuffle() {
    try {
      const res = await shuffle.mutateAsync(department);
      const next: Record<string, TeamGroup> = {};
      res.proposals.forEach((p) => {
        if (p.suggestedGroup !== p.currentGroup) next[p.userId] = p.suggestedGroup;
      });
      setPending(next);
      setShuffleConfirmOpen(false);
      const count = Object.keys(next).length;
      if (count === 0) toast.info("Mevcut dağılım zaten dengede; öneri yok");
      else toast.success(`${count} kişi için öneri hazır — kaydetmeden önce gözden geçir`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Shuffle başarısız"));
    }
  }

  return (
    <>
      <PageHeader
        title="Ekip"
        description={
          canEdit ? (
            <>Üyeleri sürükleyerek <strong>A</strong> ve <strong>B</strong> grupları arasında taşıyabilirsiniz.</>
          ) : (
            <>A ve B grubundaki üyeler. Toplam <strong>{members.length}</strong> kişi.</>
          )
        }
        actions={
          canEdit ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShuffleConfirmOpen(true)}
                disabled={pendingCount > 0 || shuffle.isPending}
              >
                <Shuffle className="h-4 w-4" />
                Otomatik dağıt
              </Button>
              {pendingCount > 0 && (
                <Button variant="outline" onClick={() => setPending({})}>
                  Vazgeç
                </Button>
              )}
              <Button
                disabled={pendingCount === 0 || updateGroup.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {pendingCount === 0 ? "Kaydet" : `Kaydet · ${pendingCount} değişiklik`}
              </Button>
            </div>
          ) : undefined
        }
      />

      {isSuper && (
        <div className="mb-4 inline-flex gap-1 rounded-md border bg-secondary/40 p-1">
          {(["DEV", "TEST"] as Department[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDepartment(d);
                setPending({});
              }}
              className={cn(
                "rounded px-3 py-1 text-xs font-semibold transition-colors",
                department === d
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d === "DEV" ? "Geliştirici/Analiz" : "Test/Raporlama"}
            </button>
          ))}
        </div>
      )}

      {usersQ.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <GroupColumn
            label="A Grubu"
            group="A"
            users={groupA}
            isPending={isPending}
            canEdit={canEdit}
            dropActive={overGroup === "A"}
            draggingId={draggingId}
            onDragStart={(id) => setDraggingId(id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverGroup(null);
            }}
            onDragOver={() => setOverGroup("A")}
            onDragLeave={() => setOverGroup(null)}
            onDrop={(id) => {
              moveTo(id, "A");
              setOverGroup(null);
              setDraggingId(null);
            }}
            meId={me?.id}
          />
          <GroupColumn
            label="B Grubu"
            group="B"
            users={groupB}
            isPending={isPending}
            canEdit={canEdit}
            dropActive={overGroup === "B"}
            draggingId={draggingId}
            onDragStart={(id) => setDraggingId(id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverGroup(null);
            }}
            onDragOver={() => setOverGroup("B")}
            onDragLeave={() => setOverGroup(null)}
            onDrop={(id) => {
              moveTo(id, "B");
              setOverGroup(null);
              setDraggingId(null);
            }}
            meId={me?.id}
          />
        </div>
      )}

      <Dialog
        open={shuffleConfirmOpen}
        onOpenChange={(o) => !o && setShuffleConfirmOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Otomatik dağıt</DialogTitle>
            <DialogDescription>
              Sistem departmandaki üyeler için A/B grup önerisi üretecek. Sabitlenen ekip
              üyeleri korunur. İşlem henüz kayıt yapmaz; öneriler pending olarak görünür,
              kaydetmeden önce manuel düzeltme yapabilirsin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShuffleConfirmOpen(false)}>
              İptal
            </Button>
            <Button onClick={runShuffle} disabled={shuffle.isPending}>
              {shuffle.isPending ? "Hesaplanıyor…" : "Devam et"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grup değişikliklerini kaydet</DialogTitle>
            <DialogDescription>
              {pendingCount} kişi için yeni grup ataması yapılacak.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {Object.entries(pending).map(([id, g]) => {
              const u = members.find((m) => m.id === id);
              if (!u || u.teamGroup === g) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2.5 rounded-md border bg-secondary/30 p-2.5"
                >
                  <Avatar fullName={u.fullName} group={u.teamGroup} role={u.role} size="sm" />
                  <span className="flex-1 text-sm">{u.fullName}</span>
                  <Badge variant={u.teamGroup === "A" ? "groupA" : "groupB"} className="opacity-60">
                    {u.teamGroup}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant={g === "A" ? "groupA" : "groupB"}>{g}</Badge>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              İptal
            </Button>
            <Button onClick={save} disabled={updateGroup.isPending}>
              {updateGroup.isPending ? "Kaydediliyor…" : "Kaydet ve uygula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GroupColumn({
  label,
  group,
  users,
  isPending,
  canEdit,
  dropActive,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  meId,
}: {
  label: string;
  group: TeamGroup;
  users: UserResponse[];
  isPending: (u: UserResponse) => boolean;
  canEdit: boolean;
  dropActive: boolean;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (id: string) => void;
  meId: string | undefined;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        dropActive && "ring-2 ring-primary"
      )}
      onDragOver={(e) => {
        if (!canEdit) return;
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (!canEdit) return;
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Badge variant={group === "A" ? "groupA" : "groupB"}>{label}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{users.length} kişi</span>
      </div>
      <CardContent className="p-3">
        <div className="flex flex-col gap-1">
          {users.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              Bu grupta kullanıcı yok.{" "}
              {canEdit && "Birini buraya sürükleyebilirsin."}
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                draggable={canEdit}
                onDragStart={(e) => {
                  if (!canEdit) return;
                  e.dataTransfer.setData("text/plain", u.id);
                  onDragStart(u.id);
                }}
                onDragEnd={onDragEnd}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors",
                  canEdit ? "cursor-grab hover:bg-secondary/40 active:cursor-grabbing" : "",
                  draggingId === u.id && "opacity-40",
                  isPending(u) && "border border-dashed border-primary/40 bg-primary/5"
                )}
              >
                {canEdit && (
                  <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}
                <Avatar fullName={u.fullName} group={u.teamGroup} role={u.role} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {u.fullName}
                    {u.id === meId && <span className="text-[11px] text-muted-foreground">(sen)</span>}
                  </div>
                  <div className="mono truncate text-[11px] text-muted-foreground">@{u.username}</div>
                </div>
                {isPending(u) && (
                  <span className="text-[10px] font-semibold text-primary">değişti</span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
