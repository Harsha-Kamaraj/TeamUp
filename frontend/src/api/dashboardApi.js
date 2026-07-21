import apiClient from './axiosClient';

/** Dashboard aggregates for the current user. Returns { stats, recentInterests }. */
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats').then((r) => r.data.data),
};
