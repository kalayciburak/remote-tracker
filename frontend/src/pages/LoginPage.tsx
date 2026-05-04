import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useLogin } from "@/features/auth/useAuth";
import { getApiErrorMessage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const schema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunlu"),
  password: z.string().min(1, "Parola zorunlu"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const login = useLogin();

  useEffect(() => {
    if (token && user) {
      navigate(user.firstLogin ? "/change-password" : "/calendar", { replace: true });
    }
  }, [token, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await login.mutateAsync(values);
      const target = res.user.firstLogin ? "/change-password" : "/calendar";
      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(res.user.firstLogin ? "/change-password" : (from ?? target), { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Giriş başarısız"));
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-violet-50 to-background p-4">
      <Card className="w-full max-w-sm surface-elevated">
        <CardContent className="p-8 pt-9">
          <div className="mb-6 flex flex-col items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-11 w-11 rounded-xl shadow-md" />
            <div className="text-base font-semibold tracking-tight">Remote Takip</div>
            <div className="text-xs text-muted-foreground">Hibrit çalışma takvimi</div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Kullanıcı adı</Label>
              <Input id="username" autoFocus autoComplete="username" {...register("username")} />
              {errors.username && (
                <span className="text-xs text-destructive">{errors.username.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Parola</Label>
              <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
              {errors.password && (
                <span className="text-xs text-destructive">{errors.password.message}</span>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting || login.isPending} className="mt-2 h-10">
              {isSubmitting || login.isPending ? "Giriş yapılıyor…" : "Giriş yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
