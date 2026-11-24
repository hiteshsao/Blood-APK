import axiosInstance from './axiosInstance';

export const authApi = {
  /**
   * Request a 6-digit login OTP code for the given email
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async sendOtp(email) {
    const response = await axiosInstance.post('/api/auth/otp/send', {
      email: email.trim().toLowerCase(),
    });
    return response.data;
  },

  /**
   * Verify 6-digit OTP code and retrieve authentication token and user profile
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{ token: string, user: object }>}
   */
  async verifyOtp(email, otp) {
    const response = await axiosInstance.post('/api/auth/otp/verify', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    return response.data?.data;
  },
};

export default authApi;
