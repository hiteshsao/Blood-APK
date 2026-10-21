import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import userApi from '../api/userApi';
import { handleNotificationTap } from '../navigation/navigationRef';

// Configure foreground notification behavior:
// Always show a banner, play sound, and set badge when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure the two Android notification channels:
 * 1. "default": general updates and announcements
 * 2. "urgent": importance MAX, custom vibration pattern, red light color #DC2626
 */
export async function setupAndroidNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      // 1. Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
      });

      // 2. Urgent channel (importance MAX, vibration, red light color #DC2626)
      await Notifications.setNotificationChannelAsync('urgent', {
        name: 'Urgent',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#DC2626',
        enableLights: true,
        enableVibrate: true,
        sound: 'default',
      });

      console.log('✅ [LifeDrop Notifications] Android notification channels initialized ("default" & "urgent")');
    } catch (err) {
      console.warn('[LifeDrop Notifications] Error setting up Android channels:', err?.message);
    }
  }
}

/**
 * Hook for push notifications:
 * - Creates Android channels ("default" and "urgent")
 * - Requests permission (including Android 13+ POST_NOTIFICATIONS)
 * - Obtains Expo Push Token
 * - Sends push token to PUT /api/users/push-token after login
 * - Clears push token on logout
 * - Handles notification responses (tap to navigate even if app was closed)
 */
export function useNotifications(onNotificationReceived) {
  const { user, role, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const registeredTokenRef = useRef(null);
  const isSetupRef = useRef(false);

  // Request permissions (Android 13+ POST_NOTIFICATIONS / iOS)
  const requestPermissions = useCallback(async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.warn('[LifeDrop Notifications] Request permission error:', err?.message);
      return false;
    }
  }, []);

  // Retrieve Expo Push Token
  const getPushToken = useCallback(async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('[LifeDrop Notifications] Notification permissions not granted.');
        return null;
      }

      // Try fetching Expo push token
      const tokenResult = await Notifications.getExpoPushTokenAsync();
      const token = tokenResult?.data || null;
      if (token) {
        setExpoPushToken(token);
        console.log('📱 [LifeDrop Notifications] Expo Push Token obtained:', token);
      }
      return token;
    } catch (err) {
      // In simulator/emulator or bare env without projectId, token fetch might fail gracefully
      console.log('[LifeDrop Notifications] Note: Push token not available in this environment:', err?.message);
      return null;
    }
  }, [requestPermissions]);

  // Send push token to backend
  const registerTokenWithBackend = useCallback(async (tokenToRegister) => {
    if (!tokenToRegister || !isAuthenticated) return;
    if (registeredTokenRef.current === tokenToRegister) return;

    try {
      await userApi.updatePushToken(tokenToRegister);
      registeredTokenRef.current = tokenToRegister;
      console.log('✅ [LifeDrop Notifications] Push token registered with backend successfully.');
    } catch (err) {
      console.warn('[LifeDrop Notifications] Failed to update push token on backend:', err?.response?.data || err?.message);
    }
  }, [isAuthenticated]);

  // Clear push token from backend
  const clearTokenFromBackend = useCallback(async () => {
    try {
      registeredTokenRef.current = null;
      setExpoPushToken(null);
      await userApi.clearPushToken();
      console.log('✅ [LifeDrop Notifications] Push token cleared on backend.');
    } catch (err) {
      console.log('[LifeDrop Notifications] Clear push token ignored or offline:', err?.message);
    }
  }, []);

  // 1. Initialize channels and cold-start listener on mount
  useEffect(() => {
    if (isSetupRef.current) return;
    isSetupRef.current = true;

    setupAndroidNotificationChannels();

    // Check if app was opened by tapping a notification while closed (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        const data = response.notification.request.content.data;
        console.log('🚀 [LifeDrop Notifications] Cold-start notification response received:', data);
        handleNotificationTap(data, role);
      }
    });
  }, [role]);

  // 2. Register push token when user logs in
  useEffect(() => {
    let isCancelled = false;

    if (isAuthenticated) {
      getPushToken().then((token) => {
        if (!isCancelled && token) {
          registerTokenWithBackend(token);
        }
      });
    } else {
      // Reset registered token ref when unauthenticated
      registeredTokenRef.current = null;
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, getPushToken, registerTokenWithBackend]);

  // 3. Listen to foreground notifications and user tap responses
  useEffect(() => {
    // A) Foreground notification listener (banner is shown automatically by setNotificationHandler)
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 [LifeDrop Notifications] Foreground notification received:', notification.request.content);
      if (typeof onNotificationReceived === 'function') {
        onNotificationReceived(notification);
      }
    });

    // B) Notification tap response listener (when app is in background or foreground)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      console.log('👆 [LifeDrop Notifications] Notification tapped:', data);
      handleNotificationTap(data, role);
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [role, onNotificationReceived]);

  return {
    expoPushToken,
    permissionGranted,
    requestPermissions,
    getPushToken,
    registerTokenWithBackend,
    clearTokenFromBackend,
  };
}

export default useNotifications;
