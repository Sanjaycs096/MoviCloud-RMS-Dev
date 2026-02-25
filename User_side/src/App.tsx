import { lazy, Suspense } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import FigmaApp from "@/app/App";
import { LoyaltyProvider } from "@/app/context/LoyaltyContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AuthManager } from "@/utils/auth-manager";

// Lazy-load the entire Admin app (+ its CSS) so it only downloads when needed
const AdminApp = lazy(() => import("@/admin/index"));

// ── Admin section ────────────────────────────────────────────────────────────
function AdminSection() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500 text-sm animate-pulse">Loading Admin Panel…</div>
        </div>
      }
    >
      <AdminApp />
    </Suspense>
  );
}

// ── Root router ──────────────────────────────────────────────────────────────
function AppRouter() {
  const location = useLocation();

  if (location.pathname === "/admin" || location.pathname.startsWith("/admin/")) {
    return <AdminSection />;
  }

  return (
    <AuthManager>
      <LoyaltyProvider>
        <NotificationsProvider>
          <FigmaApp />
        </NotificationsProvider>
      </LoyaltyProvider>
    </AuthManager>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
