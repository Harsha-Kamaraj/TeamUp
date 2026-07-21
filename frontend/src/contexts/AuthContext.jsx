import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/authApi';
import { setOnAuthFailure } from '@/api/axiosClient';
import { setAccessToken, clearAccessToken } from '@/lib/authToken';

const AuthContext = createContext(null);

/**
 * AuthProvider — holds the current user and session status, and exposes auth
 * actions. On mount it attempts to restore the session:
 *   - calls /auth/me with no access token → backend 401s
 *   - the axios interceptor calls /auth/refresh using the httpOnly cookie
 *   - on success it retries /auth/me and we get the user (authenticated)
 *   - on failure we settle into "unauthenticated"
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' until we know; then 'authenticated' | 'unauthenticated'.
  const [status, setStatus] = useState('loading');

  // Restore session on first load + react to unrecoverable auth failures.
  useEffect(() => {
    // If a background refresh ultimately fails, drop to logged-out state.
    setOnAuthFailure(() => {
      clearAccessToken();
      setUser(null);
      setStatus('unauthenticated');
    });

    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, accessToken } = await authApi.login(credentials);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    setStatus('authenticated');
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, accessToken } = await authApi.register(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    setStatus('authenticated');
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // revoke refresh token + clear cookie server-side
    } catch {
      // Even if the request fails, clear local state.
    }
    clearAccessToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  /** Re-fetch the current user (e.g. after verifying email). */
  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth state and actions. Must be used within <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
