import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { canManage, isSuperAdmin, type Role } from "@/types/api";

interface Props {
  children: ReactNode;
  superAdminOnly?: boolean;
}

export function AdminRoute({ children, superAdminOnly = false }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();
  const allowed = superAdminOnly ? isSuperAdmin(role) : canManage(role as Role);
  if (!allowed) {
    return (
      <EmptyState
        title="Yetkiniz yok"
        description={
          superAdminOnly
            ? "Bu sayfa yalnızca Proje Yöneticisi tarafından görüntülenebilir."
            : "Bu sayfa yalnızca takım liderleri ve Proje Yöneticisi tarafından görüntülenebilir."
        }
        action={<Button onClick={() => navigate("/calendar")}>Takvime dön</Button>}
      />
    );
  }
  return <>{children}</>;
}
