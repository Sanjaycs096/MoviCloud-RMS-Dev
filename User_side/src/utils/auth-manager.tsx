import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Import Admin auth context types
export type UserRole = 'admin' | 'manager' | 'waiter' | 'cashier' | 'chef';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token?: string;
}

interface AuthManagerContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  setAdminAuth: (user: AdminUser) => void;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => void;
  hasAdminPermission: (tab: string) => boolean;
}

const AuthManagerContext = createContext<AuthManagerContextType | undefined>(undefined);

// Auth manager that wraps the application
export function AuthManager({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Check for admin session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('rms_current_user');
      if (savedUser) {
        setAdminUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const isAdminAuthenticated = !!adminUser;

  const setAdminAuth = (user: AdminUser) => {
    setAdminUser(user);
  };

  const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // This will be handled by the Admin login page
    return { success: false, error: 'Use admin login page' };
  };

  const logoutAdmin = () => {
    localStorage.removeItem('rms_current_user');
    setAdminUser(null);
    window.location.href = '/';
  };

  const hasAdminPermission = (tab: string): boolean => {
    if (!adminUser) return false;
    // Simplified permission check - expand based on role if needed
    return true;
  };

  return (
    <AuthManagerContext.Provider value={{
      adminUser,
      isAdminAuthenticated,
      setAdminAuth,
      loginAdmin,
      logoutAdmin,
      hasAdminPermission,
    }}>
      {children}
    </AuthManagerContext.Provider>
  );
}

export function useAuthManager() {
  const context = useContext(AuthManagerContext);
  if (context === undefined) {
    throw new Error('useAuthManager must be used within an AuthManager');
  }
  return context;
}
