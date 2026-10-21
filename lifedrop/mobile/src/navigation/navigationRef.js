import { Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const navigationRef = createNavigationContainerRef();

const USER_STORAGE_KEY = 'lifedrop_user';
let pendingNavigation = null;

/**
 * Navigate to a screen safely, even if navigation container is not ready yet.
 * @param {string} name
 * @param {object} [params]
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name, params);
    } catch (err) {
      console.warn('[NavigationRef] Navigate error:', err?.message);
    }
  } else {
    // Queue navigation for when container becomes ready
    pendingNavigation = { name, params };
  }
}

/**
 * Flush any queued navigation once navigation container mounts/becomes ready.
 */
export function consumePendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    pendingNavigation = null;
    try {
      navigationRef.navigate(name, params);
    } catch (err) {
      console.warn('[NavigationRef] Failed to consume pending navigation:', err?.message);
    }
  }
}

/**
 * Deep-link / Notification routing handler:
 * Resolves notification payload to the correct screen based on data.requestId and role.
 * - DONOR: RequestDetailScreen with { requestId }
 * - RECIPIENT: RequestStatusScreen with { requestId }
 *
 * Even if app was completely closed, retrieves stored role and triggers navigation.
 *
 * @param {object} data Notification data payload (e.g. { requestId, type })
 * @param {string} [role] Optional user role ('DONOR' | 'RECIPIENT')
 */
export async function handleNotificationTap(data, role) {
  if (!data) return;

  const rawId = data.requestId ?? data.relatedRequestId ?? data.id;
  const requestId = rawId ? Number(rawId) : null;
  const type = data.type || '';

  let effectiveRole = role;
  if (!effectiveRole) {
    try {
      let storedJson = null;
      if (Platform.OS === 'web') {
        storedJson = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;
      } else {
        storedJson = await SecureStore.getItemAsync(USER_STORAGE_KEY);
      }
      if (storedJson) {
        effectiveRole = JSON.parse(storedJson)?.role;
      }
    } catch {
      // ignore
    }
  }

  if (requestId) {
    // Check if donor or recipient route
    if (
      effectiveRole === 'DONOR' ||
      type === 'NEW_REQUEST' ||
      type === 'REQUEST_CANCELLED' ||
      type === 'REQUEST_COMPLETED'
    ) {
      navigate('RequestDetail', { requestId });
      return;
    }

    if (effectiveRole === 'RECIPIENT' || type === 'REQUEST_ACCEPTED') {
      navigate('RequestStatus', { requestId });
      return;
    }

    // Default fallback based on role
    if (effectiveRole === 'DONOR') {
      navigate('RequestDetail', { requestId });
    } else {
      navigate('RequestStatus', { requestId });
    }
  } else {
    // If no requestId attached, open Notifications screen
    navigate('Notifications');
  }
}

export default {
  navigationRef,
  navigate,
  consumePendingNavigation,
  handleNotificationTap,
};
