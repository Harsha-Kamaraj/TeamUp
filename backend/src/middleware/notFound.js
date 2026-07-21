import ApiError from '../utils/ApiError.js';

/**
 * Catches any request that didn't match a route and forwards a 404 to the
 * central error handler. Mounted after all routes.
 */
export default function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
