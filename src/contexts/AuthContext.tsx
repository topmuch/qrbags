'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// User type
export interface User {
  id: string;
  email: string;
  name: string | null;
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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAgency: boolean;
  refreshSession: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  isAuthenticated: false,
  isSuperAdmin: false,
  isAgency: false,
  refreshSession: async () => {},
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch session from server (cookie-based)
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state from server session
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Login function - called after successful login API call
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // Logout function - calls logout API and clears state
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  }, []);

  // Refresh session from server
  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

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
        refreshSession,
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
  const { user, loading, logout, refreshSession } = useAuth();
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

  return { user, loading, logout, refreshSession };
}

export default AuthContext;
