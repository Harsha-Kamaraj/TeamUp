/**
 * Express application assembly.
 *
 * This file builds and configures the app (middleware + routes) but does NOT
 * start listening — that's server.js's job. Keeping them separate makes the
 * app importable for testing and keeps startup concerns in one place.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import logger from './utils/logger.js';
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
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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

// Basic global rate limit to blunt abuse. Tighter, route-specific limits
// (e.g. on login) come in later phases.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // requests per window per IP
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
    message: 'TeamUp API',
    docs: `${env.apiPrefix}/health`,
  });
});

app.use(env.apiPrefix, apiRoutes);

// ── Fallbacks (must be last) ───────────────────────────────────────────────
app.use(notFound); // 404 for unmatched routes
app.use(errorHandler); // central error → JSON

export default app;
