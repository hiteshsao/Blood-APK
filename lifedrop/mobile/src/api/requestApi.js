import axiosInstance from './axiosInstance';

/**
 * Blood Request & Donor API methods
 */
export const requestApi = {
  /**
   * Get incoming requests where donor's response is PENDING
   * @returns {Promise<Array>} List of DonorIncomingRequestDto
   */
  async getIncomingRequests() {
    const response = await axiosInstance.get('/api/donor/requests');
    return response.data?.data || [];
  },

  /**
   * Get request details. Recipient phone included ONLY if accepted.
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>} DonorRequestDetailsDto
   */
  async getRequestDetails(id) {
    const response = await axiosInstance.get(`/api/donor/requests/${id}`);
    return response.data?.data;
  },

  /**
   * Accept a blood request. First donor wins; returns 409 if already accepted.
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>} AcceptRequestResponseDto
   */
  async acceptRequest(id) {
    const response = await axiosInstance.post(`/api/donor/requests/${id}/accept`);
    return response.data?.data;
  },

  /**
   * Reject a blood request
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>}
   */
  async rejectRequest(id) {
    const response = await axiosInstance.post(`/api/donor/requests/${id}/reject`);
    return response.data?.data;
  },

  /**
   * Get blood donation requests accepted or completed by this donor
   * @returns {Promise<Array>} List of DonorRequestDetailsDto
   */
  async getHistory() {
    const response = await axiosInstance.get('/api/donor/history');
    return response.data?.data || [];
  },

  /**
   * Check blood donation eligibility, last donation, next eligible date, and gap days
   * @returns {Promise<object>} EligibilityResponse
   */
  async getEligibility() {
    const response = await axiosInstance.get('/api/donor/eligibility');
    return response.data?.data;
  },

  /**
   * Update donor availability status (enforces 90-day recovery rule)
   * @param {boolean} available
   * @returns {Promise<object>} UserProfileResponse
   */
  async updateAvailability(available) {
    const response = await axiosInstance.put('/api/donor/availability', { available });
    return response.data?.data;
  },
};

export default requestApi;
