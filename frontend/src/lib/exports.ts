import { useAuthStore } from "@/stores/authStore";
import type { Department } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

async function downloadPdf(
  endpoint: string,
  filenamePrefix: string,
  year: number,
  month: number,
  department?: Department | null
) {
  const token = useAuthStore.getState().token;
  if (!token) return;
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (department) params.set("department", department);
  const res = await fetch(`${baseURL}${endpoint}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "PDF indirilemedi");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dept = department ? department.toLowerCase() : "tum";
  link.download = `${filenamePrefix}-${dept}-${year}-${String(month).padStart(2, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadPdfExport(
  year: number,
  month: number,
  department?: Department | null
) {
  return downloadPdf("/api/exports/schedule.pdf", "takvim", year, month, department);
}

export async function downloadLeadsPdfExport(
  year: number,
  month: number,
  department?: Department | null
) {
  return downloadPdf("/api/exports/leads.pdf", "lead-takvim", year, month, department);
}

export async function downloadDashboardPdfExport(
  year: number,
  month: number,
  department?: Department | null
) {
  return downloadPdf("/api/exports/dashboard.pdf", "dashboard", year, month, department);
}

export async function downloadMyPdfExport(year: number, month: number) {
  const token = useAuthStore.getState().token;
  const username = useAuthStore.getState().user?.username;
  if (!token || !username) return;
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const res = await fetch(`${baseURL}/api/exports/me.pdf?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "PDF indirilemedi");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `takvimim-${username}-${year}-${String(month).padStart(2, "0")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
