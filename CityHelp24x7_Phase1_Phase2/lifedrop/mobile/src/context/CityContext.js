import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import cityApi from '../api/cityApi';
import { useAuth } from './AuthContext';
import { getJson, setJson } from '../utils/storage';

/**
 * Keeps the list of supported cities and the user's selected city.
 * The selection is stored on the device and synced to the server (PUT /api/users/city) when logged in.
 */
const SELECTED_KEY = 'cityhelp_selected_city';
const CITIES_KEY = 'cityhelp_cities';

const CityContext = createContext({
  cities: [],
  selectedCity: null,
  loading: true,
  needsSelection: false,
  selectCity: async () => {},
  refreshCities: async () => {},
});

const slim = (c) => ({
  id: c.id,
  name: c.name,
  state: c.state,
  latitude: c.latitude,
  longitude: c.longitude,
});

export const CityProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncedForToken = useRef(null);

  const refreshCities = useCallback(async () => {
    try {
      const list = await cityApi.getCities();
      if (Array.isArray(list) && list.length > 0) {
        setCities(list);
        await setJson(CITIES_KEY, list);
      }
    } catch (err) {
      console.log('[City] Could not load cities, using cache:', err?.message);
    }
  }, []);

  // Boot: restore cached cities + saved selection, then refresh from the server.
  useEffect(() => {
    let active = true;
    (async () => {
      const cachedCities = await getJson(CITIES_KEY);
      const savedCity = await getJson(SELECTED_KEY);
      if (!active) return;
      if (Array.isArray(cachedCities)) setCities(cachedCities);
      if (savedCity && savedCity.id) setSelectedCity(savedCity);
      await refreshCities();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshCities]);

  // After login: reconcile the device selection with the server's saved city (once per login).
  useEffect(() => {
    if (!token || !user || loading) return;
    if (syncedForToken.current === token) return;
    syncedForToken.current = token;

    const serverCityId = user.cityId || null;
    if (selectedCity && selectedCity.id !== serverCityId) {
      cityApi.updateMyCity(selectedCity.id).catch((err) =>
        console.log('[City] Could not sync city to server:', err?.message)
      );
    } else if (!selectedCity && serverCityId) {
      const match = cities.find((c) => c.id === serverCityId);
      if (match) {
        const slimmed = slim(match);
        setSelectedCity(slimmed);
        setJson(SELECTED_KEY, slimmed);
      }
    }
  }, [token, user, loading, selectedCity, cities]);

  // Reset the one-time sync guard on logout.
  useEffect(() => {
    if (!token) syncedForToken.current = null;
  }, [token]);

  const selectCity = useCallback(
    async (city) => {
      if (!city || !city.id) return;
      const slimmed = slim(city);
      setSelectedCity(slimmed);
      await setJson(SELECTED_KEY, slimmed);
      if (token) {
        try {
          await cityApi.updateMyCity(city.id);
        } catch (err) {
          console.log('[City] Could not save city on server:', err?.message);
        }
      }
    },
    [token]
  );

  const value = useMemo(
    () => ({
      cities,
      selectedCity,
      loading,
      needsSelection: !loading && cities.length > 0 && !selectedCity,
      selectCity,
      refreshCities,
    }),
    [cities, selectedCity, loading, selectCity, refreshCities]
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCity = () => useContext(CityContext);

export default CityContext;
