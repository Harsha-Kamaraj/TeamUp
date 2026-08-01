import apiClient from './axiosClient';

/**
 * User/profile API — thin wrappers around the backend /users endpoints.
 * Each returns the unwrapped user object.
 */
export const userApi = {
  getProfile: (id) => apiClient.get(`/users/${id}`).then((r) => r.data.data.user),

  // Find students by name, college, or skill.
  search: (search) =>
    apiClient.get('/users', { params: { search } }).then((r) => r.data.data.users),

  updateProfile: (data) => apiClient.patch('/users/me', data).then((r) => r.data.data.user),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post('/users/me/avatar', form).then((r) => r.data.data.user);
  },

  removeAvatar: () => apiClient.delete('/users/me/avatar').then((r) => r.data.data.user),

  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return apiClient.post('/users/me/resume', form).then((r) => r.data.data.user);
  },

  removeResume: () => apiClient.delete('/users/me/resume').then((r) => r.data.data.user),
};
