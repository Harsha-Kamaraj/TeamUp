/**
 * asyncHandler — wraps an async route handler so thrown errors (or rejected
 * promises) are forwarded to Express's error middleware automatically.
 *
 * Without this, every async controller would need its own try/catch just to
 * call `next(err)`. With it, you can simply `throw new ApiError(...)`.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export default function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
