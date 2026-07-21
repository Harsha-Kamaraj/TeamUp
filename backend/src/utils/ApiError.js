/**
 * ApiError — a typed operational error.
 *
 * Controllers/services `throw new ApiError(404, 'Post not found')` and the
 * central error handler turns it into a clean JSON response. Carrying the
 * HTTP status on the error keeps handlers readable and consistent.
 */
export default class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status (e.g. 400, 401, 404, 500).
   * @param {string} message     Human-readable message safe to send to clients.
   * @param {Array}  [errors]    Optional list of field-level validation errors.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    // Flags "expected" errors so the handler won't treat them as bugs.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  // Common shortcuts for readability at call sites.
  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }
}
