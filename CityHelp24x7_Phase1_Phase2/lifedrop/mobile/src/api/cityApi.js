import axiosInstance from './axiosInstance';

export const cityApi = {
  /**
   * Active cities ordered for the picker (public endpoint).
   * @returns {Promise<Array<{ id: number, name: string, state: string, latitude: number, longitude: number, sortOrder: number }>>}
   */
  async getCities() {
    const response = await axiosInstance.get('/api/cities', { timeout: 10000 });
    return response.data?.data || [];
  },

  /**
   * Save the logged-in user's selected city on the server.
   * @param {number} cityId
   */
  async updateMyCity(cityId) {
    const response = await axiosInstance.put('/api/users/city', { cityId });
    return response.data?.data;
  },
};

export default cityApi;
