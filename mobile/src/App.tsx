import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { RootNavigator } from './navigation/RootNavigator';
import { restoreSessionFromStorage } from './api/authApi';
import { initialLoadReminders, syncFromServer } from './services/SyncService';
import { initNotifications } from './services/NotificationService';

const App = () => {
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      await restoreSessionFromStorage();
      await initialLoadReminders();
      await syncFromServer();
      await initNotifications();
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

