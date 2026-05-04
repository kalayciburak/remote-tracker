import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  label: string;
  description: React.ReactNode;
  onConfirm: () => Promise<unknown> | unknown;
  className?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}

export function PdfExportButton({
  label,
  description,
  onConfirm,
  className = "btn-primary-gradient",
  size = "sm",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF indirilemedi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        className={className}
        size={size}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title="PDF indirme onayı"
        description={description}
        confirmLabel="İndir"
        cancelLabel="Vazgeç"
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => !busy && setOpen(false)}
      />
    </>
  );
}
