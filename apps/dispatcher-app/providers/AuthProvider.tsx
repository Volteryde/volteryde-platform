'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo, useCallback } from 'react';
import { getAuthServiceUrl } from '@volteryde/config';

type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DISPATCHER'
  | 'CUSTOMER_SUPPORT'
  | 'SYSTEM_SUPPORT'
  | 'PARTNER'
  | 'DRIVER'
  | 'FLEET_MANAGER';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  organizationId?: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  accessToken: string | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps { children: ReactNode; }

interface SessionResponse {
  authenticated: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    organizationId: string | null;
    emailVerified: boolean;
  };
  error?: string;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session', { credentials: 'same-origin' });
      if (!res.ok) {
        setAccessToken(null);
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }
      const data: SessionResponse = await res.json();
      if (!data.authenticated || !data.user || !data.token) {
        setAccessToken(null);
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }
      setAccessToken(data.token);
      setState({
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          roles: data.user.roles,
          organizationId: data.user.organizationId ?? undefined,
          emailVerified: data.user.emailVerified,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      setAccessToken(null);
      setState({ user: null, isAuthenticated: false, isLoading: false, error: 'Failed to load session' });
    }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (!state.isAuthenticated) {
      if (refreshTimerRef.current) { clearInterval(refreshTimerRef.current); refreshTimerRef.current = null; }
      return;
    }
    refreshTimerRef.current = setInterval(() => { fetchSession(); }, 5 * 60 * 1000);
    return () => { if (refreshTimerRef.current) { clearInterval(refreshTimerRef.current); refreshTimerRef.current = null; } };
  }, [state.isAuthenticated, fetchSession]);

  const logout = useCallback(async () => {
    try { await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }); } catch {}
    setAccessToken(null);
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    if (typeof window !== 'undefined') {
      const authUrl = getAuthServiceUrl();
      window.location.href = `${authUrl}/login?logout=true`;
    }
  }, []);

  const hasRole = useCallback((role: UserRole): boolean => state.user?.roles.includes(role) ?? false, [state.user]);
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => roles.some((r) => state.user?.roles.includes(r)), [state.user]);

  const contextValue: AuthContextValue = useMemo(
    () => ({ ...state, accessToken, refreshSession: fetchSession, logout, hasRole, hasAnyRole }),
    [state, accessToken, fetchSession, logout, hasRole, hasAnyRole],
  );

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { hasRole, hasAnyRole } = useAuth();
  if (Array.isArray(role)) return hasAnyRole(role);
  return hasRole(role);
}
