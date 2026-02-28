import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TodayScreen } from '../../screens/main/TodayScreen';
import { ReminderListScreen } from '../../screens/main/ReminderListScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';

export type MainTabParamList = {
  Today: undefined;
  Reminders: undefined;
  Settings: undefined;
};

const TAB_ICONS: Record<string, string> = {
  Today: '📅',
  Reminders: '🔔',
  Settings: '⚙️',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name] || '📋'}
          </Text>
        ),
        tabBarActiveTintColor: '#4A90D9',
        tabBarInactiveTintColor: '#999',
        headerTitleStyle: { fontWeight: '700' },
      })}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Reminders" component={ReminderListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

