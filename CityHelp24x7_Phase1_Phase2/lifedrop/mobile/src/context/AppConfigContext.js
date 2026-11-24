import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import configApi from '../api/configApi';
import { getJson, setJson } from '../utils/storage';

/**
 * Loads GET /api/app/config (feature flags) on startup, caches the last good response and
 * falls back to the cache, then to the default (blood + services), when the server is unreachable.
 */
const CACHE_KEY = 'cityhelp_app_config';

export const DEFAULT_FEATURES = {
  blood: true,
  services: true,
  directory: false,
  news: false,
  jobs: false,
  buysell: false,
};

const DEFAULT_CONFIG = {
  appName: 'MyCityZone',
  minAppVersion: '1.0.0',
  features: DEFAULT_FEATURES,
};

const mergeConfig = (raw) => ({
  appName: raw?.appName || DEFAULT_CONFIG.appName,
  minAppVersion: raw?.minAppVersion || DEFAULT_CONFIG.minAppVersion,
  features: { ...DEFAULT_FEATURES, ...(raw?.features || {}) },
});

const AppConfigContext = createContext({
  config: DEFAULT_CONFIG,
  features: DEFAULT_FEATURES,
  loaded: false,
  refreshConfig: async () => {},
});

export const AppConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  const refreshConfig = useCallback(async () => {
    try {
      const fresh = await configApi.getAppConfig();
      if (fresh && fresh.features) {
        setConfig(mergeConfig(fresh));
        await setJson(CACHE_KEY, fresh);
      }
    } catch (err) {
      console.log('[AppConfig] Using cached/default config:', err?.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await getJson(CACHE_KEY);
      if (active && cached && cached.features) {
        setConfig(mergeConfig(cached));
      }
      if (active) setLoaded(true);
      await refreshConfig();
    })();
    return () => {
      active = false;
    };
  }, [refreshConfig]);

  const value = useMemo(
    () => ({ config, features: config.features, loaded, refreshConfig }),
    [config, loaded, refreshConfig]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = () => useContext(AppConfigContext);

/** Convenience hook: const features = useFeatures(); features.services === true when Phase 2 is ON. */
export const useFeatures = () => useContext(AppConfigContext).features;

export default AppConfigContext;
