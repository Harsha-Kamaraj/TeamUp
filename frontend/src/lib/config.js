/**
 * App configuration derived from Vite env vars.
 * Only variables prefixed with VITE_ are exposed to the client bundle.
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api/v1',
  appName: 'Squadly',
};
