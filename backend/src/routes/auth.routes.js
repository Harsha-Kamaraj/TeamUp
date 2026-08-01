import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validators.js';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
// Google Sign-In: the body carries a Google ID token, verified server-side.
router.post('/google', authLimiter, authController.googleAuth);

// The refresh cookie is the credential here, so no `protect`.
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ── Authenticated ───────────────────────────────────────────────────────
router.get('/me', protect, authController.getMe);
router.post('/resend-verification', protect, authController.resendVerification);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

export default router;
