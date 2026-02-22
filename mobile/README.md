# Smart Personal Routine Reminder Mobile App

React Native (TypeScript) app for the Smart Personal Routine Reminder system. Supports login/register, reminder CRUD, today view, cloud sync, offline SQLite cache, and local + FCM push notifications.

## Prerequisites

- Node.js 18+
- React Native environment (Android Studio for Android, Xcode for iOS)
- Backend API running (see [backend/README.md](../backend/README.md))
- Firebase project with Android and/or iOS apps for FCM

## Setup

1. **Install dependencies**

```bash
cd mobile
npm install
```

2. **API base URL**

Edit `src/api/client.ts` and set `API_BASE_URL`:

- Android emulator: `http://10.0.2.2:8000/api/v1` (localhost of host machine).
- iOS simulator: `http://localhost:8000/api/v1`.
- Physical device: use your machine’s LAN IP, e.g. `http://192.168.1.x:8000/api/v1`.

3. **Firebase**

- Create a Firebase project and add Android and/or iOS apps.
- Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) and place them as required by `@react-native-firebase/app` (see [React Native Firebase](https://rnfirebase.io)).
- For FCM, ensure the app is configured for Cloud Messaging; the backend will need the same project’s service account key.

4. **Android notification channel**

The app uses the channel id `reminders` for local/scheduled notifications. Create it in code (e.g. in `NotificationService` or main app entry) or ensure your default channel is used. On Android 8+, notifications require a channel.

5. **Run the app**

```bash
npm run android
# or
npm run ios
```

## Project structure

- `src/App.tsx` – Bootstrap: restore auth, load reminders from SQLite, sync, init notifications; then root navigation.
- `src/navigation/` – Root (auth vs main), auth stack (Login, Register), main tabs (Today, Reminders, Settings).
- `src/screens/` – Login, Register, Today, ReminderList, Settings.
- `src/store/` – Zustand: auth (user, tokens), reminders (list, lastSyncAt).
- `src/api/` – Axios client (auth header), authApi (login, register, logout, restore), reminderApi (fetch, create, update, toggle).
- `src/services/` – SecureStorage (Keychain), SyncService (sync from API, load SQLite), NotificationService (FCM token, device registration, local scheduling).
- `src/db/` – SQLite open + schema, reminderDao (loadAll, upsert).

## Offline and sync

- Reminders are stored in SQLite and shown from local data.
- On startup and when online, the app calls `GET /reminders/sync?since=...` and merges results into SQLite and the reminder store.
- Reminder list “Refresh” refetches from the API and updates local DB and store.
- For full offline create/update, ensure the app sends changes to the API when back online (current flow: refresh and toggle hit API when available).

## Notifications

- **FCM**: On init (and token refresh), the app registers the device with `POST /api/v1/devices/register` (device_id, fcm_token, platform). The backend uses this to send push notifications for due reminders.
- **Local**: Use `scheduleLocalNotification(reminder)` when reminders are created/updated so the device can fire at `next_trigger_at` even offline. Channel id `reminders` is used on Android.

## Build for release

- **Android**: `cd android && ./gradlew assembleRelease` (or `npx react-native run-android --variant=release`). Sign with your keystore.
- **iOS**: Open `ios/*.xcworkspace` in Xcode, select a device or “Any iOS Device”, Product → Archive, then distribute.

Use production API URL and ensure Firebase is configured for release builds (e.g. release SHA1/package name on Android, proper provisioning on iOS).
