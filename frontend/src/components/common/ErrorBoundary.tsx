import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Error boundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">Beklenmedik bir hata oluştu</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error.message || "Sayfayı yenilemeyi dene."}
          </p>
          <Button onClick={() => window.location.reload()}>Sayfayı yenile</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
