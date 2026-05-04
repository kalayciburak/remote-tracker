import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TR_MONTHS } from "@/lib/utils";

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
}

export function MonthNav({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tracking-tight">{TR_MONTHS[month]}</span>
        <span className="mono text-sm text-muted-foreground">{year}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={onPrev} aria-label="Önceki ay">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext} aria-label="Sonraki ay">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {onToday && (
          <Button variant="outline" size="sm" onClick={onToday}>
            Bugün
          </Button>
        )}
      </div>
    </div>
  );
}
