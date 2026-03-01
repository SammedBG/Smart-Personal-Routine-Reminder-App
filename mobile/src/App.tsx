import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View } from 'react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { restoreSessionFromStorage } from './api/authApi';
import { initialLoadReminders, syncFromServer, startNetInfoListener } from './services/SyncService';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { initNotifications, rescheduleAllNotifications, setNotificationNavigationRef } from './services/NotificationService';
import { useReminderStore } from './store/reminderStore';

const AppInner = () => {
  const { isDark, colors } = useTheme();
  const [bootstrapping, setBootstrapping] = useState(true);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await restoreSessionFromStorage();
      } catch (e) {
        console.warn('Session restore failed:', e);
      }
      try {
        await initialLoadReminders();
      } catch (e) {
        console.warn('Local reminder load failed:', e);
      }
      try {
        await syncFromServer();
      } catch (e) {
        console.warn('Sync from server failed:', e);
      }
      // Schedule local notifications for all active reminders
      try {
        const reminders = useReminderStore.getState().reminders;
        rescheduleAllNotifications(reminders);
      } catch (e) {
        console.warn('Notification scheduling failed:', e);
      }
      // Init push notifications (FCM may fail if not configured)
      try {
        await initNotifications();
      } catch (e) {
        console.warn('Notification init failed:', e);
      }
      // Start auto-sync listener for connectivity changes
      startNetInfoListener();
      setBootstrapping(false);
    };
    void bootstrap();
  }, []);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.headerBg,
          text: colors.text,
          border: colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.headerBg,
          text: colors.text,
          border: colors.border,
        },
      };

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={navTheme}
          onReady={() => setNotificationNavigationRef(navigationRef.current)}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const App = () => (
  <ThemeProvider>
    <AppInner />
  </ThemeProvider>
);

export default App;

