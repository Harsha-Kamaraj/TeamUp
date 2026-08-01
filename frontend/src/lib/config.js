/**
 * App configuration derived from Vite env vars.
 * Only variables prefixed with VITE_ are exposed to the client bundle.
 */
export const config = {
  // In production this is the RELATIVE path "/api/v1". Vercel rewrites it to
  // the Render backend (see vercel.json), so the browser treats the API as
  // same-origin and the refresh-token cookie is first-party — otherwise Safari
  // and Brave block it as a third-party cookie and sessions don't survive a
  // refresh. Locally it points straight at the dev server.
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api/v1',

  // Socket.IO must bypass that rewrite: Vercel's proxy doesn't forward
  // WebSocket upgrades, so chat connects directly to the backend origin. This
  // is safe cross-origin because the handshake authenticates with a token
  // rather than a cookie (see sockets/socketAuth.js).
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5001',

  // OAuth 2.0 Web client ID from Google Cloud Console. Optional: when empty,
  // the Google button simply isn't rendered and email/password login is
  // unaffected. Must match GOOGLE_CLIENT_ID on the backend.
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',

  appName: 'Squadly',
};
