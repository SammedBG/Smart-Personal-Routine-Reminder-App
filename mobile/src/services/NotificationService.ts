import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

import { apiClient } from '../api/client';
import type { Reminder } from '../store/reminderStore';

// Expo Go removed native push/local notification support in SDK 53+.
// We detect Expo Go so we can use an in-app timer fallback when running in Expo Go,
// while preserving full native notifications for standalone/development builds.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-load expo-notifications only when NOT in Expo Go
function getNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

const DEVICE_ID_KEY = 'device_id';
const CHANNEL_ID = 'reminders_max';

// Store in-app fallback timers when running inside Expo Go
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getMessaging(): any {
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
}

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

// Set foreground notification handler behavior (lazy, skipped in Expo Go)
const Notifications = getNotifications();
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Create max-importance notification channel for Android */
async function createNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android' && Notifications) {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#FF2366',
    });
  }
}

export async function initNotifications(): Promise<void> {
  if (!Notifications) {
    if (__DEV__) console.log('Running in Expo Go — using in-app reminder fallback (native notifications require Development Build)');
    return;
  }

  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  await createNotificationChannel();

  Notifications.addNotificationResponseReceivedListener((response) => {
    const reminderId = response.notification.request.content.data?.reminderId;
    if (reminderId && _navigationRef?.isReady?.()) {
      _navigationRef.navigate('ReminderEdit', { reminderId });
    }
  });

  try {
    const messaging = getMessaging();
    if (!messaging) return;
    const instance = messaging();
    const authStatus = await instance.requestPermission();
    const enabled =
      authStatus === instance.AuthorizationStatus?.AUTHORIZED ||
      authStatus === instance.AuthorizationStatus?.PROVISIONAL;
    if (enabled) {
      const fcmToken = await instance.getToken();
      await registerDeviceWithBackend(fcmToken);
      instance.onTokenRefresh(async (token: string) => { await registerDeviceWithBackend(token); });
      instance.onMessage(async (remoteMessage: any) => {
        const { title, body } = remoteMessage.notification || {};
        if (title || body) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: title || 'Reminder',
              body: body || '',
              sound: true,
            },
            trigger: null, // immediate
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
export async function scheduleLocalNotification(reminder: Reminder): Promise<void> {
  if (!reminder.next_trigger_at || !reminder.is_active) return;
  const triggerDate = new Date(reminder.next_trigger_at);
  const delayMs = triggerDate.getTime() - Date.now();
  if (delayMs <= 1000) return;

  // In Expo Go (SDK 53+), native notification APIs are excluded from the binary.
  // Use in-app Alert timers so reminders still pop up on screen during Expo Go testing!
  if (isExpoGo || !Notifications) {
    if (activeTimers.has(reminder.id)) {
      clearTimeout(activeTimers.get(reminder.id)!);
    }
    if (delayMs < 24 * 60 * 60 * 1000) { // schedule if within 24 hours
      const timer = setTimeout(() => {
        Alert.alert(
          `\u{1F514} Reminder: ${reminder.title}`,
          reminder.description || buildNotificationBody(reminder),
          [{ text: 'OK' }]
        );
        activeTimers.delete(reminder.id);
      }, delayMs);
      activeTimers.set(reminder.id, timer);
      if (__DEV__) {
        console.log(`[Expo Go Fallback] In-app alert scheduled for "${reminder.title}" in ${Math.round(delayMs / 1000)}s`);
      }
    }
    return;
  }

  // Native notification scheduling for standalone / development builds
  const notifId = String(stableHashCode(reminder.id));

  await Notifications.scheduleNotificationAsync({
    identifier: notifId,
    content: {
      title: `\u{1F514} ${reminder.title}`,
      body: reminder.description || buildNotificationBody(reminder),
      data: { reminderId: reminder.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    } as any,
  });

  if (__DEV__) console.log(`Scheduled native notification: "${reminder.title}" at ${triggerDate.toLocaleString()}`);
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
export async function rescheduleAllNotifications(reminders: Reminder[]): Promise<void> {
  // Clear all in-app timers
  for (const timer of activeTimers.values()) {
    clearTimeout(timer);
  }
  activeTimers.clear();

  if (Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  for (const r of reminders.filter((r) => r.is_active && r.next_trigger_at)) {
    await scheduleLocalNotification(r);
  }
}

/** Cancel notification for a single reminder */
export async function cancelNotification(reminderId: string): Promise<void> {
  if (activeTimers.has(reminderId)) {
    clearTimeout(activeTimers.get(reminderId)!);
    activeTimers.delete(reminderId);
  }

  if (Notifications) {
    const notifId = String(stableHashCode(reminderId));
    await Notifications.cancelScheduledNotificationAsync(notifId);
  }
}

/**
 * FNV-1a 32-bit hash — provides much better distribution than a simple
 * shift-and-add hash, reducing notification ID collisions (Issue #16).
 */
export function stableHashCode(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return Math.abs(hash | 0);
}
