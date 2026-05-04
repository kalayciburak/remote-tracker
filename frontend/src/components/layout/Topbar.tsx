import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  CalendarHeart,
  Layers,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { canManage, isSuperAdmin, ROLE_LABELS } from "@/types/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const showManagement = canManage(user?.role);
  const showHolidayAdmin = canManage(user?.role);

  const navItems: NavItem[] = [
    { to: "/calendar", icon: Calendar, label: "Takvim" },
    { to: "/team", icon: Users, label: "Ekip" },
    ...(showManagement
      ? [
          { to: "/admin/schedules", icon: Layers, label: "Haftalık Plan" },
          { to: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
          { to: "/admin/users", icon: Shield, label: "Kullanıcılar" },
        ]
      : []),
    ...(showHolidayAdmin
      ? [{ to: "/admin/holidays", icon: CalendarHeart, label: "Resmi Tatiller" }]
      : []),
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-3 sm:px-4 md:px-6">
          <NavLink to="/calendar" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-md shadow-sm" />
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold tracking-tight">Remote Takip</span>
              <span className="truncate text-[10px] text-muted-foreground">Hibrit takvim</span>
            </div>
          </NavLink>

          <nav
            className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Ana menü"
          >
            {navItems.map((item) => (
              <NavIconButton key={item.to} item={item} active={location.pathname === item.to} />
            ))}
          </nav>

          {user && (
            <div className="flex shrink-0 items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/profile"
                    className={cn(
                      "flex h-10 max-w-[260px] items-center gap-2 rounded-md border border-primary/15 bg-accent/70 px-2 text-accent-foreground shadow-sm transition-colors hover:border-primary/25 hover:bg-accent",
                      location.pathname === "/profile" &&
                        "border-primary/35 bg-accent text-accent-foreground shadow-md"
                    )}
                  >
                    <Avatar
                      fullName={user.fullName}
                      group={user.teamGroup}
                      role={user.role}
                      size="md"
                    />
                    <div className="hidden min-w-0 flex-col leading-tight md:flex">
                      <span className="truncate text-sm font-semibold">{user.fullName}</span>
                      <span className="truncate text-[11px] text-accent-foreground/70">
                        {ROLE_LABELS[user.role]}
                        {!isSuperAdmin(user.role) && user.teamGroup
                          ? ` / ${user.teamGroup} Grubu`
                          : ""}
                      </span>
                    </div>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent>Profil</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(true)}
                    aria-label="Çıkış"
                    className="grid h-10 w-10 place-items-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Çıkış</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={confirmLogout}
        title="Çıkış yapmak istiyor musun?"
        description="Geri dönmek için kullanıcı adı ve parolanı yeniden girmen gerekecek."
        confirmLabel="Çıkış yap"
        destructive
        onConfirm={() => {
          clearAuth();
          navigate("/login", { replace: true });
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </TooltipProvider>
  );
}

function NavIconButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={item.to}
          aria-label={item.label}
          className={cn(
            "inline-flex h-9 min-w-[2.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-md border px-2.5 text-sm font-medium transition-colors",
            active
              ? "border-primary/25 bg-primary/10 text-primary"
              : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          <span className="hidden xl:inline">{item.label}</span>
        </NavLink>
      </TooltipTrigger>
      <TooltipContent>{item.label}</TooltipContent>
    </Tooltip>
  );
}
