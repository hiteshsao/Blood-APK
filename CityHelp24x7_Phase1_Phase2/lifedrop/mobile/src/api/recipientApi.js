import axiosInstance from './axiosInstance';

/**
 * Recipient API service
 * Restricted to verified Recipients. Handles blood request lifecycle and nearby donor discovery.
 */
export const recipientApi = {
  /**
   * Create a new blood donation request and notify matched nearby donors
   * @param {{
   *   patientName: string,
   *   bloodGroup: string,
   *   unitsNeeded: number,
   *   urgency: 'NORMAL'|'URGENT',
   *   city?: string,
   *   latitude: number,
   *   longitude: number,
   *   radiusKm?: number,
   *   message?: string,
   *   requiredBy?: string
   * }} payload
   * @returns {Promise<object>} BloodRequestRecipientResponseDto
   */
  async createRequest(payload) {
    const response = await axiosInstance.post('/api/recipient/requests', payload);
    return response.data?.data;
  },

  /**
   * Broadcast an emergency SOS blood alert (25km auto-retry to 50km, high priority push)
   * @param {{ patientName: string, bloodGroup: string, city?: string, latitude: number, longitude: number, message?: string }} payload
   * @returns {Promise<{ requestId: number, donorsNotified: number, radiusKm: number, message: string }>}
   */
  async sendSos(payload) {
    const response = await axiosInstance.post('/api/recipient/sos', payload);
    return response.data?.data;
  },

  /**
   * Get currently active SOS request for logged-in recipient, if any
   * @returns {Promise<object|null>}
   */
  async getActiveSos() {
    const response = await axiosInstance.get('/api/recipient/sos/active');
    return response.data?.data;
  },

  /**
   * Get all blood requests created by logged-in recipient (newest first)
   * @returns {Promise<Array>} List of BloodRequestRecipientResponseDto
   */
  async getMyRequests() {
    const response = await axiosInstance.get('/api/recipient/requests');
    return response.data?.data || [];
  },

  /**
   * Get full details of a specific request.
   * Donor contact info (name, phone) is included ONLY if status is ACCEPTED or COMPLETED.
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>} BloodRequestRecipientResponseDto
   */
  async getRequestDetails(id) {
    const response = await axiosInstance.get(`/api/recipient/requests/${id}`);
    return response.data?.data;
  },

  /**
   * Cancel an active blood donation request (only if PENDING)
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>} BloodRequestRecipientResponseDto
   */
  async cancelRequest(id) {
    const response = await axiosInstance.put(`/api/recipient/requests/${id}/cancel`);
    return response.data?.data;
  },

  /**
   * Complete an ACCEPTED blood request and update donor's recovery gap record
   * @param {number|string} id - Blood request ID
   * @returns {Promise<object>} BloodRequestRecipientResponseDto
   */
  async completeRequest(id) {
    const response = await axiosInstance.post(`/api/recipient/requests/${id}/complete`);
    return response.data?.data;
  },

  /**
   * Search compatible, eligible donors within radiusKm
   * @param {{ bloodGroup: string, lat: number, lng: number, radiusKm?: number }} params
   * @returns {Promise<Array>} List of DonorResponseDto
   */
  async findNearbyDonors({ bloodGroup, lat, lng, radiusKm = 10.0 }) {
    const response = await axiosInstance.get('/api/recipient/donors/nearby', {
      params: {
        bloodGroup,
        lat,
        lng,
        radiusKm,
      },
    });
    return response.data?.data || [];
  },
};

export default recipientApi;
