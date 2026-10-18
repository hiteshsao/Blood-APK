import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * ============================================================================
 * LIFEDROP BACKEND API CONFIGURATION & NETWORK GUIDE
 * ============================================================================
 * 
 * 1. REAL PHYSICAL PHONE (via Expo Go over Wi-Fi):
 *    - Must be on the SAME local Wi-Fi network as your development computer.
 *    - Find your computer's LAN IP (run `ipconfig` on Windows or `ifconfig` on Mac/Linux).
 *    - Example: EXPO_PUBLIC_API_URL=http://192.168.1.15:8080
 * 
 * 2. ANDROID EMULATOR:
 *    - Android emulator uses the special alias 10.0.2.2 to reach host localhost.
 *    - Default: http://10.0.2.2:8080
 * 
 * 3. IOS SIMULATOR OR WEB BROWSER:
 *    - Direct localhost: http://localhost:8080
 * ============================================================================
 */

export const TOKEN_STORAGE_KEY = 'lifedrop_token';
export const USER_STORAGE_KEY = 'lifedrop_user';

const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080';
  }
  return 'http://localhost:8080';
};

export const API_BASE_URL = getDefaultBaseUrl();

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Broadcast listener callback for 401 unauthenticated events
let onUnauthorizedCallback = null;
export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach JWT bearer token from expo-secure-store
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      let token = null;
      if (Platform.OS === 'web') {
        token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      } else {
        token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[LifeDrop API] Failed to retrieve token from SecureStore:', err?.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized by removing token and triggering logout
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        } else {
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
          await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
        }
      } catch (err) {
        // ignore
      }

      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
