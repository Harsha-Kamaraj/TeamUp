import apiClient from './axiosClient';

/** Post/opportunity API — returns unwrapped payloads. */
export const postApi = {
  // Public feed with optional filters. Returns { posts, pagination }.
  list: ({ page = 1, limit = 12, search, type, mode } = {}) => {
    // Only send non-empty params to keep the query string clean.
    const params = { page, limit };
    if (search) params.search = search;
    if (type) params.type = type;
    if (mode) params.mode = mode;
    return apiClient.get('/posts', { params }).then((r) => r.data.data);
  },

  create: (data) => apiClient.post('/posts', data).then((r) => r.data.data.post),

  getById: (id) => apiClient.get(`/posts/${id}`).then((r) => r.data.data.post),

  update: (id, data) => apiClient.patch(`/posts/${id}`, data).then((r) => r.data.data.post),

  remove: (id) => apiClient.delete(`/posts/${id}`).then((r) => r.data),

  getMine: () => apiClient.get('/posts/me').then((r) => r.data.data.posts),
};
