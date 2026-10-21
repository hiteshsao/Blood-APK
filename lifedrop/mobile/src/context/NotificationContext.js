import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch unread count from GET /api/notifications/unread-count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      // ignore unread count fetch error
    }
  }, [isAuthenticated]);

  // Fetch notifications list from GET /api/notifications?page=...&size=20
  const fetchNotifications = useCallback(
    async (targetPage = 0, isRefresh = false) => {
      if (!isAuthenticated) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (targetPage === 0) {
          setLoading(true);
        }
        setError(null);

        const data = await notificationApi.getNotifications(targetPage, 20);
        const content = data?.content || [];
        const pages = data?.totalPages || 1;

        setTotalPages(pages);
        setPage(targetPage);

        setNotifications((prev) => {
          if (targetPage === 0 || isRefresh) {
            return content;
          }
          // Append and filter duplicates by id
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = content.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newItems];
        });

        // Also update unread count
        fetchUnreadCount();
      } catch (err) {
        console.log('[NotificationContext] Fetch notifications error:', err?.message);
        setError(err?.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, fetchUnreadCount]
  );

  // Mark single notification as read: PUT /api/notifications/{id}/read
  const markAsRead = useCallback(async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Server update
      await notificationApi.markAsRead(id);
    } catch (err) {
      console.warn('[NotificationContext] Mark as read error:', err?.message);
    }
  }, []);

  // Mark all notifications as read: PUT /api/notifications/read-all
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);

      // Server update
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.warn('[NotificationContext] Mark all as read error:', err?.message);
    }
  }, []);

  // Hook push notifications with callback on foreground notification received
  const onForegroundNotification = useCallback(() => {
    // When a new push arrives in foreground, refresh badge count and notification list
    fetchUnreadCount();
    fetchNotifications(0, true);
  }, [fetchUnreadCount, fetchNotifications]);

  const { expoPushToken, permissionGranted, requestPermissions } = useNotifications(
    onForegroundNotification
  );

  // Initial fetch on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications(0);
    } else {
      setUnreadCount(0);
      setNotifications([]);
      setPage(0);
      setTotalPages(1);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      loading,
      refreshing,
      page,
      totalPages,
      error,
      fetchUnreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      expoPushToken,
      permissionGranted,
      requestPermissions,
    }),
    [
      unreadCount,
      notifications,
      loading,
      refreshing,
      page,
      totalPages,
      error,
      fetchUnreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      expoPushToken,
      permissionGranted,
      requestPermissions,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
