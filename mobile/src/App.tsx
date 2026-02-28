import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { restoreSessionFromStorage } from './api/authApi';
import { initialLoadReminders, syncFromServer } from './services/SyncService';
// Firebase is not configured yet – skip notification init to avoid native crash
// import { initNotifications } from './services/NotificationService';

const App = () => {
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
      // Notification init skipped – no google-services.json / Firebase config
      setBootstrapping(false);
    };
    void bootstrap();
  }, []);

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;

