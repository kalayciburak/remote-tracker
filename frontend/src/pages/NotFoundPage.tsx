import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <div className="text-7xl font-bold text-muted-foreground">404</div>
        <div className="mt-2 text-lg font-semibold">Sayfa bulunamadı</div>
        <p className="mt-1 text-sm text-muted-foreground">Aradığın sayfa burada yok.</p>
        <Button asChild className="mt-4">
          <Link to="/calendar">Takvime dön</Link>
        </Button>
      </div>
    </div>
  );
}
