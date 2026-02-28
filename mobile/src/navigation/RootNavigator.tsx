import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthStack } from './auth/AuthStack';
import { MainTabs } from './main/MainTabs';
import { ReminderEditScreen } from '../screens/main/ReminderEditScreen';
import { useAuthStore } from '../store/authStore';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ReminderEdit: { reminderId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="ReminderEdit"
            component={ReminderEditScreen}
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.reminderId ? 'Edit Reminder' : 'New Reminder',
            })}
          />
        </Stack.Group>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

