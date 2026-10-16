import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lifedrop_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lifedrop_token'));
  const [loading, setLoading] = useState(true);

  // Sync / verify authenticated user session on mount or token change
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      if (token) {
        try {
          const res = await axiosInstance.get('/api/auth/me');
          if (res.data?.data && isMounted) {
            setUser(res.data.data);
            localStorage.setItem('lifedrop_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          if (isMounted) {
            // Token might be expired or invalid
            logout();
          }
        }
      } else {
        setUser(null);
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (arg1, arg2) => {
    // Can be called as login(token, userData) OR login({ email, password })
    if (typeof arg1 === 'string') {
      const newToken = arg1;
      const userData = arg2;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('lifedrop_token', newToken);
      if (userData) {
        localStorage.setItem('lifedrop_user', JSON.stringify(userData));
      }
      return { token: newToken, user: userData };
    } else {
      // Credentials object: { email, password }
      const res = await axiosInstance.post('/api/auth/login', arg1);
      const data = res.data?.data;
      if (data?.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('lifedrop_token', data.token);
        if (data.user) {
          localStorage.setItem('lifedrop_user', JSON.stringify(data.user));
        }
      }
      return data;
    }
  }, []);

  const register = useCallback(async (formData) => {
    const res = await axiosInstance.post('/api/auth/register', formData);
    const data = res.data?.data;
    if (data?.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('lifedrop_token', data.token);
      if (data.user) {
        localStorage.setItem('lifedrop_user', JSON.stringify(data.user));
      }
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lifedrop_token');
    localStorage.removeItem('lifedrop_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('lifedrop_user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
