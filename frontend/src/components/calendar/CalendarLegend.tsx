interface Props {
  mode?: "personal" | "schedule";
}

export function CalendarLegend({ mode = "personal" }: Props) {
  const labels =
    mode === "schedule"
      ? {
          remote: "A grubu remote",
          office: "B grubu remote",
          deploy: "Tüm ekip ofiste",
          holiday: "Resmi tatil",
        }
      : {
          remote: "Remote",
          office: "Ofiste",
          deploy: "Tüm ekip ofiste",
          holiday: "Resmi tatil",
        };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <LegendItem label={labels.remote} bg="hsl(var(--remote-bg))" border="hsl(var(--remote-line))" />
      <LegendItem label={labels.office} bg="hsl(var(--office-bg))" border="hsl(var(--office-line))" />
      <LegendItem label={labels.deploy} bg="hsl(var(--deploy-bg))" border="hsl(var(--deploy-line))" />
      <LegendItem label={labels.holiday} bg="#c93b4b" border="#c93b4b" />
    </div>
  );
}

function LegendItem({ label, bg, border }: { label: string; bg: string; border: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-3 w-3 rounded border"
        style={{ backgroundColor: bg, borderColor: border }}
      />
      <span>{label}</span>
    </div>
  );
}
