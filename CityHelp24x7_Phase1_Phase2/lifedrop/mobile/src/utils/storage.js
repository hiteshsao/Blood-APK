import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Tiny key-value storage used for small cached values (app config, selected city).
 * Uses expo-secure-store on devices and localStorage on web. Never throws.
 */
export const getItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn(`[Storage] read ${key} failed:`, err?.message);
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      if (value === null || value === undefined) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
      return;
    }
    if (value === null || value === undefined) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (err) {
    console.warn(`[Storage] write ${key} failed:`, err?.message);
  }
};

export const getJson = async (key) => {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setJson = async (key, value) => {
  await setItem(key, value === null || value === undefined ? null : JSON.stringify(value));
};

export default { getItem, setItem, getJson, setJson };
