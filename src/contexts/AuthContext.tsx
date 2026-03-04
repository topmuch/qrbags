'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'agency';
  agencyId?: string | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAgency: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  isAgency: false,
});

// Storage key
const AUTH_STORAGE_KEY = 'qrbag_user';

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state from localStorage (run once on mount)
  useEffect(() => {
    const initAuth = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const userData = JSON.parse(stored) as User;
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    // Use setTimeout to ensure localStorage is available
    if (typeof window !== 'undefined') {
      setTimeout(initAuth, 0);
    }
  }, []);

  // Login function
  const login = useCallback((userData: User) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  // Computed values
  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'superadmin';
  const isAgency = user?.role === 'agency';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isAgency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(allowedRole?: 'superadmin' | 'agency') {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      const loginPath = allowedRole === 'superadmin' ? '/admin/connexion' : '/agence/connexion';
      router.replace(loginPath);
      return;
    }

    // Wrong role
    if (allowedRole && user.role !== allowedRole) {
      // Redirect to correct area
      if (user.role === 'superadmin') {
        router.replace('/admin/tableau-de-bord');
      } else {
        router.replace('/agence/tableau-de-bord');
      }
    }
  }, [user, loading, allowedRole, router, pathname]);

  return { user, loading, logout };
}

export default AuthContext;
