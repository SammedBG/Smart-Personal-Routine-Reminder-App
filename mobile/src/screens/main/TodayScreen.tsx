import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useReminderStore, Reminder } from '../../store/reminderStore';
import { useCompletionStore } from '../../store/completionStore';
import { fetchReminders, toggleReminder } from '../../api/reminderApi';
import {
  recordCompletion,
  fetchTodayCompletions,
  fetchStreakInfo,
  CompletionStatus,
} from '../../api/completionApi';
import { useTheme } from '../../theme/ThemeContext';

const TYPE_EMOJI: Record<string, string> = {
  medicine: '💊',
  food: '🍎',
  water: '💧',
  sleep: '😴',
  exercise: '🏃',
  custom: '📝',
};

/** Convert 24-hour HH:MM string to 12-hour AM/PM format */
function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Check if a reminder should show today based on repeat_type, custom_days, and date range */
function isScheduledForToday(reminder: Reminder): boolean {
  if (!reminder.is_active) return false;

  // Enforce start_date / end_date boundaries
  const todayStr = new Date().toISOString().slice(0, 10);
  if (reminder.start_date && todayStr < reminder.start_date.slice(0, 10)) return false;
  if (reminder.end_date && todayStr > reminder.end_date.slice(0, 10)) return false;

  const { repeat_type, custom_days } = reminder;
  if (repeat_type === 'daily') return true;
  if (repeat_type === 'once') return true;
  if (repeat_type === 'weekly' || repeat_type === 'custom') {
    const days: number[] =
      custom_days && Array.isArray((custom_days as any).days)
        ? (custom_days as any).days
        : [];
    if (days.length === 0) return true;
    const jsDay = new Date().getDay();
    return days.includes(jsDay);
  }
  return true;
}

type SectionData = {
  title: string;
  data: Reminder[];
};

