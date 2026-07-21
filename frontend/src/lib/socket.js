import { io } from 'socket.io-client';
import { config } from './config';
import { getAccessToken } from './authToken';

// The socket connects to the API origin (without the /api/v1 path).
const SOCKET_URL = config.apiUrl.replace(/\/api\/v\d+\/?$/, '');

/**
 * Create a (not-yet-connected) Socket.IO client. The `auth` callback pulls the
 * latest in-memory access token on every (re)connect, so reconnects use a
 * fresh token. The SocketContext calls `.connect()` once the user is logged in.
 */
export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
    auth: (cb) => cb({ token: getAccessToken() }),
  });
}
