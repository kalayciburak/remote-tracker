import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker, type Matcher } from "react-day-picker";
import { tr } from "react-day-picker/locale";
import { Calendar } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { tr as trLocale } from "date-fns/locale";
import "react-day-picker/style.css";
import "./date-field.css";

type Props = {
  value: string | undefined;
  onChange: (iso: string) => void;
  minDate?: string;
  maxDate?: string;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
};

const toISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function DateField({ value, onChange, minDate, maxDate, invalid, placeholder, id }: Props) {
  const [open, setOpen] = useState(false);

  const parsed = value ? parseISO(value) : undefined;
  const valid = parsed && isValid(parsed);
  const displayLabel = valid
    ? format(parsed!, "d MMMM yyyy", { locale: trLocale })
    : placeholder ?? "Tarih seç";

  const minParsed = minDate ? parseISO(minDate) : undefined;
  const maxParsed = maxDate ? parseISO(maxDate) : undefined;
  const selected = valid ? parsed : undefined;
  const disabled: Matcher[] = [
    ...(minParsed && isValid(minParsed) ? [{ before: minParsed }] : []),
    ...(maxParsed && isValid(maxParsed) ? [{ after: maxParsed }] : []),
  ];

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-invalid={invalid || undefined}
          data-invalid={invalid || undefined}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm transition-colors data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/30 data-[invalid=true]:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className={valid ? "text-foreground" : "text-muted-foreground"}>
            {displayLabel}
          </span>
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="rt-daypicker"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DayPicker
            mode="single"
            locale={tr}
            weekStartsOn={1}
            navLayout="around"
            selected={selected}
            defaultMonth={selected ?? (minParsed && isValid(minParsed) ? minParsed : undefined)}
            disabled={disabled.length > 0 ? disabled : undefined}
            onSelect={(d) => {
              if (!d) return;
              onChange(toISO(d));
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
