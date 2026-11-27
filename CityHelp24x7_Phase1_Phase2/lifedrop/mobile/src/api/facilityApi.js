import axiosInstance from './axiosInstance';

/**
 * Hospitals and blood banks directory (information only).
 */
export const facilityApi = {
  /**
   * @param {{ type?: 'HOSPITAL'|'BLOOD_BANK', cityId?: number, lat?: number, lng?: number, radiusKm?: number, q?: string, open24x7?: boolean, page?: number, size?: number }} params
   * @returns {Promise<{ content: Array, page: number, size: number, totalElements: number, totalPages: number }>}
   */
  async search(params = {}) {
    const clean = {};
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        clean[key] = value;
      }
    });
    const response = await axiosInstance.get('/api/facilities', { params: clean });
    return response.data?.data;
  },

  async getById(id) {
    const response = await axiosInstance.get(`/api/facilities/${id}`);
    return response.data?.data;
  },
};

export default facilityApi;
