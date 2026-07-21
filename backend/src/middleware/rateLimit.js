import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

/**
 * Stricter limiter for auth-sensitive endpoints (login, register, password
 * reset) to blunt brute-force and abuse. Skipped in the test environment so
 * automated tests aren't throttled.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // per IP per window — tune down in production if desired
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
