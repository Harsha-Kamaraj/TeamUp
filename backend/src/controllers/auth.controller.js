import { OAuth2Client } from 'google-auth-library';

import User from '../models/User.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { hashToken } from '../utils/crypto.utils.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/token.service.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
} from '../services/email.service.js';
import { notifySystem } from '../services/notification.service.js';

// Verifies Google ID tokens. Constructed once; harmless when Google is unset
// because the endpoint refuses the request before ever calling it.
const googleClient = new OAuth2Client(env.google.clientId);

// Small audit trail attached to each refresh-token session.
function sessionMeta(req) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

// Issue a fresh access token + a rotated refresh cookie for `user`.
async function startSession(req, res, user) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user.id, sessionMeta(req));
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

/**
 * POST /auth/register
 * Create an account, email a verification link, and log the user in.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User({ name, email, password });
  const rawVerifyToken = user.createEmailVerificationToken();

  // Local development with no mail provider would otherwise be a dead end:
  // verification is required to post, but no link can ever arrive. Auto-verify
  // in that exact situation so the app is usable offline.
  //
  // This CANNOT weaken production: it requires NODE_ENV=development *and* no
  // SMTP credentials. On Render both are false, so the gate stays enforced.
  const cannotDeliverMail = env.isDevelopment && !isEmailConfigured();
  if (cannotDeliverMail) {
    user.isEmailVerified = true;
    logger.warn(
      `Auto-verified ${email}: development mode with no SMTP configured. ` +
        'Set SMTP_* in backend/.env to exercise the real verification flow.'
    );
  }

  await user.save(); // hashes password + persists verification hash

  if (!cannotDeliverMail) await sendVerificationEmail(user, rawVerifyToken);

  // Welcome notification (waiting in the bell when they first look).
  await notifySystem({
    userId: user.id,
    text: 'Welcome to Squadly! Complete your profile to get noticed.',
    link: '/settings/profile',
  }).catch(() => {});

  const accessToken = await startSession(req, res, user);
  res
    .status(201)
    .json(new ApiResponse(201, { user, accessToken }, 'Account created. Please verify your email.'));
});

/**
 * POST /auth/login
 * Verify credentials and start a session.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // `+password` because it's select:false by default.
  const user = await User.findOne({ email }).select('+password +googleId');

  // Point Google-only accounts at the right button instead of a dead end.
  if (user && !user.password && user.googleId) {
    throw ApiError.badRequest('This account uses Google Sign-In. Use the Google button to log in.');
  }

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await startSession(req, res, user);
  res.json(new ApiResponse(200, { user, accessToken }, 'Logged in successfully'));
});

/**
 * POST /auth/google
 * Sign in (or sign up) with a Google ID token obtained in the browser via
 * Google Identity Services.
 *
 * Google has already proven the user controls the address, so these accounts
 * skip our own email-verification step entirely.
 *
 * Linking rule: if an account already exists for the same email, we attach the
 * Google id to it rather than creating a duplicate — so someone who registered
 * with a password can later use the Google button and land in the same account.
 */
export const googleAuth = asyncHandler(async (req, res) => {
  if (!env.google.clientId) {
    throw ApiError.badRequest('Google Sign-In is not configured on this server');
  }

  const { credential } = req.body;
  if (!credential) throw ApiError.badRequest('Missing Google credential');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.google.clientId, // rejects tokens minted for another app
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Could not verify your Google sign-in. Please try again.');
  }

  // Google sets this false for unverified Workspace addresses.
  if (!payload?.email || payload.email_verified === false) {
    throw ApiError.unauthorized('Your Google account has no verified email address');
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] }).select('+googleId');

  if (user) {
    // Link on first Google sign-in for an existing password account.
    if (!user.googleId) user.googleId = payload.sub;
    // Signing in through Google proves the address; trust it.
    if (!user.isEmailVerified) user.isEmailVerified = true;
    if (!user.avatar && payload.picture) user.avatar = payload.picture;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
  } else {
    user = await User.create({
      name: payload.name?.trim() || email.split('@')[0],
      email,
      googleId: payload.sub,
      isEmailVerified: true,
      avatar: payload.picture || '',
      lastLoginAt: new Date(),
    });

    await notifySystem({
      userId: user.id,
      text: 'Welcome to Squadly! Complete your profile to get noticed.',
      link: '/settings/profile',
    }).catch(() => {});
  }

  const accessToken = await startSession(req, res, user);
  res.json(new ApiResponse(200, { user, accessToken }, 'Signed in with Google'));
});

