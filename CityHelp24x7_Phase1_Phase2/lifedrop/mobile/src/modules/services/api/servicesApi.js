import axiosInstance from '../../../api/axiosInstance';

const unwrap = (res) => res.data?.data;
const clean = (params) => {
  const out = {};
  Object.keys(params || {}).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
};

export const servicesApi = {
  async getCategories() {
    return unwrap(await axiosInstance.get('/api/services/categories')) || [];
  },
  /** params: categoryId, cityId, lat, lng, radiusKm, q, minRating, sort ('rating'|'distance'|'price'), page, size */
  async searchProviders(params = {}) {
    return unwrap(await axiosInstance.get('/api/services/providers', { params: clean(params) }));
  },
  async getProvider(id) {
    return unwrap(await axiosInstance.get(`/api/services/providers/${id}`));
  },
  async getReviews(id) {
    return unwrap(await axiosInstance.get(`/api/services/providers/${id}/reviews`)) || [];
  },
  async reportProvider(id, reason) {
    return unwrap(await axiosInstance.post(`/api/services/providers/${id}/report`, { reason }));
  },
};

export const providerApi = {
  async register(payload) {
    return unwrap(await axiosInstance.post('/api/services/providers', payload));
  },
  /** Returns null when the user has no provider profile yet (404). */
  async getMe() {
    try {
      return unwrap(await axiosInstance.get('/api/services/providers/me'));
    } catch (err) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
  async updateMe(payload) {
    return unwrap(await axiosInstance.put('/api/services/providers/me', payload));
  },
  async setAvailability(available) {
    return unwrap(await axiosInstance.put('/api/services/providers/me/availability', { available }));
  },
};

export const bookingApi = {
  async create(payload) {
    return unwrap(await axiosInstance.post('/api/services/bookings', payload));
  },
  async mine() {
    return unwrap(await axiosInstance.get('/api/services/bookings/mine')) || [];
  },
  async received() {
    return unwrap(await axiosInstance.get('/api/services/bookings/provider')) || [];
  },
  async get(id) {
    return unwrap(await axiosInstance.get(`/api/services/bookings/${id}`));
  },
  async accept(id) {
    return unwrap(await axiosInstance.put(`/api/services/bookings/${id}/accept`));
  },
  async reject(id, note) {
    return unwrap(await axiosInstance.put(`/api/services/bookings/${id}/reject`, { note }));
  },
  async cancel(id, note) {
    return unwrap(await axiosInstance.put(`/api/services/bookings/${id}/cancel`, { note }));
  },
  async complete(id) {
    return unwrap(await axiosInstance.put(`/api/services/bookings/${id}/complete`));
  },
  async review(id, rating, comment) {
    return unwrap(await axiosInstance.post(`/api/services/bookings/${id}/review`, { rating, comment }));
  },
};

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || fallback;
