import apiClient from './axiosClient';

/** Interest workflow API — returns unwrapped payloads. */
export const interestApi = {
  express: (postId, message = '') =>
    apiClient.post(`/posts/${postId}/interest`, { message }).then((r) => r.data.data.interest),

  withdraw: (postId) => apiClient.delete(`/posts/${postId}/interest`).then((r) => r.data),

  // Author-only: who's interested in a given post.
  forPost: (postId) => apiClient.get(`/posts/${postId}/interests`).then((r) => r.data.data.interests),

  // The current user's own interests.
  mine: () => apiClient.get('/interests/mine').then((r) => r.data.data.interests),
};
