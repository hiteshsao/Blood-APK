import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: adds the JWT token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lifedrop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: on 401 for a request that carried a token (expired/invalid session),
// log out and redirect to /login. Guest requests that get 401 must not kick visitors off public pages.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && sentToken) {
      localStorage.removeItem('lifedrop_token');
      localStorage.removeItem('lifedrop_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
