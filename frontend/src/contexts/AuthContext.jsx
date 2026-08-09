import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/api/authApi';
import { setOnAuthFailure, isTransientServerError } from '@/api/axiosClient';
import { setAccessToken, clearAccessToken } from '@/lib/authToken';

const AuthContext = createContext(null);

// Session restore rides out a cold-starting backend for roughly a minute
// (Render's free tier takes ~50s to wake) before concluding we're logged out.
const SESSION_RESTORE_RETRIES = 12;
const SESSION_RESTORE_RETRY_DELAY_MS = 5000;

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
  // True while we're waiting on a backend that's cold-starting, so the UI can
  // explain the delay instead of looking broken.
  const [isServerWaking, setIsServerWaking] = useState(false);

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
      // A free-tier backend can be asleep on first paint. Its cold start shows
      // up as a gateway error, which says nothing about whether we're logged
      // in — so ride those out rather than declaring the user logged out and
      // flashing "Log in / Sign up" at someone who has a perfectly good session.
      for (let attempt = 0; ; attempt += 1) {
        try {
          const me = await authApi.getMe();
          if (cancelled) return;
          setUser(me);
          setStatus('authenticated');
          setIsServerWaking(false);
          return;
        } catch (error) {
          if (cancelled) return;
          if (isTransientServerError(error) && attempt < SESSION_RESTORE_RETRIES) {
            setIsServerWaking(true);
            await new Promise((r) => setTimeout(r, SESSION_RESTORE_RETRY_DELAY_MS));
            continue;
          }
          setUser(null);
          setStatus('unauthenticated');
          setIsServerWaking(false);
          return;
        }
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

  /** Exchange a Google ID token for a Squadly session. Same shape as login. */
  const loginWithGoogle = useCallback(async (credential) => {
    const { user: googleUser, accessToken } = await authApi.google(credential);
    setAccessToken(accessToken);
    setUser(googleUser);
    setStatus('authenticated');
    return googleUser;
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

  /** Replace the current user with a fresh copy (e.g. after a profile save). */
  const updateCurrentUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isServerWaking,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshUser,
      updateCurrentUser,
    }),
    [
      user,
      status,
      isServerWaking,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshUser,
      updateCurrentUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access auth state and actions. Must be used within <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
