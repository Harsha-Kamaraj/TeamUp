import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

/**
 * Stricter limiter for auth-sensitive endpoints (login, register, password
 * reset) to blunt brute-force and abuse. Skipped in the test environment so
 * automated tests aren't throttled.
 *
 * Still far tighter than the global limit, but not 30: a campus shares one
 * outbound IP, so during a signup rush (hackathon announcement, club demo)
 * legitimate students would otherwise lock each other out of registering.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // per IP per window — a shared campus IP, not a single person
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
