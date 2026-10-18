import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);

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
      setError(err?.message || 'Failed to get location');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    location,
    city,
    loading,
    error,
    requestLocation,
  };
}

export default useLocation;
