import apiClient from './axiosClient';

/** Post/opportunity API — returns unwrapped payloads. */
export const postApi = {
  create: (data) => apiClient.post('/posts', data).then((r) => r.data.data.post),

  getById: (id) => apiClient.get(`/posts/${id}`).then((r) => r.data.data.post),

  update: (id, data) => apiClient.patch(`/posts/${id}`, data).then((r) => r.data.data.post),

  remove: (id) => apiClient.delete(`/posts/${id}`).then((r) => r.data),

  getMine: () => apiClient.get('/posts/me').then((r) => r.data.data.posts),
};
