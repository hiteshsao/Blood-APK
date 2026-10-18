import axiosInstance from './axiosInstance';

/**
 * Authentication and User Profile API methods
 */
export const authApi = {
  /**
   * Log in user with email and password
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(credentials) {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return response.data?.data;
  },

  /**
   * Register a new DONOR or RECIPIENT
   * @param {object} payload
   * @returns {Promise<{ token: string, user: object }>}
   */
  async register(payload) {
    const response = await axiosInstance.post('/api/auth/register', payload);
    return response.data?.data;
  },

  /**
   * Fetch current authenticated user summary
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data?.data;
  },

  /**
   * Fetch detailed user profile
   * @returns {Promise<object>}
   */
  async getMyProfile() {
    const response = await axiosInstance.get('/api/users/me');
    return response.data?.data;
  },

  /**
   * Update user GPS coordinates
   * @param {{ latitude: number, longitude: number }} location
   */
  async updateLocation(location) {
    const response = await axiosInstance.put('/api/users/location', location);
    return response.data?.data;
  },

  /**
   * Register device push notification token
   * @param {string} pushToken
   */
  async updatePushToken(pushToken) {
    const response = await axiosInstance.put('/api/users/push-token', { pushToken });
    return response.data?.data;
  },
};

export default authApi;
