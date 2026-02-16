import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

import { useReminderStore } from '../../store/reminderStore';

export const TodayScreen: React.FC = () => {
  const reminders = useReminderStore((s) => s.reminders);

  const todayReminders = reminders.filter((r) => r.is_active);

  return (
    <View style={styles.container}>
      <FlatList
        data={todayReminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>
              {item.reminder_type} • {item.time_of_day}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reminders for today.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
  },
});

