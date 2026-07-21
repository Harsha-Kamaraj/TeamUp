/**
 * Small helpers for one-time secret tokens (email verification, password
 * reset, refresh tokens).
 *
 * Pattern: we generate a random `raw` token, hand `raw` to the user (email
 * link or cookie), and store only `hash` (SHA-256 of raw) in the database.
 * Later we hash the incoming raw token and compare. This way a database
 * leak never exposes usable tokens.
 */
import crypto from 'node:crypto';

/** Deterministically hash a raw token for safe storage/lookup. */
export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Create a fresh token pair.
 * @param {number} bytes  entropy in bytes (default 32 → 64 hex chars)
 * @returns {{ raw: string, hash: string }}
 */
export function generateToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString('hex');
  return { raw, hash: hashToken(raw) };
}
