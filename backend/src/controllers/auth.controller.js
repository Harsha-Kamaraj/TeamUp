import User from '../models/User.js';
import env from '../config/env.js';
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
} from '../services/email.service.js';
import { notifySystem } from '../services/notification.service.js';

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
  await user.save(); // hashes password + persists verification hash

  await sendVerificationEmail(user, rawVerifyToken);

  // Welcome notification (waiting in the bell when they first look).
  await notifySystem({
    userId: user.id,
    text: 'Welcome to TeamUp! Complete your profile to get noticed.',
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
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await startSession(req, res, user);
  res.json(new ApiResponse(200, { user, accessToken }, 'Logged in successfully'));
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
  await sendVerificationEmail(user, rawVerifyToken);

  res.json(new ApiResponse(200, null, 'Verification email sent'));
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
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Invalidate every existing session, then start a fresh one on this device.
  await revokeAllUserTokens(user.id);
  const accessToken = await startSession(req, res, user);

  res.json(new ApiResponse(200, { accessToken }, 'Password changed successfully'));
});
