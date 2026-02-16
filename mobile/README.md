# Smart Personal Routine Reminder Mobile App

React Native mobile app for the Smart Personal Routine Reminder system.

## Setup

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Configure API base URL in `src/api/client.ts` if not running on Android emulator.

3. Configure Firebase for `@react-native-firebase/app` and `@react-native-firebase/messaging` (Android/iOS native setup) and create a notification channel with id `reminders` on Android.

4. Run the app:

```bash
npm run android
# or
npm run ios
```

