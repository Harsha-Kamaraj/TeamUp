import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../services/token.service.js';

/**
 * protect — gate for routes that require a logged-in user.
 *
 * Reads the `Authorization: Bearer <token>` header, verifies the access
 * token, loads the user, and attaches it as `req.user`. Rejects tokens that
 * were issued before the user's password last changed.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  if (payload.type !== 'access') {
    throw ApiError.unauthorized('Invalid token type');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User account no longer exists');

  if (user.passwordChangedAfter(payload.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again.');
  }

  req.user = user;
  next();
});

/**
 * requireVerified — use after `protect` to block users who haven't confirmed
 * their email yet (applied to sensitive actions in later phases).
 */
export const requireVerified = (req, _res, next) => {
  if (!req.user?.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your email to continue'));
  }
  next();
};

/**
 * authorize(...roles) — role-based guard, e.g. `authorize('admin')`.
 * Use after `protect`.
 */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
