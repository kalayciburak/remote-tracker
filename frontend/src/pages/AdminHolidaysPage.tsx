import { useState } from "react";
import { Clock, Plus, RefreshCw, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useAddHoliday,
  useHolidays,
  useRemoveHoliday,
  useSetHolidayHalfDay,
  useSyncHolidays,
} from "@/features/holiday/useHolidays";
import { getApiErrorMessage } from "@/lib/api";
import { formatDateLong } from "@/lib/utils";
import type { HolidayResponse } from "@/types/api";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih biçimi YYYY-MM-DD"),
  name: z.string().min(1, "Tatil adı zorunlu").max(200),
  isHalfDay: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export function AdminHolidaysPage() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const holidaysQ = useHolidays(year);
  const sync = useSyncHolidays();
  const remove = useRemoveHoliday();
  const toggleHalfDay = useSetHolidayHalfDay();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HolidayResponse | null>(null);
  const [halfDayTarget, setHalfDayTarget] = useState<HolidayResponse | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

  async function syncNow() {
    try {
      const written = await sync.mutateAsync(year);
      toast.success(`${written} tatil ${year} için güncellendi`);
      setSyncConfirmOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Senkronizasyon başarısız"));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.date);
      toast.success("Tatil silindi");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Silinemedi"));
    }
  }

  async function confirmHalfDay() {
    if (!halfDayTarget) return;
    const next = !halfDayTarget.isHalfDay;
    try {
      await toggleHalfDay.mutateAsync({ date: halfDayTarget.date, isHalfDay: next });
      toast.success(next ? "Yarım güne çevrildi" : "Tam güne çevrildi");
      setHalfDayTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Güncellenemedi"));
    }
  }

  return (
    <>
      <PageHeader
        title="Resmi Tatiller"
        description="TR resmi tatilleri Google Takvim'in herkese açık Türkiye tatil takviminden otomatik gelir. Manuel ekleme/silme yapılabilir."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setSyncConfirmOpen(true)}
              disabled={sync.isPending}
            >
              <RefreshCw className={sync.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Google'dan çek
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Manuel ekle
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Yıl</Label>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden surface-elevated">
        {holidaysQ.isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (holidaysQ.data ?? []).length === 0 ? (
          <EmptyState
            title="Bu yılda tatil yok"
            description="Google'dan çek butonuna tıkla veya manuel ekle."
          />
        ) : (
          <TooltipProvider delayDuration={150}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Tarih</TableHead>
                  <TableHead className="text-center">Ad</TableHead>
                  <TableHead className="text-center">Süre</TableHead>
                  <TableHead className="text-center">Kaynak</TableHead>
                  <TableHead className="text-center">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(holidaysQ.data ?? []).map((h) => (
                  <TableRow key={h.date}>
                    <TableCell className="mono text-center">{formatDateLong(h.date)}</TableCell>
                    <TableCell className="text-center">{h.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={h.isHalfDay ? "deploy" : "secondary"}>
                        {h.isHalfDay ? "Yarım gün" : "Tam gün"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={h.source === "MANUAL" ? "deploy" : "secondary"}>
                        {h.source === "MANUAL" ? "Manuel" : "Google Takvim"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setHalfDayTarget(h)}
                              aria-label={h.isHalfDay ? "Tam güne çevir" : "Yarım güne çevir"}
                            >
                              {h.isHalfDay ? (
                                <Sun className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {h.isHalfDay ? "Tam güne çevir" : "Yarım güne çevir"}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(h)}
                              aria-label="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Tatili sil</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </Card>

      {showAdd && <AddHolidayDialog onClose={() => setShowAdd(false)} />}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Tatili sil"
        description={
          deleteTarget ? (
            <>
              <strong>{formatDateLong(deleteTarget.date)}</strong> tarihindeki{" "}
              <strong>{deleteTarget.name}</strong> tatili silinecek. Google'dan çek butonuna
              basarsan bu tarih geri gelebilir.
            </>
          ) : null
        }
        confirmLabel="Sil"
        destructive
        busy={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={syncConfirmOpen}
        title={`Google'dan ${year} tatillerini çek`}
        description={
          <>
            Google Takvim'den <strong>{year}</strong> yılına ait resmi tatiller çekilecek. Mevcut
            otomatik tatiller güncellenir; manuel eklediklerin (yarım gün ayarı dahil)
            korunur. Sildiğin Google tatilleri tekrar gelebilir.
          </>
        }
        confirmLabel="Çek"
        busy={sync.isPending}
        onConfirm={syncNow}
        onCancel={() => setSyncConfirmOpen(false)}
      />

      <ConfirmDialog
        open={halfDayTarget !== null}
        title={halfDayTarget?.isHalfDay ? "Tam güne çevir" : "Yarım güne çevir"}
        description={
          halfDayTarget ? (
            <>
              <strong>{formatDateLong(halfDayTarget.date)}</strong> tarihindeki{" "}
              <strong>{halfDayTarget.name}</strong> tatili{" "}
              {halfDayTarget.isHalfDay
                ? "tam günlük resmi tatile döndürülecek."
                : "yarım gün olarak işaretlenecek; öğleden sonra tatil sayılır ve plan girilebilir."}
            </>
          ) : null
        }
        confirmLabel={halfDayTarget?.isHalfDay ? "Tam güne çevir" : "Yarım güne çevir"}
        busy={toggleHalfDay.isPending}
        onConfirm={confirmHalfDay}
        onCancel={() => setHalfDayTarget(null)}
      />
    </>
  );
}

function AddHolidayDialog({ onClose }: { onClose: () => void }) {
  const add = useAddHoliday();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isHalfDay: false, date: "" },
  });

  const dateValue = watch("date");

  async function onSubmit(values: FormValues) {
    try {
      await add.mutateAsync(values);
      toast.success("Tatil eklendi");
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manuel tatil ekle</DialogTitle>
          <DialogDescription>
            Belirli bir tarihi resmi tatil olarak işaretle. Daha sonra yine bu sayfadan silebilirsin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="holiday-date">Tarih</Label>
            <input type="hidden" {...register("date")} />
            <DateField
              id="holiday-date"
              value={dateValue || undefined}
              onChange={(iso) => setValue("date", iso, { shouldValidate: true })}
              invalid={!!errors.date}
              placeholder="Tarih seç"
            />
            {errors.date && <span className="text-xs text-destructive">{errors.date.message}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ad</Label>
            <Input {...register("name")} placeholder="Örn. Şirket içi tatil" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50">
            <input type="checkbox" {...register("isHalfDay")} className="peer sr-only" />
            <span
              className="relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input p-0.5 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-checked:[&>span]:translate-x-4"
              aria-hidden="true"
            >
              <span className="block h-4 w-4 rounded-full bg-background shadow-sm transition-transform" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Yarım gün tatil</span>
              <span className="text-[11px] text-muted-foreground">
                Öğleden sonra tatil. Bu güne plan girilebilir, takvimde yarım kırmızı görünür.
              </span>
            </div>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? "Ekleniyor…" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
