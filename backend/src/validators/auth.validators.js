import { z } from 'zod';

/**
 * Zod schemas for auth requests. Reused, composable building blocks keep
 * validation rules consistent (e.g. the same password policy for register
 * and reset).
 *
 * NOTE: Zod v4 uses a single `error` option for custom messages (the old
 * `required_error`/`invalid_type_error` options were removed).
 */

// Regex-based checks so behavior is identical across Zod versions.
const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email');

const strongPassword = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name must be at most 60 characters');

const token = z.string({ error: 'Token is required' }).min(1, 'Token is required');

export const registerSchema = z.object({
  name,
  email,
  password: strongPassword,
});

export const loginSchema = z.object({
  email,
  // On login we only check presence — the real check is the password compare.
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({ token });

export const resendVerificationSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token,
  password: strongPassword,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: strongPassword,
});
