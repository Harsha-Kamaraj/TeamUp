/**
 * Extract a user-friendly message from an Axios error thrown by our API.
 *
 * The backend returns errors as { success:false, message, errors?:[{field,message}] }.
 * We prefer the first field-level error, then the top-level message, then a
 * generic fallback.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors[0].message;
  if (data?.message) return data.message;
  if (error?.message && error.message !== 'Network Error') return error.message;
  if (error?.message === 'Network Error') return 'Cannot reach the server. Is the backend running?';
  return fallback;
}
