import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { restoreSessionFromStorage } from './api/authApi';
import { initialLoadReminders, syncFromServer } from './services/SyncService';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
// Firebase is not configured yet – skip notification init to avoid native crash
// import { initNotifications } from './services/NotificationService';

const AppInner = () => {
  const { isDark, colors } = useTheme();
  const [bootstrapping, setBootstrapping] = useState(true);

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
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AppInner />
  </ThemeProvider>
);

export default App;

