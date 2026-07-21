import env from '../config/env.js';
import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Central error handler — the single place that converts any thrown error
 * into a consistent JSON response:
 *   { success: false, message, errors, stack? }
 *
 * Must be mounted LAST (after routes and notFound). Express recognizes it
 * as an error handler because it takes four arguments.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Normalize a few common non-ApiError cases into friendly responses.
  if (err.name === 'ValidationError') {
    // Mongoose schema validation
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === 'CastError') {
    // e.g. a malformed Mongo ObjectId in the URL
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // Duplicate key (unique index violation)
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] ?? 'field';
    message = `That ${field} is already in use`;
  } else if (err.name === 'MulterError') {
    // File upload issues (e.g. too large, unexpected field)
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 2 MB)' : `Upload error: ${err.message}`;
  }

  // Log server-side. 5xx are real problems; 4xx are expected client errors.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${statusCode} ${message}`);
  }

  const payload = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  };

  // Only leak stack traces in non-production for easier debugging.
  if (!env.isProduction && !(err instanceof ApiError)) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
