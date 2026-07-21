import ApiError from '../utils/ApiError.js';

/**
 * validate(schema, source) — request validation middleware.
 *
 * Runs a Zod schema against a part of the request (`body` by default).
 * On success it replaces that part with the parsed value (trimmed/coerced/
 * stripped of unknown keys). On failure it forwards a 400 with per-field
 * messages through the central error handler.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), authController.login);
 */
export default function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', errors));
    }
    req[source] = result.data;
    return next();
  };
}
