/**
 * In-memory access-token store.
 *
 * The access token lives in a module variable (not localStorage) so it's
 * cleared on refresh and never exposed to other tabs or persisted where XSS
 * could read it. The long-lived session is the httpOnly refresh cookie the
 * backend sets; on page load the app calls /auth/refresh to obtain a new
 * access token (wired up by the AuthContext in Phase 4).
 */
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function clearAccessToken() {
  accessToken = null;
}
