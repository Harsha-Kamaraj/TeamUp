import env from '../config/env.js';

/**
 * Centralized refresh-token cookie handling so the same flags are used when
 * setting and clearing it (mismatched path/domain is a classic "cookie won't
 * clear" bug).
 *
 * - httpOnly  : JavaScript can't read it → not exposed to XSS.
 * - path      : scoped to the auth routes, so it's only sent where needed.
 * - sameSite/secure: 'none' + secure in production (cross-site Vercel↔Render),
 *                    'lax' + non-secure locally so it works over plain HTTP.
 */
const REFRESH_TTL_MS = env.auth.refreshTokenExpiresDays * 24 * 60 * 60 * 1000;
const COOKIE_PATH = `${env.apiPrefix}/auth`;

function baseOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    domain: env.cookie.domain, // undefined in dev = host-only cookie
    path: COOKIE_PATH,
  };
}

export function setRefreshCookie(res, token) {
  res.cookie(env.cookie.name, token, { ...baseOptions(), maxAge: REFRESH_TTL_MS });
}

export function clearRefreshCookie(res) {
  res.clearCookie(env.cookie.name, baseOptions());
}
