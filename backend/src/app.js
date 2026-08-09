/**
 * Express application assembly.
 *
 * This file builds and configures the app (middleware + routes) but does NOT
 * start listening — that's server.js's job. Keeping them separate makes the
 * app importable for testing and keeps startup concerns in one place.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import logger from './utils/logger.js';
import ApiError from './utils/ApiError.js';
import apiRoutes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Behind Render/Vercel proxies we need this so rate-limit and secure cookies
// see the real client IP and protocol.
app.set('trust proxy', 1);

// ── Security & core middleware ────────────────────────────────────────────
app.use(helmet()); // sensible security headers

// CORS: only allow our known frontend origin(s), and allow cookies through
// (needed later for refresh-token cookies).
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl/Postman) which send no Origin header.
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      // A disallowed origin is a rejected request, not a server fault — pass an
      // ApiError so it comes back as 403 instead of a 500 that pollutes the
      // logs with fake "internal errors".
      return callback(ApiError.forbidden(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' })); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies
app.use(cookieParser()); // parse cookies (for refresh tokens later)
app.use(compression()); // gzip responses

// Request logging — concise in dev, standard combined format in production.
app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Basic global rate limit to blunt abuse. Tighter, route-specific limits live
// in middleware/rateLimit.js (e.g. the stricter authLimiter on login).
//
// The cap is deliberately generous because our users are students: a whole
// campus typically shares ONE outbound NAT IP, so an IP here can represent
// hundreds of people rather than one. A low cap locks out an entire college.
// (Per-user limiting would be tighter, but the key would have to come from an
// unverified token at this point in the chain — trivially forged, so worse.)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1200, // requests per window per IP (shared across a campus)
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// ── Routes ────────────────────────────────────────────────────────────────
// Friendly root so hitting the base URL isn't a 404.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Squadly API',
    docs: `${env.apiPrefix}/health`,
  });
});

// Locally-stored uploads (avatar fallback when Cloudinary isn't configured).
// CORP:cross-origin lets the frontend origin load these images via <img>.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

app.use(env.apiPrefix, apiRoutes);

// ── Fallbacks (must be last) ───────────────────────────────────────────────
app.use(notFound); // 404 for unmatched routes
app.use(errorHandler); // central error → JSON

export default app;
