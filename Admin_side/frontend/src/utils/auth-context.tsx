import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

// Define user roles
export type UserRole = 'admin' | 'manager' | 'waiter' | 'cashier' | 'chef';

// Local storage key for role permissions
const ROLE_PERMISSIONS_STORAGE_KEY = 'rms_role_permissions';

// Default role permissions - which tabs each role can access
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'menu', 'orders', 'kitchen', 'tables', 'inventory', 'staff', 'billing', 'offers', 'reports', 'notifications', 'settings'],
  manager: ['dashboard', 'menu', 'orders', 'kitchen', 'tables', 'inventory', 'staff', 'billing', 'offers', 'reports', 'notifications'],
  waiter: ['orders', 'tables', 'menu'],
  cashier: ['orders', 'billing', 'tables'],
  chef: ['kitchen', 'orders'],
};

// Get role permissions from localStorage or use defaults
const getRolePermissions = (): Record<UserRole, string[]> => {
  try {
    const stored = localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (stored) {
      const storedPermissions = JSON.parse(stored);
      // Merge stored permissions with defaults (in case some roles weren't saved)
      return {
        ...DEFAULT_ROLE_PERMISSIONS,
        ...storedPermissions,
      };
    }
  } catch (error) {
    console.error('Error loading role permissions from localStorage:', error);
  }
  return DEFAULT_ROLE_PERMISSIONS;
};

// Get default tab for each role
export const DEFAULT_TAB: Record<UserRole, string> = {
  admin: 'dashboard',
  manager: 'dashboard',
  waiter: 'orders',
  cashier: 'billing',
  chef: 'kitchen',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (tab: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(getRolePermissions);

  // Load role permissions from localStorage on mount and when updated
  useEffect(() => {
    const loadPermissions = () => {
      const newPermissions = getRolePermissions();
      setRolePermissions(newPermissions);
    };
    
    // Load on mount
    loadPermissions();
    
    // Listen for role-permissions-updated events
    const handlePermissionsUpdate = () => {
      loadPermissions();
    };
    
    window.addEventListener('role-permissions-updated', handlePermissionsUpdate);
    window.addEventListener('storage', handlePermissionsUpdate);
    
    return () => {
      window.removeEventListener('role-permissions-updated', handlePermissionsUpdate);
      window.removeEventListener('storage', handlePermissionsUpdate);
    };
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rms_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Normalize role to lowercase, fallback unknown roles to 'cashier'
        const rawRole = (parsed.role || 'cashier').toLowerCase();
        parsed.role = (['admin', 'manager', 'waiter', 'cashier', 'chef'].includes(rawRole) ? rawRole : 'cashier') as UserRole;
        setUser(parsed);
      } catch {
        localStorage.removeItem('rms_current_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authApi.login(email, password);
      
      if (result.success && result.user) {
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: (['admin', 'manager', 'waiter', 'cashier', 'chef'].includes((result.user.role || '').toLowerCase())
            ? result.user.role.toLowerCase()
            : 'cashier') as UserRole,
        };
        setUser(userData);
        localStorage.setItem('rms_current_user', JSON.stringify(userData));
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rms_current_user');
  };

  const hasPermission = (tab: string): boolean => {
    if (!user) return false;
    return rolePermissions[user.role]?.includes(tab) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
