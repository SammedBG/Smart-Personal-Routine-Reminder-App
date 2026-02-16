import React, { useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Switch } from 'react-native';

import { useReminderStore } from '../../store/reminderStore';
import { fetchReminders, toggleReminder } from '../../api/reminderApi';

export const ReminderListScreen: React.FC = () => {
  const reminders = useReminderStore((s) => s.reminders);

  useEffect(() => {
    void fetchReminders();
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Refresh" onPress={() => void fetchReminders()} />
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.reminder_type} • {item.time_of_day}
              </Text>
            </View>
            <Switch
              value={item.is_active}
              onValueChange={() => {
                void toggleReminder(item.id);
              }}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reminders yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
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

