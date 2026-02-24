import { useEffect } from "react";
import { BrowserRouter, useLocation, Navigate, useNavigate } from "react-router-dom";
import FigmaApp from "@/app/App";
import { LoyaltyProvider } from "@/app/context/LoyaltyContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AuthManager, useAuthManager } from "@/utils/auth-manager";

// Admin Dashboard Component (Iframe wrapper for Admin app)
function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, logoutAdmin } = useAuthManager();

  // Listen for navigation messages from the admin iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MOVICLOUD_NAVIGATE') {
        navigate(event.data.path ?? '/');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  if (!isAdminAuthenticated) {
    // Redirect to Admin app's login page in iframe
    return (
      <div className="h-screen">
        <iframe
          src="http://localhost:5175"
          className="w-full h-full border-0"
          title="Admin Login"
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
          >
            ← Customer Portal
          </button>
          <h1 className="text-white font-bold text-xl">Admin Dashboard</h1>
        </div>
        <button
          onClick={logoutAdmin}
          className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition"
        >
          Logout
        </button>
      </div>
      
      {/* Iframe to Admin App */}
      <div className="flex-1 bg-gray-100">
        <iframe
          src="http://localhost:5175"
          className="w-full h-full border-0"
          title="Admin Dashboard"
        />
      </div>
    </div>
  );
}

// Main router component
function AppRouter() {
  const location = useLocation();

  // Admin dashboard route (iframe to localhost:5175)
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return <AdminDashboard />;
  }

  // Render user app for all other routes (DEFAULT)
  return (
    <LoyaltyProvider>
      <NotificationsProvider>
        <FigmaApp />
      </NotificationsProvider>
    </LoyaltyProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthManager>
        <AppRouter />
      </AuthManager>
    </BrowserRouter>
  );
}
