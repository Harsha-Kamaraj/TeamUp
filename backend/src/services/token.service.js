/**
 * Token service — the one place that mints and validates tokens.
 *
 *   Access token  : short-lived JWT (stateless). Sent in the JSON body and
 *                   used by the client in the `Authorization: Bearer` header.
 *   Refresh token : long-lived opaque random string (stateful). Stored hashed
 *                   in the RefreshToken collection and sent to the client in
 *                   an httpOnly cookie. Rotated on every use, revocable on logout.
 */
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';
import { generateToken, hashToken } from '../utils/crypto.utils.js';

const REFRESH_TTL_MS = env.auth.refreshTokenExpiresDays * 24 * 60 * 60 * 1000;

/** Sign a short-lived access token for a user. */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id.toString(), role: user.role, type: 'access' },
    env.auth.accessTokenSecret,
    { expiresIn: env.auth.accessTokenExpiresIn }
  );
}

/** Verify an access token; throws jwt errors (handled upstream). */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.auth.accessTokenSecret);
}

/**
 * Create and persist a new refresh token for a user.
 * @returns {Promise<{ token: string, expiresAt: Date }>} the RAW token.
 */
export async function issueRefreshToken(userId, meta = {}) {
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await RefreshToken.create({
    user: userId,
    tokenHash: hash,
    expiresAt,
    createdByIp: meta.ip,
    userAgent: meta.userAgent,
  });

  return { token: raw, expiresAt };
}

/**
 * Validate a raw refresh token and rotate it: the presented token is deleted
 * and a brand-new one is issued for the same user. Reusing a rotated token
 * therefore fails — which limits the damage from a stolen token.
 *
 * @returns {Promise<{ userId, token: string, expiresAt: Date }>}
 */
export async function rotateRefreshToken(rawToken, meta = {}) {
  if (!rawToken) throw ApiError.unauthorized('Missing refresh token');

  const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!existing) throw ApiError.unauthorized('Invalid or expired session');

  const userId = existing.user;
  // Consume the old token (single-use), then mint a replacement.
  await existing.deleteOne();
  const { token, expiresAt } = await issueRefreshToken(userId, meta);
  return { userId, token, expiresAt };
}

/** Revoke a single refresh token (logout on this device). No-op if absent. */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
}

/** Revoke every refresh token for a user (logout everywhere / after reset). */
export async function revokeAllUserTokens(userId) {
  await RefreshToken.deleteMany({ user: userId });
}
