import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TodayScreen } from '../../screens/main/TodayScreen';
import { ReminderListScreen } from '../../screens/main/ReminderListScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';

export type MainTabParamList = {
  Today: undefined;
  Reminders: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Reminders" component={ReminderListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

