import axiosInstance from './axiosInstance';

/**
 * In-App Notifications API methods
 */
export const notificationApi = {
  /**
   * Get user in-app notifications (paged, newest first)
   * @param {number} [page=0]
   * @param {number} [size=20]
   * @returns {Promise<{ content: Array, totalPages: number, totalElements: number, number: number }>}
   */
  async getNotifications(page = 0, size = 20) {
    const response = await axiosInstance.get('/api/notifications', {
      params: { page, size },
    });
    return response.data?.data;
  },

  /**
   * Get unread notifications count for logged in user
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    const response = await axiosInstance.get('/api/notifications/unread-count');
    return response.data?.data?.unreadCount ?? 0;
  },

  /**
   * Mark a single notification as read
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  async markAsRead(id) {
    const response = await axiosInstance.put(`/api/notifications/${id}/read`);
    return response.data?.data;
  },

  /**
   * Mark all unread notifications as read
   * @returns {Promise<{ markedCount: number }>}
   */
  async markAllAsRead() {
    const response = await axiosInstance.put('/api/notifications/read-all');
    return response.data?.data;
  },
};

export default notificationApi;
