import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DayStatus } from "@/types/api";

interface Props {
  status: DayStatus;
  holidayName?: string | null;
  className?: string;
}

export function DayStatusBadge({ status, holidayName, className }: Props) {
  if (status === "WEEKEND") {
    return <span className={cn("text-[10px] font-semibold uppercase text-muted-foreground", className)}>OFF</span>;
  }
  if (status === "HOLIDAY") {
    return (
      <Badge
        variant="outline"
        className={cn("border-white/35 bg-white/15 text-white shadow-sm", className)}
        title={holidayName ?? undefined}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
        Resmi tatil
      </Badge>
    );
  }
  if (status === "EVERYONE_OFFICE") {
    return (
      <Badge variant="deploy" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
        Tüm ekip
      </Badge>
    );
  }
  if (status === "REMOTE") {
    return (
      <Badge variant="remote" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
        Remote
      </Badge>
    );
  }
  if (status === "OFFICE") {
    return (
      <Badge variant="office" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
        Ofiste
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("border-dashed text-muted-foreground", className)}
    >
      — Plan yok
    </Badge>
  );
}

export function CodeBadge({ code, className }: { code: "A" | "B" | "OFFICE" | "NONE"; className?: string }) {
  if (code === "A") {
    return (
      <Badge variant="remote" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />A remote
      </Badge>
    );
  }
  if (code === "B") {
    return (
      <Badge variant="office" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />B remote
      </Badge>
    );
  }
  if (code === "OFFICE") {
    return (
      <Badge variant="deploy" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
        Tüm ekip
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("border-dashed text-muted-foreground", className)}>
      — Plan yok
    </Badge>
  );
}
