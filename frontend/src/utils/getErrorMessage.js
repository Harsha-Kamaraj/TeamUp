/**
 * Extract a user-friendly message from an Axios error thrown by our API.
 *
 * The backend returns errors as { success:false, message, errors?:[{field,message}] }.
 * We prefer the first field-level error, then the top-level message, then a
 * generic fallback.
 */
/**
 * True when a message came from the "email not verified" guard on the API
 * (see backend middleware/auth.middleware.js → requireVerified). Callers use
 * this to offer a way to verify instead of showing a dead-end error.
 */
export function needsEmailVerification(message) {
  return /verify your email/i.test(message ?? '');
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status;

  // A free-tier backend sleeps after inactivity and takes ~50s to wake, which
  // the proxy reports as a gateway error. "502" tells the user nothing; say
  // what's actually happening and that trying again will work.
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is waking up after being idle. Give it a moment and try again.';
  }

  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors[0].message;
  if (data?.message) return data.message;
  if (error?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  if (error?.message) return error.message;
  return fallback;
}
