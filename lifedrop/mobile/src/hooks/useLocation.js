import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import userApi from '../api/userApi';
import { useAuth } from '../context/AuthContext';

const LAST_SYNC_KEY = 'lifedrop_last_donor_loc_sync';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/**
 * Hook for managing foreground GPS location, handling permissions (granted, denied, blocked),
 * and syncing donor coordinates with the server.
 */
export function useLocation(options = {}) {
  const { autoSyncDonor = false } = options;
  const { user, role, isAuthenticated } = useAuth();

  const [location, setLocation] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('undetermined'); // 'granted' | 'denied' | 'blocked' | 'undetermined'
  const [isBlocked, setIsBlocked] = useState(false);

  // Request foreground location permissions and get current position
  const requestLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check existing permission
      let permResponse = await Location.getForegroundPermissionsAsync();

      // 2. If not granted, request permission
      if (permResponse.status !== 'granted') {
        permResponse = await Location.requestForegroundPermissionsAsync();
      }

      if (permResponse.status !== 'granted') {
        const blocked = permResponse.canAskAgain === false;
        setIsBlocked(blocked);
        setPermissionStatus(blocked ? 'blocked' : 'denied');
        const errorMsg = blocked
          ? 'Location permission is permanently blocked. Please enable location permissions in your device Settings.'
          : 'Location permission was denied. Please grant location access to find nearby blood requests.';
        setError(errorMsg);
        return null;
      }

      setPermissionStatus('granted');
      setIsBlocked(false);

      // 3. Retrieve current GPS position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);

      // 4. Reverse geocode city (optional display helper)
      try {
        const reverse = await Location.reverseGeocodeAsync(coords);
        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const detectedCity = place.city || place.subregion || place.district || place.region || '';
          setCity(detectedCity);
        }
      } catch {
        // reverse geocoding is optional
      }

      return coords;
    } catch (err) {
      const msg = err?.message || 'Failed to get location';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync donor location to PUT /api/users/location at most once every 30 minutes
  const syncDonorLocation = useCallback(async (force = false) => {
    // Only donors should sync location to server
    if (role !== 'DONOR') {
      return null;
    }

    try {
      // Check last sync timestamp
      let lastSyncTime = 0;
      try {
        if (Platform.OS === 'web') {
          const val = typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null;
          lastSyncTime = val ? parseInt(val, 10) : 0;
        } else {
          const val = await SecureStore.getItemAsync(LAST_SYNC_KEY);
          lastSyncTime = val ? parseInt(val, 10) : 0;
        }
      } catch {
        lastSyncTime = 0;
      }

      const now = Date.now();
      const elapsed = now - lastSyncTime;

      if (!force && elapsed < THIRTY_MINUTES_MS) {
        // Less than 30 minutes since last update, throttle
        const remainingMins = Math.ceil((THIRTY_MINUTES_MS - elapsed) / (60 * 1000));
        console.log(`[LifeDrop Location] Donor location synced recently (${remainingMins} mins remaining). Skipping update.`);
        return null;
      }

      console.log('[LifeDrop Location] Requesting current coordinates for donor location sync...');
      const coords = await requestLocation();
      if (!coords || !coords.latitude || !coords.longitude) {
        console.log('[LifeDrop Location] Could not obtain coordinates for sync.');
        return null;
      }

      // Send to PUT /api/users/location
      const updatedUser = await userApi.updateLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      // Update stored timestamp
      const timestampStr = now.toString();
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(LAST_SYNC_KEY, timestampStr);
      } else {
        await SecureStore.setItemAsync(LAST_SYNC_KEY, timestampStr);
      }

      console.log('✅ [LifeDrop Location] Donor location synced successfully to server:', coords);
      return updatedUser;
    } catch (err) {
      console.warn('[LifeDrop Location] Donor location sync error:', err?.response?.data || err?.message);
      return null;
    }
  }, [role, requestLocation]);

  // Optional auto-sync on mount / active state
  useEffect(() => {
    if (!autoSyncDonor || role !== 'DONOR' || !isAuthenticated) return;

    // 1. Initial sync after login / mount
    syncDonorLocation();

    // 2. Sync whenever app comes to foreground (active state), throttled to 30 mins
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncDonorLocation();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [autoSyncDonor, role, isAuthenticated, syncDonorLocation]);

  return {
    location,
    city,
    loading,
    error,
    permissionStatus,
    isBlocked,
    isDenied: permissionStatus === 'denied' || permissionStatus === 'blocked',
    requestLocation,
    syncDonorLocation,
  };
}

/**
 * Dedicated hook for syncing donor location to server after login and when app comes to foreground.
 * Throttled to at most once every 30 minutes.
 */
export function useDonorLocationSync() {
  return useLocation({ autoSyncDonor: true });
}

export default useLocation;
