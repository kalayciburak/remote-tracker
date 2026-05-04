import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { TeamPage } from "@/pages/TeamPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AdminSchedulesPage } from "@/pages/AdminSchedulesPage";
import { AdminHolidaysPage } from "@/pages/AdminHolidaysPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute requireFirstLogin="allow">
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/schedules"
          element={
            <AdminRoute>
              <AdminSchedulesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/holidays"
          element={
            <AdminRoute>
              <AdminHolidaysPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
