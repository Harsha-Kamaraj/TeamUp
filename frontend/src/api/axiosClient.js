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

  // For file uploads, drop our default JSON content-type so the browser can
  // set multipart/form-data with the correct boundary.
  if (typeof FormData !== 'undefined' && cfg.data instanceof FormData) {
    if (typeof cfg.headers?.setContentType === 'function') cfg.headers.setContentType(null);
    else if (cfg.headers) delete cfg.headers['Content-Type'];
  }

  return cfg;
});

// ── Response: refresh-on-401 with single-flight ───────────────────────────
let refreshPromise = null;

/**
 * True for failures that mean "the server didn't answer", not "you're logged
 * out": a sleeping Render free instance (its cold start outlives the proxy's
 * timeout, surfacing as 502/503/504), or an outright network drop.
 *
 * These must never be mistaken for an auth failure — doing so logs a perfectly
 * valid session out just because the backend was waking up.
 */
export function isTransientServerError(error) {
  const status = error?.response?.status;
  if (status === undefined) return true; // network error / timeout — no response
  return status === 502 || status === 503 || status === 504;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function refreshAccessToken() {
  // Use a bare axios call (not apiClient) to avoid interceptor recursion.
  const res = await axios.post(`${config.apiUrl}/auth/refresh`, {}, { withCredentials: true });
  const token = res.data?.data?.accessToken;
  setAccessToken(token);
  return token;
}

// How many times a safe (idempotent) request rides out a sleeping backend, and
// how long to wait between attempts. Render's free cold start is ~50s, so three
// spaced retries cover it without leaving the user staring at a dead screen.
const GATEWAY_RETRIES = 3;
const GATEWAY_RETRY_DELAY_MS = 4000;

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
        // Only a refresh that was actually *rejected* means the session is
        // gone. A 502/504 from a cold-starting backend says nothing about the
        // cookie's validity, so keep the token and let the caller retry.
        if (!isTransientServerError(refreshError)) {
          clearAccessToken();
          onAuthFailure?.();
        }
        return Promise.reject(refreshError);
      }
    }

    // Retry safe requests while the backend wakes up. Only GET/HEAD are retried
    // automatically: a POST may already have been applied server-side before the
    // proxy gave up, and replaying it could duplicate the write.
    const method = (original?.method ?? 'get').toLowerCase();
    const isSafe = method === 'get' || method === 'head';
    if (original && isSafe && isTransientServerError(error)) {
      original._gatewayRetries = (original._gatewayRetries ?? 0) + 1;
      if (original._gatewayRetries <= GATEWAY_RETRIES) {
        await sleep(GATEWAY_RETRY_DELAY_MS);
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
