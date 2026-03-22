import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';

// ─── import TYPE only — erased at compile time, zero runtime cost ─────────────
// We CANNOT statically import expo-notifications on Android Expo Go SDK 53+
// because the native module throws during initialization, crashing module load.
import type * as NotificationsType from 'expo-notifications';

// ─── Expo Go detection ────────────────────────────────────────────────────────
// appOwnership === 'expo'      → running inside Expo Go
// executionEnvironment === 'storeClient' → same, but more reliable in SDK 52+
const isExpoGo: boolean =
  Constants.appOwnership === 'expo' ||
  (Constants as unknown as { executionEnvironment?: string }).executionEnvironment === 'storeClient';

// Remote push was removed from Expo Go Android in SDK 53.
// iOS Expo Go and all development/production builds are unaffected.
export const isRemotePushSupported: boolean = !(Platform.OS === 'android' && isExpoGo);

// ─── Lazy loader — only called when isRemotePushSupported is true ─────────────
function Notifications(): typeof NotificationsType {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications');
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<void> {
  if (!isRemotePushSupported) return;

  const pushEnabled = await storage.getPushEnabled();
  if (!pushEnabled) return;

  const N = Notifications();

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E3A5F',
    });
  }

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    await storage.setPushEnabled(false);
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenData = await N.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await apiClient
      .put('/auth/push-token', { token: tokenData.data })
      .catch((err: unknown) => {
        console.warn('[Push] Failed to register token with backend:', err);
      });
  } catch {
    // Simulator or unsupported environment — skip silently
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  await storage.setPushEnabled(false);
  await apiClient
    .put('/auth/push-token', { token: null })
    .catch((err: unknown) => {
      console.warn('[Push] Failed to clear token from backend:', err);
    });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications(isAuthenticated: boolean): void {
  useEffect(() => {
    if (!isAuthenticated || !isRemotePushSupported) return;

    const N = Notifications();

    try {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch {
      return;
    }

    registerForPushNotifications().catch((err: unknown) => {
      console.warn('[Push] registerForPushNotifications error:', err);
    });

    const foregroundSub = N.addNotificationReceivedListener((notification) => {
      console.log('[Push] Foreground notification:', notification.request.content.title);
    });

    const responseSub = N.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated]);
}
