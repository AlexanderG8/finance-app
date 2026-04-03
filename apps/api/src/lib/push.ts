// Expo Push Notifications — sends via Expo's HTTP API (no SDK required)
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!expoPushToken.startsWith('ExponentPushToken[')) {
    console.warn('[Push] Invalid token format, skipping:', expoPushToken.slice(0, 20));
    return;
  }

  const message: ExpoPushMessage = {
    to: expoPushToken,
    title,
    body,
    sound: 'default',
    data: data ?? {},
  };

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Push] Expo push API error:', response.status, text);
  }
}
