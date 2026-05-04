import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useChangePassword } from "@/features/auth/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut parola zorunlu"),
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

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const changePassword = useChangePassword();
  const isFirst = user?.firstLogin ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Parola güncellendi, hoş geldin!");
      navigate("/calendar", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Parola değiştirilemedi"));
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 pt-9">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl" />
            <div className="text-base font-semibold tracking-tight">
              {isFirst ? "İlk giriş" : "Parolanı değiştir"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isFirst
                ? `${user?.fullName} — devam etmek için parolanı değiştir`
                : "Güvenliğin için yeni bir parola belirle"}
            </div>
          </div>
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
              <Label htmlFor="cp">Mevcut parola</Label>
              <PasswordInput id="cp" autoComplete="current-password" {...register("currentPassword")} />
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
              <PasswordInput id="np2" autoComplete="new-password" {...register("newPasswordConfirm")} />
              {errors.newPasswordConfirm && (
                <span className="text-xs text-destructive">{errors.newPasswordConfirm.message}</span>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting || changePassword.isPending} className="mt-2 h-10">
              {isSubmitting || changePassword.isPending ? "Kaydediliyor…" : "Parolayı kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
