import apiClient from './axiosClient';

/**
 * User/profile API — thin wrappers around the backend /users endpoints.
 * Each returns the unwrapped user object.
 */
export const userApi = {
  getProfile: (id) => apiClient.get(`/users/${id}`).then((r) => r.data.data.user),

  updateProfile: (data) => apiClient.patch('/users/me', data).then((r) => r.data.data.user),

  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return apiClient.post('/users/me/avatar', form).then((r) => r.data.data.user);
  },

  removeAvatar: () => apiClient.delete('/users/me/avatar').then((r) => r.data.data.user),
};
