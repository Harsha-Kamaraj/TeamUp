import apiClient from './axiosClient';

/**
 * Auth API — thin wrappers around the backend /auth endpoints.
 * Each returns the unwrapped payload (our success envelope is { data: ... }).
 */
export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then((r) => r.data.data),

  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  getMe: () => apiClient.get('/auth/me').then((r) => r.data.data.user),

  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }).then((r) => r.data),

  resendVerification: () => apiClient.post('/auth/resend-verification').then((r) => r.data),

  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token, password) =>
    apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data),
};
