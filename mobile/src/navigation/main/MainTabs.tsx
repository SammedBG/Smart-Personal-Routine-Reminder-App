import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TodayScreen } from '../../screens/main/TodayScreen';
import { ReminderListScreen } from '../../screens/main/ReminderListScreen';
import { AnalyticsScreen } from '../../screens/main/AnalyticsScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';
import { useTheme } from '../../theme/ThemeContext';

export type MainTabParamList = {
  Today: undefined;
  Reminders: undefined;
  Stats: undefined;
  Settings: undefined;
};

const TAB_ICONS: Record<string, string> = {
  Today: '\u{1F4C5}',
  Reminders: '\u{1F514}',
  Stats: '\u{1F4CA}',
  Settings: '\u{2699}\uFE0F',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
            {TAB_ICONS[route.name] || '\u{1F4CB}'}
          </Text>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'android' ? 60 : 84,
          paddingBottom: Platform.OS === 'android' ? 8 : 24,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
        headerStyle: {
          backgroundColor: colors.headerBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.text,
        },
      })}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Reminders" component={ReminderListScreen} />
      <Tab.Screen name="Stats" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