/**
 * POST /auth/refresh
 * Exchange the refresh cookie for a new access token (and rotate the cookie).
 * Does NOT require an access token — the httpOnly cookie is the credential.
 */
export const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[env.cookie.name];
  const { userId, token: newRefresh } = await rotateRefreshToken(rawToken, sessionMeta(req));

  const user = await User.findById(userId);
  if (!user) {
    clearRefreshCookie(res);
    throw ApiError.unauthorized('Session is no longer valid');
  }

  setRefreshCookie(res, newRefresh);
  const accessToken = signAccessToken(user);
  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

/**
 * POST /auth/logout
 * Revoke the current refresh token and clear the cookie.
 */
export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[env.cookie.name];
  await revokeRefreshToken(rawToken);
  clearRefreshCookie(res);
  res.json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * GET /auth/me
 * Return the currently authenticated user.
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { user: req.user }, 'Current user'));
});

/**
 * POST /auth/verify-email
 * Confirm an email address using the token from the emailed link.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired verification link');

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.json(new ApiResponse(200, { user }, 'Email verified successfully'));
});

/**
 * POST /auth/resend-verification  (requires login)
 * Re-issue a verification email to the logged-in user.
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.isEmailVerified) throw ApiError.badRequest('Your email is already verified');

  const rawVerifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const { delivered } = await sendVerificationEmail(user, rawVerifyToken);

  // Be honest when mail isn't actually configured (or the provider refused) —
  // claiming "sent" leaves the user waiting on an email that will never come.
  res.json(
    new ApiResponse(
      200,
      { delivered },
      delivered
        ? 'Verification email sent'
        : 'Email delivery is not configured on this server yet. The verification link was written to the server logs.'
    )
  );
});

/**
 * POST /auth/forgot-password
 * Email a reset link. Always responds success to avoid leaking which emails
 * are registered (enumeration protection).
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    const rawResetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user, rawResetToken);
  }

  res.json(
    new ApiResponse(200, null, 'If an account exists for that email, a reset link has been sent.')
  );
});

/**
 * POST /auth/reset-password
 * Set a new password using the emailed reset token, then revoke all sessions.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired reset link');

  user.password = password; // pre-save hook hashes it + stamps passwordChangedAt
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Force re-login everywhere for safety.
  await revokeAllUserTokens(user.id);
  clearRefreshCookie(res);

  res.json(new ApiResponse(200, null, 'Password reset successfully. Please log in.'));
});

/**
 * POST /auth/change-password  (requires login)
 * Change password while logged in; rotates the current device's session.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // An account created through Google has no password to confirm. Rather than
  // dead-ending it, treat this as setting a first password — the user keeps
  // Google Sign-In and gains email/password login alongside it.
  const isSettingFirstPassword = !user.password;

  if (!isSettingFirstPassword) {
    if (!currentPassword) throw ApiError.badRequest('Current password is required');
    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.unauthorized('Current password is incorrect');
    }
  }

  user.password = newPassword;
  await user.save();

  // Invalidate every existing session, then start a fresh one on this device.
  await revokeAllUserTokens(user.id);
  const accessToken = await startSession(req, res, user);

  res.json(
    new ApiResponse(
      200,
      { accessToken },
      isSettingFirstPassword ? 'Password set successfully' : 'Password changed successfully'
    )
  );
});
