import axiosInstance from './axiosInstance';

export const configApi = {
  /**
   * Public runtime config and feature flags (no login needed).
   * @returns {Promise<{ appName: string, minAppVersion: string, features: object }>}
   */
  async getAppConfig() {
    const response = await axiosInstance.get('/api/app/config', { timeout: 8000 });
    return response.data?.data;
  },
};

export default configApi;
