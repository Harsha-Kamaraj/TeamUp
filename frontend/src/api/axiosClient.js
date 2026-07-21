import axios from 'axios';
import { config } from '@/lib/config';
import { getAccessToken, setAccessToken, clearAccessToken } from '@/lib/authToken';

/**
 * Central Axios instance for all API calls.
 *
 * - `withCredentials: true` so the httpOnly refresh cookie is sent/received.
 * - Request interceptor attaches the in-memory access token.
 * - Response interceptor transparently refreshes the access token on a 401
 *   and retries the original request once. Concurrent 401s share a single
 *   refresh call ("single-flight") so we don't hammer /auth/refresh.
 *
 * The AuthContext (Phase 4) provides the access token via authToken.js and
 * can register an `onAuthFailure` handler to redirect to login when refresh
 * ultimately fails.
 */
const apiClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Optional hook the app can set to react to an unrecoverable auth failure.
let onAuthFailure = null;
export function setOnAuthFailure(handler) {
  onAuthFailure = handler;
}

// ── Request: attach the bearer token ──────────────────────────────────────
apiClient.interceptors.request.use((cfg) => {
  const token = getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Response: refresh-on-401 with single-flight ───────────────────────────
let refreshPromise = null;

async function refreshAccessToken() {
  // Use a bare axios call (not apiClient) to avoid interceptor recursion.
  const res = await axios.post(`${config.apiUrl}/auth/refresh`, {}, { withCredentials: true });
  const token = res.data?.data?.accessToken;
  setAccessToken(token);
  return token;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't attempt refresh for the auth endpoints themselves, and only retry once.
    const isAuthCall =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearAccessToken();
        onAuthFailure?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
