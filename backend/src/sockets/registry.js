/**
 * Tiny holder for the Socket.IO server instance, so services (e.g. the
 * notification service) can emit to users without importing sockets/index.js
 * directly (which would create a require cycle).
 */
let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}

/** Emit an event to a specific user's personal room. No-op if sockets are off. */
export function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}
