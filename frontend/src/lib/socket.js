import { io } from 'socket.io-client';
import { config } from './config';
import { getAccessToken } from './authToken';

// The socket connects straight to the backend origin. It can't be derived from
// config.apiUrl any more: in production that's the relative "/api/v1" path that
// Vercel proxies, and a WebSocket can't go through that proxy.
const SOCKET_URL = config.socketUrl;

/**
 * Create a (not-yet-connected) Socket.IO client. The `auth` callback pulls the
 * latest in-memory access token on every (re)connect, so reconnects use a
 * fresh token. The SocketContext calls `.connect()` once the user is logged in.
 */
export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    // Prefer WebSocket, but keep long-polling as a fallback so chat still works
    // on restrictive campus/corporate networks that block WS upgrades.
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: getAccessToken() }),
  });
}