export const TodayScreen: React.FC = () => {
  const { isDark, colors } = useTheme();
  const reminders = useReminderStore((s) => s.reminders);
  const todayCompletions = useCompletionStore((s) => s.todayCompletions);
  const streak = useCompletionStore((s) => s.streak);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchReminders(),
      fetchTodayCompletions()
        .then((c) => useCompletionStore.getState().setTodayCompletions(c))
        .catch(() => {}),
      fetchStreakInfo()
        .then((s) => useCompletionStore.getState().setStreak(s))
        .catch(() => {}),
    ]);
    setInitialLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
  );

  // Build completion lookup: reminder_id -> status
  const completionMap = useMemo(() => {
    const map: Record<string, CompletionStatus> = {};
    todayCompletions.forEach((c) => {
      map[c.reminder_id] = c.status;
    });
    return map;
  }, [todayCompletions]);

  // Section the reminders
  const sections = useMemo(() => {
    const today = reminders
      .filter(isScheduledForToday)
      .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));

    const now = new Date();
    const upcoming: Reminder[] = [];
    const completed: Reminder[] = [];
    const missed: Reminder[] = [];

    today.forEach((r) => {
      const status = completionMap[r.id];
      if (status === 'done' || status === 'skipped') {
        completed.push(r);
      } else {
        const [h, m] = r.time_of_day.split(':').map(Number);
        const isPast =
          now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
        if (isPast && !status) {
          missed.push(r);
        } else {
          upcoming.push(r);
        }
      }
    });

    const result: SectionData[] = [];
    if (upcoming.length > 0) result.push({ title: 'Upcoming', data: upcoming });
    if (missed.length > 0) result.push({ title: 'Missed', data: missed });
    if (completed.length > 0) result.push({ title: 'Completed', data: completed });
    return result;
  }, [reminders, completionMap]);

  // Progress calculation
  const totalToday = useMemo(
    () => reminders.filter(isScheduledForToday).length,
    [reminders],
  );
  const doneCount = useMemo(
    () =>
      todayCompletions.filter(
        (c) => c.status === 'done' || c.status === 'skipped',
      ).length,
    [todayCompletions],
  );
  const progressPct = totalToday > 0 ? Math.round((doneCount / totalToday) * 100) : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadAll(); } finally { setRefreshing(false); }
  }, [loadAll]);

  // Auto-record missed completions for past-due reminders
  const autoMissedRan = useRef(false);
  useEffect(() => {
    if (autoMissedRan.current) return;
    const today = reminders.filter(isScheduledForToday);
    const now2 = new Date();
    const missedWithoutRecord = today.filter((r) => {
      if (completionMap[r.id]) return false; // already has a record
      const [h, m] = r.time_of_day.split(':').map(Number);
      return now2.getHours() > h || (now2.getHours() === h && now2.getMinutes() >= m);
    });
    if (missedWithoutRecord.length === 0) return;
    autoMissedRan.current = true;
    // Record each as "missed" in background
    Promise.all(
      missedWithoutRecord.map(async (r) => {
        try {
          const record = await recordCompletion(r.id, 'missed', new Date().toISOString());
          useCompletionStore.getState().addCompletion(record);
        } catch {
          // ignore individual failures
        }
      }),
    ).then(() => {
      fetchStreakInfo()
        .then((s) => useCompletionStore.getState().setStreak(s))
        .catch(() => {});
    });
  }, [reminders, completionMap]);

  const handleAction = async (reminder: Reminder, status: CompletionStatus) => {
    try {
      const scheduledAt = new Date().toISOString();
      let snoozedTo: string | undefined;
      if (status === 'snoozed') {
        // Snooze by 15 minutes
        const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
        snoozedTo = snoozeTime.toISOString();
      }
      const record = await recordCompletion(reminder.id, status, scheduledAt, snoozedTo);
      useCompletionStore.getState().addCompletion(record);
      // Refresh streak
      fetchStreakInfo()
        .then((s) => useCompletionStore.getState().setStreak(s))
        .catch(() => {});
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to record action');
    }
  };

  const now = new Date();
  const dateStr = `${WEEKDAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with date + streak */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.date, { color: colors.text }]}>{dateStr}</Text>
          {streak && streak.current_streak > 0 && (
            <Text style={[styles.streakBadge, { color: colors.warning }]}>
              🔥 {streak.current_streak} day streak
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.cardBg }]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.text }]}>Today&apos;s Progress</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{progressPct}%</Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.primaryLight }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPct}%` as any, backgroundColor: colors.primary },
              progressPct === 100 && { backgroundColor: colors.success },
            ]}
          />
        </View>
        <Text style={[styles.progressSubtext, { color: colors.textTertiary }]}>
          {doneCount} of {totalToday} completed
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const timeStr = item.time_of_day.slice(0, 5);
          const displayTime = formatTime12h(timeStr);
          const status = completionMap[item.id];
          const isDone = status === 'done' || status === 'skipped';
          const isMissed = !isDone && (() => {
            const [h, m] = timeStr.split(':').map(Number);
            return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
          })();

          return (
            <View style={[
              styles.card,
              { backgroundColor: colors.cardBg },
              isDone && { backgroundColor: isDark ? '#1a2e1a' : '#f0f9f0', opacity: 0.8 },
              isMissed && [styles.cardMissed, { borderLeftColor: colors.danger }],
            ]}>
              <Text style={styles.emoji}>
                {TYPE_EMOJI[item.reminder_type] || '📝'}
              </Text>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }, isDone && { color: colors.textTertiary, textDecorationLine: 'line-through' }]}>
                  {item.title}
                </Text>
                <Text style={[styles.time, { color: colors.primary }]}>
                  {displayTime}
                  {item.reminder_type === 'medicine' && item.medicine_details?.dosage
                    ? ` · ${item.medicine_details.dosage}`
                    : ''}
                </Text>
              </View>
              {isDone ? (
                <View style={[styles.doneCheckContainer, { backgroundColor: colors.success }]}>
                  <Text style={styles.doneCheck}>
                    {status === 'done' ? '✓' : '⏭'}
                  </Text>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleAction(item, 'done')}>
                    <Text style={styles.actionBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => handleAction(item, 'skipped')}>
                    <Text style={styles.actionBtnTextAlt}>⏭</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: isDark ? '#3a2800' : '#fff3e0' }]}
                    onPress={() => handleAction(item, 'snoozed')}>
                    <Text style={styles.actionBtnTextAlt}>⏰</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textTertiary }]}>No reminders for today 🎉</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakBadge: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  cardMissed: {
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c', // overridden inline when theming
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnTextAlt: {
    fontSize: 14,
  },
  doneCheckContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    fontSize: 15,
  },
});

