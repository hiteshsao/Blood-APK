import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import authApi from '../api/authApi';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY, setOnUnauthorizedCallback } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Secure storage helpers
  const saveToStorage = async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } else {
        if (value === null) {
          await SecureStore.deleteItemAsync(key);
        } else {
          await SecureStore.setItemAsync(key, value);
        }
      }
    } catch (err) {
      console.warn(`[LifeDrop Storage] Error writing ${key}:`, err?.message);
    }
  };

  const getFromStorage = async (key) => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[LifeDrop Storage] Error reading ${key}:`, err?.message);
      return null;
    }
  };

  // Logout handler
  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await saveToStorage(TOKEN_STORAGE_KEY, null);
    await saveToStorage(USER_STORAGE_KEY, null);
  }, []);

  // Hook 401 callback to auto-logout
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      logout();
    });
  }, [logout]);

  // Initial session restoration on app boot
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await getFromStorage(TOKEN_STORAGE_KEY);
        const storedUserJson = await getFromStorage(USER_STORAGE_KEY);

        if (storedToken && isMounted) {
          setToken(storedToken);
          if (storedUserJson) {
            try {
              setUser(JSON.parse(storedUserJson));
            } catch {
              // ignore json parse error
            }
          }

          // Verify token against backend
          try {
            const verifiedUser = await authApi.getCurrentUser();
            if (isMounted && verifiedUser) {
              setUser(verifiedUser);
              await saveToStorage(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
            }
          } catch (apiErr) {
            console.log('[LifeDrop Auth] Session validation error or offline:', apiErr?.message);
            // If it's a 401, logout will be handled; otherwise preserve cached user for offline viewing
            if (apiErr?.response?.status === 401) {
              await logout();
            }
          }
        }
      } catch (err) {
        console.warn('[LifeDrop Auth] Restore session failed:', err?.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Login method
  const login = useCallback(
    async (credentialsOrToken, maybeUser) => {
      // Direct token & user passed
      if (typeof credentialsOrToken === 'string') {
        const newToken = credentialsOrToken;
        const userData = maybeUser || null;
        setToken(newToken);
        setUser(userData);
        await saveToStorage(TOKEN_STORAGE_KEY, newToken);
        if (userData) {
          await saveToStorage(USER_STORAGE_KEY, JSON.stringify(userData));
        }
        return { token: newToken, user: userData };
      }

      // Credentials object: { email, password }
      const data = await authApi.login(credentialsOrToken);
      if (data?.token) {
        setToken(data.token);
        setUser(data.user);
        await saveToStorage(TOKEN_STORAGE_KEY, data.token);
        if (data.user) {
          await saveToStorage(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
      }
      return data;
    },
    []
  );

  // Register method
  const register = useCallback(async (formData) => {
    const data = await authApi.register(formData);
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      await saveToStorage(TOKEN_STORAGE_KEY, data.token);
      if (data.user) {
        await saveToStorage(USER_STORAGE_KEY, JSON.stringify(data.user));
      }
    }
    return data;
  }, []);

  // Refresh current user profile
  const refreshUser = useCallback(async () => {
    try {
      const refreshed = await authApi.getCurrentUser();
      if (refreshed) {
        setUser(refreshed);
        await saveToStorage(USER_STORAGE_KEY, JSON.stringify(refreshed));
        return refreshed;
      }
    } catch (err) {
      console.warn('[LifeDrop Auth] refreshUser error:', err?.message);
    }
    return null;
  }, []);

  const role = useMemo(() => {
    return user?.role || null;
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      login,
      register,
      logout,
      refreshUser,
      loading,
      isAuthenticated: !!token,
    }),
    [token, user, role, login, register, logout, refreshUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
