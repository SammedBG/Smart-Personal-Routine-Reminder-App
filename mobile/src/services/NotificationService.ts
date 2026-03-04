import PushNotification from 'react-native-push-notification';
import type { PushNotificationScheduleObject, ReceivedNotification } from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

import { apiClient } from '../api/client';
import type { Reminder } from '../store/reminderStore';

const DEVICE_ID_KEY = 'device_id';
const CHANNEL_ID = 'reminders_v2';

// Navigation ref — set from App.tsx so we can deep-link on notification tap
let _navigationRef: any = null;
export function setNotificationNavigationRef(ref: any): void {
  _navigationRef = ref;
}

function generateDeviceId(): string {
  const random = Math.random().toString(36).substring(2);
  const timestamp = Date.now().toString(36);
  return `${Platform.OS}-${timestamp}-${random}`;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/** Request POST_NOTIFICATIONS permission on Android 13+ */
async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version < 33) return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message: 'SmartRoutine needs permission to send you reminder notifications.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Create high-importance notification channel for Android 8+ */
function createNotificationChannel(): void {
  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: 'Reminders',
      channelDescription: 'Reminder alerts — medicine, food, exercise, and more',
      soundName: 'default',
      importance: 5, // IMPORTANCE_HIGH
      vibrate: true,
    },
    () => {},
  );
}

export async function initNotifications(): Promise<void> {
  await requestAndroidNotificationPermission();
  createNotificationChannel();

  PushNotification.configure({
    onRegister: () => {},
    onNotification: (notification: ReceivedNotification) => {
      const reminderId = notification?.data?.reminderId;
      if (reminderId && _navigationRef?.isReady?.()) {
        _navigationRef.navigate('ReminderEdit', { reminderId });
      }
      if (typeof notification.finish === 'function') {
        notification.finish('UIBackgroundFetchResultNoData' as any);
      }
    },
    permissions: { alert: true, badge: true, sound: true },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) {
      const fcmToken = await messaging().getToken();
      await registerDeviceWithBackend(fcmToken);
      messaging().onTokenRefresh(async (token) => { await registerDeviceWithBackend(token); });
      // Show FCM messages while app is in foreground as local notifications
      messaging().onMessage(async (remoteMessage) => {
        const { title, body } = remoteMessage.notification || {};
        if (title || body) {
          PushNotification.localNotification({
            channelId: CHANNEL_ID,
            title: title || 'Reminder',
            message: body || '',
            soundName: 'default',
            importance: 'high',
            priority: 'high',
          });
        }
      });
    }
  } catch {
    if (__DEV__) console.warn('FCM init failed — local notifications still work');
  }
}

async function registerDeviceWithBackend(fcmToken: string): Promise<void> {
  try {
    const deviceId = await getOrCreateDeviceId();
    await apiClient.post('/devices/register', {
      device_id: deviceId,
      fcm_token: fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app_version: '1.0.0',
    });
  } catch { /* retry on next init */ }
}

/** Schedule a local notification for a single reminder */
export function scheduleLocalNotification(reminder: Reminder): void {
  if (!reminder.next_trigger_at || !reminder.is_active) return;
  const triggerDate = new Date(reminder.next_trigger_at);
  if (triggerDate.getTime() <= Date.now() + 5000) return;

  const notifId = hashCode(reminder.id);
  const notification: PushNotificationScheduleObject = {
    channelId: CHANNEL_ID,
    id: notifId,
    date: triggerDate,
    title: reminder.title,
    message: reminder.description || buildNotificationBody(reminder),
    userInfo: { reminderId: reminder.id },
    allowWhileIdle: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
    vibrate: true,
    vibration: 500,
    ...(reminder.repeat_type === 'daily' && { repeatType: 'day' }),
  };

  PushNotification.localNotificationSchedule(notification);
  if (__DEV__) console.log(`Scheduled: "${reminder.title}" at ${triggerDate.toLocaleString()}`);
}

function buildNotificationBody(reminder: Reminder): string {
  switch (reminder.reminder_type) {
    case 'medicine':
      return reminder.medicine_details?.dosage
        ? `Time to take ${reminder.medicine_details.dosage}`
        : 'Time to take your medicine \u{1F48A}';
    case 'water':   return 'Time to drink water \u{1F4A7}';
    case 'food':    return 'Meal time \u{1F37D}\uFE0F';
    case 'exercise':return 'Time for your workout \u{1F3C3}';
    case 'sleep':   return 'Time to rest \u{1F634}';
    default:        return `Reminder: ${reminder.title}`;
  }
}

/** Cancel all scheduled notifications and re-schedule all active ones */
export function rescheduleAllNotifications(reminders: Reminder[]): void {
  PushNotification.cancelAllLocalNotifications();
  reminders.filter((r) => r.is_active && r.next_trigger_at).forEach(scheduleLocalNotification);
}

/** Cancel notification for a single reminder */
export function cancelNotification(reminderId: string): void {
  PushNotification.cancelLocalNotifications({ id: String(hashCode(reminderId)) });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}
