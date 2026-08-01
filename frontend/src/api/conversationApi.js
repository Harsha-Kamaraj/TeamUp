import apiClient from './axiosClient';

/** Conversation/chat REST API — returns unwrapped payloads. */
export const conversationApi = {
  list: () => apiClient.get('/conversations').then((r) => r.data.data.conversations),

  // Start (or fetch existing) conversation with a user; optional post context.
  start: (userId, postId) =>
    apiClient.post('/conversations', { userId, postId }).then((r) => r.data.data.conversation),

  // Create (or sync) the group chat for a post's team. Lead only.
  createTeam: (postId, name) =>
    apiClient.post('/conversations/team', { postId, name }).then((r) => r.data.data.conversation),

  messages: (id, params = {}) =>
    apiClient.get(`/conversations/${id}/messages`, { params }).then((r) => r.data.data),

  // Upload a chat file first; the returned metadata is then attached to a
  // socket message. Binary doesn't belong on the websocket.
  uploadAttachment: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post(`/conversations/${id}/attachment`, form)
      .then((r) => r.data.data.attachment);
  },
};
