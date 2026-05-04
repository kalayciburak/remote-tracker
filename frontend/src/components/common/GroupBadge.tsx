import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DEPARTMENT_LABELS,
  isSuperAdmin,
  isTeamLead,
  ROLE_LABELS,
  type Department,
  type Role,
  type TeamGroup,
} from "@/types/api";

export function GroupBadge({ group }: { group: TeamGroup | null | undefined }) {
  if (!group) return null;
  return (
    <Badge variant={group === "A" ? "groupA" : "groupB"}>
      {group} Grubu
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const variant = isSuperAdmin(role)
    ? "admin"
    : isTeamLead(role)
      ? "deploy"
      : "secondary";
  return (
    <Badge variant={variant as "admin" | "deploy" | "secondary"} className={cn(className)}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

export function DepartmentBadge({
  department,
  className,
}: {
  department: Department | null | undefined;
  className?: string;
}) {
  if (!department) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        department === "DEV"
          ? "border-indigo-200 bg-indigo-50 text-indigo-800"
          : "border-[#c93b4b] bg-[#c93b4b] text-white",
        className
      )}
    >
      {DEPARTMENT_LABELS[department]}
    </Badge>
  );
}
