import * as React from "react";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/utils";
import type { TeamGroup, Role } from "@/types/api";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fullName: string;
  group?: TeamGroup | null;
  role?: Role;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ fullName, group, role, size = "md", className, ...props }: AvatarProps) {
  const sizeClasses =
    size === "lg"
      ? "h-10 w-10 text-sm"
      : size === "sm"
        ? "h-6 w-6 text-[10px]"
        : "h-8 w-8 text-xs";
  const isLead = role === "TEAM_LEAD_DEV" || role === "TEAM_LEAD_TEST";
  const isSuper = role === "SUPER_ADMIN";
  const colorClass = isSuper
    ? "bg-violet-100 text-violet-900"
    : isLead
      ? "bg-amber-100 text-amber-900"
      : group === "A"
        ? "bg-groupA-bg text-groupA"
        : group === "B"
          ? "bg-groupB-bg text-groupB"
          : "bg-secondary text-foreground";
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight",
        sizeClasses,
        colorClass,
        className
      )}
      {...props}
    >
      {initialsOf(fullName)}
    </div>
  );
}
