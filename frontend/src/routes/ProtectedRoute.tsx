import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useMe } from "@/features/auth/useAuth";
import { useAuthStore } from "@/stores/authStore";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  requireFirstLogin?: "allow" | "block";
}

const MAX_TIMEOUT_MS = 2_147_483_647;

export function ProtectedRoute({ children, requireFirstLogin = "block" }: Props) {
  const { token, user, expiresAt, setUser, clearAuth } = useAuthStore();
  const location = useLocation();
  const isExpired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  const meQ = useMe(Boolean(token && user) && !isExpired);

  useEffect(() => {
    if (meQ.data) setUser(meQ.data);
  }, [meQ.data, setUser]);

  useEffect(() => {
    if (!expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      clearAuth();
      return;
    }
    const timer = window.setTimeout(clearAuth, Math.min(remaining, MAX_TIMEOUT_MS));
    return () => window.clearTimeout(timer);
  }, [expiresAt, clearAuth]);

  if (!token || !user || isExpired) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.firstLogin && requireFirstLogin === "block" && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (!user.firstLogin && location.pathname === "/change-password" && requireFirstLogin === "allow") {
    // allow voluntary password change page only via /profile flow — but here we let it render
  }

  return <>{children}</>;
}
