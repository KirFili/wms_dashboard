import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, LoginRequest } from '../types';
import * as authService from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback(
    (role: string) => user?.role === role,
    [user],
  );

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login(data);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      authService.getMe()
        .then((u) => {
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('access_token');
        });
    }
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not found');
  return ctx;
}
