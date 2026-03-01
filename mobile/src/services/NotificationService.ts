import PushNotification, { PushNotificationScheduleObject } from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import type { Reminder } from '../store/reminderStore';

const DEVICE_ID_KEY = 'device_id';

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

/** Create the Android notification channel (required for Android 8+) */
function createNotificationChannel(): void {
  PushNotification.createChannel(
    {
      channelId: 'reminders',
      channelName: 'Reminders',
      channelDescription: 'Reminder notifications',
      importance: 4, // high
      vibrate: true,
    },
    () => {}, // callback
  );
}

export async function initNotifications(): Promise<void> {
  createNotificationChannel();

  PushNotification.configure({
    onRegister: () => {},
    onNotification: (notification) => {
      // When user taps a notification, navigate to the reminder
      const reminderId = notification?.data?.reminderId;
      if (reminderId && _navigationRef?.isReady?.()) {
        _navigationRef.navigate('ReminderEdit', { reminderId });
      }
      // Required on iOS
      if (typeof notification.finish === 'function') {
        notification.finish('UIBackgroundFetchResultNoData' as any);
      }
    },
    requestPermissions: true,
    popInitialNotification: true,
  });

  try {
    await messaging().requestPermission();
    const fcmToken = await messaging().getToken();
    await registerDeviceWithBackend(fcmToken);

    messaging().onTokenRefresh(async (token) => {
      await registerDeviceWithBackend(token);
    });
  } catch {
    // Firebase not configured or permission denied — continue without push
    console.warn('FCM init failed, local notifications still work');
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
  } catch {
    // ignore registration failures; will retry on next init
  }
}

export function scheduleLocalNotification(reminder: Reminder): void {
  if (!reminder.next_trigger_at) return;
  const triggerDate = new Date(reminder.next_trigger_at);
  // Don't schedule for past times
  if (triggerDate.getTime() <= Date.now()) return;
  const notification: PushNotificationScheduleObject = {
    channelId: 'reminders',
    date: triggerDate,
    message: reminder.description || `Reminder: ${reminder.title}`,
    title: reminder.title,
    userInfo: { reminderId: reminder.id },
    allowWhileIdle: true,
    id: Math.abs(hashCode(reminder.id)),
  };
  PushNotification.localNotificationSchedule(notification);
}

/** Cancel all scheduled notifications and re-schedule from current reminders */
export function rescheduleAllNotifications(reminders: Reminder[]): void {
  PushNotification.cancelAllLocalNotifications();
  reminders
    .filter((r) => r.is_active && r.next_trigger_at)
    .forEach((r) => scheduleLocalNotification(r));
}

/** Simple string hash for stable notification IDs */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

