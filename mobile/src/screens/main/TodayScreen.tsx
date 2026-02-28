import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Switch,
} from 'react-native';

import { useReminderStore, Reminder } from '../../store/reminderStore';
import { fetchReminders, toggleReminder } from '../../api/reminderApi';

const TYPE_EMOJI: Record<string, string> = {
  medicine: '💊',
  food: '🍎',
  water: '💧',
  sleep: '😴',
  custom: '📝',
};

/** Check if a reminder should show today based on repeat_type and custom_days */
function isScheduledForToday(reminder: Reminder): boolean {
  if (!reminder.is_active) return false;

  const { repeat_type, custom_days } = reminder;

  if (repeat_type === 'daily') return true;

  if (repeat_type === 'once') {
    // "once" reminders always show until completed / deactivated
    return true;
  }

  if (repeat_type === 'weekly' || repeat_type === 'custom') {
    // custom_days.days is an array of weekday indices: 0=Sun,1=Mon,...,6=Sat
    const days: number[] =
      custom_days && Array.isArray((custom_days as any).days)
        ? (custom_days as any).days
        : [];
    if (days.length === 0) return true; // no days set → show every day
    const jsDay = new Date().getDay(); // 0=Sun
    return days.includes(jsDay);
  }

  return true;
}

export const TodayScreen: React.FC = () => {
  const reminders = useReminderStore((s) => s.reminders);
  const [refreshing, setRefreshing] = useState(false);

  const todayReminders = useMemo(
    () =>
      reminders
        .filter(isScheduledForToday)
        .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day)),
    [reminders],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReminders();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{dateStr}</Text>
      <FlatList
        data={todayReminders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const timeStr = item.time_of_day.slice(0, 5);
          const isPast = (() => {
            const [h, m] = timeStr.split(':').map(Number);
            return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
          })();

          return (
            <View style={[styles.card, isPast && styles.cardPast]}>
              <Text style={styles.emoji}>
                {TYPE_EMOJI[item.reminder_type] || '📝'}
              </Text>
              <View style={styles.info}>
                <Text style={[styles.title, isPast && styles.titlePast]}>
                  {item.title}
                </Text>
                <Text style={styles.time}>{timeStr}</Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => void toggleReminder(item.id)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No reminders for today 🎉</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0f6ff',
    marginBottom: 10,
  },
  cardPast: {
    backgroundColor: '#f5f5f5',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  titlePast: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 13,
    color: '#4A90D9',
    marginTop: 2,
    fontWeight: '500',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
  },
});

