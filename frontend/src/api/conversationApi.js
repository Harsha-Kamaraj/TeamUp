import apiClient from './axiosClient';

/** Conversation/chat REST API — returns unwrapped payloads. */
export const conversationApi = {
  list: () => apiClient.get('/conversations').then((r) => r.data.data.conversations),

  // Start (or fetch existing) conversation with a user; optional post context.
  start: (userId, postId) =>
    apiClient.post('/conversations', { userId, postId }).then((r) => r.data.data.conversation),

  messages: (id, params = {}) =>
    apiClient.get(`/conversations/${id}/messages`, { params }).then((r) => r.data.data),
};
