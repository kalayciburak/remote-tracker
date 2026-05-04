import { Outlet } from "react-router-dom";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Topbar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-12 pt-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
