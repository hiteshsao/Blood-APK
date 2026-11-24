import axiosInstance from './axiosInstance';

/**
 * User Profile and Device API methods
 */
export const userApi = {
  /**
   * Get full profile of currently authenticated user
   * @returns {Promise<object>} UserProfileResponse
   */
  async getMyProfile() {
    const response = await axiosInstance.get('/api/users/me');
    return response.data?.data;
  },

  /**
   * Update user profile fields (name, phone, city, age, gender, bloodGroup)
   * @param {{ name?: string, phone?: string, city?: string, age?: number, gender?: string, bloodGroup?: string }} payload
   * @returns {Promise<object>} UserProfileResponse
   */
  async updateProfile(payload) {
    const response = await axiosInstance.put('/api/users/me', payload);
    return response.data?.data;
  },

  /**
   * Update GPS coordinates
   * @param {{ latitude: number, longitude: number }} coords
   * @returns {Promise<object>} UserProfileResponse
   */
  async updateLocation(coords) {
    const response = await axiosInstance.put('/api/users/location', coords);
    return response.data?.data;
  },

  /**
   * Register or update Expo push notification token
   * @param {string|null} pushToken
   * @returns {Promise<object>} UserProfileResponse
   */
  async updatePushToken(pushToken) {
    const response = await axiosInstance.put('/api/users/push-token', {
      pushToken: pushToken || null,
    });
    return response.data?.data;
  },

  /**
   * Clear device push token on logout
   * @returns {Promise<object>} UserProfileResponse
   */
  async clearPushToken() {
    const response = await axiosInstance.put('/api/users/push-token', {
      pushToken: null,
    });
    return response.data?.data;
  },

  /**
   * Enable (or update) the donor profile on a unified account.
   * @param {{ bloodGroup: string, age: number, gender?: string, available?: boolean }} payload bloodGroup in backend enum form, e.g. A_POSITIVE
   * @returns {Promise<object>} UserProfileResponse
   */
  async enableDonorProfile(payload) {
    const response = await axiosInstance.put('/api/users/donor-profile', payload);
    return response.data?.data;
  },

  /**
   * Save the user's selected city.
   * @param {number} cityId
   * @returns {Promise<object>} UserProfileResponse
   */
  async updateCity(cityId) {
    const response = await axiosInstance.put('/api/users/city', { cityId });
    return response.data?.data;
  },

  /**
   * Permanently delete user account and anonymize all personal data
   * @returns {Promise<object>}
   */
  async deleteAccount() {
    const response = await axiosInstance.delete('/api/users/me');
    return response.data;
  },
};

export default userApi;
