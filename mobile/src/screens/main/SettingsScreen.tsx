import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

import { logout } from '../../api/authApi';
import { initNotifications } from '../../services/NotificationService';

export const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Enable notifications" onPress={() => void initNotifications()} />
      <View style={{ height: 16 }} />
      <Button title="Logout" color="#d9534f" onPress={() => void logout()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
});

