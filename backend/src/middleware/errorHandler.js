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
    // Duplicate key (unique index violation). Only surface the field name when
    // it's something the user actually typed — internal keys like `pairKey`
    // mean nothing to them and leak schema details.
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    const USER_FACING = { email: 'email', name: 'name', title: 'title' };
    message = USER_FACING[field]
      ? `That ${USER_FACING[field]} is already in use`
      : 'That already exists.';
    logger.warn(`Duplicate key on "${field}" — ${JSON.stringify(err.keyValue)}`);
  } else if (err.name === 'MulterError') {
    // File upload issues (e.g. too large, unexpected field). The size cap
    // differs per upload, so report the one that actually applied rather than
    // a single hardcoded number.
    statusCode = 400;
    const LIMIT_MB = { avatar: 2, resume: 5, file: 8 };
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large (max ${LIMIT_MB[err.field] ?? 8} MB)`
        : `Upload error: ${err.message}`;
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
