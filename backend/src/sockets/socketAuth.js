import { verifyAccessToken } from '../services/token.service.js';

/**
 * Socket.IO handshake auth. The client connects with
 * `io(url, { auth: { token: <accessToken> } })`; we verify it and attach the
 * user id to the socket. Rejects the connection if the token is missing/invalid.
 */
export function socketAuth(socket, next) {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!raw) return next(new Error('Authentication required'));

    const payload = verifyAccessToken(raw);
    if (payload.type !== 'access') return next(new Error('Invalid token'));

    socket.userId = payload.sub;
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
}
