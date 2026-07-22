/**
 * Centralized environment configuration.
 *
 * We load `.env` exactly once here and export a single, typed-ish `env`
 * object. Every other module imports from here instead of reading
 * `process.env` directly — that gives us one place to validate, default,
 * and document configuration.
 */
import dotenv from 'dotenv';

// `quiet: true` suppresses dotenv's startup banner for clean logs.
dotenv.config({ quiet: true });

/**
 * Read an env var, falling back to a default. If a var is required and
 * missing (and no default is given), we collect it so we can fail fast
 * with a single, clear message instead of a vague crash later.
 */
const missing = [];

function read(key, { required = false, fallback = undefined } = {}) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (required) missing.push(key);
    return fallback;
  }
  return value;
}

const nodeEnv = read('NODE_ENV', { fallback: 'development' });
const isProduction = nodeEnv === 'production';

// Default 5001, not 5000 — macOS Control Center/AirPlay occupies 5000.
const port = Number(read('PORT', { fallback: '5001' }));

const env = {
  nodeEnv,
  isProduction,
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  port,
  apiPrefix: read('API_PREFIX', { fallback: '/api/v1' }),

  // Public URL of this backend — used to build absolute URLs for locally
  // stored uploads. In production set SERVER_URL to your Render URL.
  serverUrl: read('SERVER_URL', { fallback: `http://localhost:${port}` }),

  // Accept a comma-separated list of allowed origins for CORS.
  clientUrls: read('CLIENT_URL', { fallback: 'http://localhost:5173' })
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  // The database. The server can still boot and answer /health without it
  // (we warn instead of crashing), but auth features need it connected.
  mongoUri: read('MONGODB_URI', { required: false }),

  // ── Authentication (Phase 2) ────────────────────────────────────────────
  auth: {
    // Secret for signing short-lived access tokens. REQUIRED — we never ship
    // a default. Generate one with: openssl rand -hex 64
    accessTokenSecret: read('JWT_ACCESS_SECRET', { required: true }),
    // Access tokens are short-lived; the refresh token keeps sessions alive.
    accessTokenExpiresIn: read('JWT_ACCESS_EXPIRES_IN', { fallback: '15m' }),
    // Refresh tokens are opaque random strings stored (hashed) in the DB.
    refreshTokenExpiresDays: Number(read('REFRESH_TOKEN_EXPIRES_DAYS', { fallback: '7' })),
    // Minutes a verification / password-reset link stays valid.
    emailTokenExpiresMinutes: Number(read('EMAIL_TOKEN_EXPIRES_MINUTES', { fallback: '60' })),
  },

  // ── Refresh-token cookie settings ───────────────────────────────────────
  cookie: {
    name: 'refreshToken',
    // Optional explicit domain in production (e.g. ".squadly.app").
    domain: read('COOKIE_DOMAIN', { fallback: undefined }),
    // Cross-site (Vercel ↔ Render) needs SameSite=None + Secure in prod.
    // Locally (http) we use Lax so the cookie still works over plain HTTP.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  },

  // ── Email (transport wired up fully in Phase 9) ─────────────────────────
  email: {
    from: read('EMAIL_FROM', { fallback: 'Squadly <no-reply@squadly.local>' }),
    smtp: {
      host: read('SMTP_HOST', { fallback: undefined }),
      port: Number(read('SMTP_PORT', { fallback: '587' })),
      user: read('SMTP_USER', { fallback: undefined }),
      pass: read('SMTP_PASS', { fallback: undefined }),
    },
  },

  // ── Image upload — Cloudinary (Phase 5) ─────────────────────────────────
  // Optional: if unset, avatar upload is disabled with a clear message and
  // the rest of the app works fine.
  cloudinary: {
    cloudName: read('CLOUDINARY_CLOUD_NAME', { fallback: undefined }),
    apiKey: read('CLOUDINARY_API_KEY', { fallback: undefined }),
    apiSecret: read('CLOUDINARY_API_SECRET', { fallback: undefined }),
  },
};

// True only when all three Cloudinary credentials are present.
env.cloudinary.isConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy backend/.env.example to backend/.env and fill in the values.'
  );
}

export default env;
