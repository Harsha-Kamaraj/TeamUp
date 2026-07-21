import apiClient from './axiosClient';

/** Post/opportunity API — returns unwrapped payloads. */
export const postApi = {
  // Public feed. Returns { posts, pagination }.
  list: ({ page = 1, limit = 12 } = {}) =>
    apiClient.get('/posts', { params: { page, limit } }).then((r) => r.data.data),

  create: (data) => apiClient.post('/posts', data).then((r) => r.data.data.post),

  getById: (id) => apiClient.get(`/posts/${id}`).then((r) => r.data.data.post),

  update: (id, data) => apiClient.patch(`/posts/${id}`, data).then((r) => r.data.data.post),

  remove: (id) => apiClient.delete(`/posts/${id}`).then((r) => r.data),

  getMine: () => apiClient.get('/posts/me').then((r) => r.data.data.posts),
};
