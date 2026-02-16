import PushNotification, { PushNotificationScheduleObject } from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import type { Reminder } from '../store/reminderStore';

const DEVICE_ID_KEY = 'device_id';

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

export async function initNotifications(): Promise<void> {
  PushNotification.configure({
    onRegister: () => {},
    onNotification: () => {},
    requestPermissions: true,
  });

  await messaging().requestPermission();
  const fcmToken = await messaging().getToken();
  await registerDeviceWithBackend(fcmToken);

  messaging().onTokenRefresh(async (token) => {
    await registerDeviceWithBackend(token);
  });
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
  const notification: PushNotificationScheduleObject = {
    channelId: 'reminders',
    date: triggerDate,
    message: reminder.description || `Reminder: ${reminder.title}`,
    title: reminder.title,
    userInfo: { reminderId: reminder.id },
    allowWhileIdle: true,
  };
  PushNotification.localNotificationSchedule(notification);
}

