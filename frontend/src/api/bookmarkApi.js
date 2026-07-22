import apiClient from './axiosClient';

/** Bookmarks API. list() returns the saved posts (populated). */
export const bookmarkApi = {
  list: () => apiClient.get('/bookmarks').then((r) => r.data.data.posts),
  add: (postId) => apiClient.post(`/posts/${postId}/bookmark`).then((r) => r.data),
  remove: (postId) => apiClient.delete(`/posts/${postId}/bookmark`).then((r) => r.data),
};
