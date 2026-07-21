import apiClient from './axiosClient';

/** Notifications API. list() returns { notifications, unreadCount }. */
export const notificationApi = {
  list: () => apiClient.get('/notifications').then((r) => r.data.data),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
};
