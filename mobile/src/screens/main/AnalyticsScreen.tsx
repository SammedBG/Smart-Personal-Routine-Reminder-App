import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useCompletionStore } from '../../store/completionStore';
import { useReminderStore } from '../../store/reminderStore';
import { fetchStreakInfo, fetchTodayCompletions } from '../../api/completionApi';
import { fetchReminders } from '../../api/reminderApi';
import { useTheme } from '../../theme/ThemeContext';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabelFromDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAY_SHORT[d.getDay()] || dateStr.slice(5);
}

const TYPE_EMOJI: Record<string, string> = {
  medicine: '\u{1F48A}',
  food: '\u{1F34E}',
  water: '\u{1F4A7}',
  sleep: '\u{1F634}',
  exercise: '\u{1F3C3}',
  custom: '\u{1F4DD}',
};

/** Convert 24h HH:MM to 12h AM/PM */
function fmt12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ap = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12; else if (h > 12) h -= 12;
  return `${h}:${m} ${ap}`;
}

export const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const streak = useCompletionStore((s) => s.streak);
  const reminders = useReminderStore((s) => s.reminders);
  const todayCompletions = useCompletionStore((s) => s.todayCompletions);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        fetchReminders(),
        fetchStreakInfo().then((info) => useCompletionStore.getState().setStreak(info)).catch(() => {}),
        fetchTodayCompletions().then((c) => useCompletionStore.getState().setTodayCompletions(c)).catch(() => {}),
      ]);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadData(); } finally { setRefreshing(false); }
  }, [loadData]);

  const activeReminders = reminders.filter((r) => r.is_active);
  const weeklyStats = streak?.weekly_stats || [];
  const maxTotal = Math.max(...weeklyStats.map((s) => s.total), 1);

  // Completion map for today
  const completionMap = useMemo(() => {
    const m: Record<string, string> = {};
    todayCompletions.forEach((c) => { m[c.reminder_id] = c.status; });
    return m;
  }, [todayCompletions]);

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary cards */}
      <View style={styles.cardRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
          <Text style={styles.summaryEmoji}>{'\u{1F514}'}</Text>
          <Text style={[styles.summaryNum, { color: colors.primary }]}>{activeReminders.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
          <Text style={styles.summaryEmoji}>{'\u2705'}</Text>
          <Text style={[styles.summaryNum, { color: colors.success }]}>{streak?.today_done || 0}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Done Today</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBg }]}>
          <Text style={styles.summaryEmoji}>{'\u{1F4C5}'}</Text>
          <Text style={[styles.summaryNum, { color: colors.text }]}>{streak?.today_total || 0}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Today</Text>
        </View>
      </View>

      {/* Weekly bar chart */}
      <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
        <View style={styles.chartRow}>
          {weeklyStats.map((day, i) => {
            const bgH = Math.max((day.total / maxTotal) * 80, day.total > 0 ? 6 : 0);
            const fillH = day.total > 0 ? Math.max((day.done / maxTotal) * 80, 4) : 0;
            const isToday = i === weeklyStats.length - 1;
            return (
              <View key={day.date} style={styles.chartCol}>
                <Text style={[styles.chartVal, { color: colors.textTertiary }]}>
                  {day.total > 0 ? `${day.done}/${day.total}` : ''}
                </Text>
                <View style={[styles.barWrap, { height: 80 }]}>
                  {day.total > 0 && (
                    <View style={[styles.barBg, { height: bgH, backgroundColor: colors.border }]} />
                  )}
                  {fillH > 0 && (
                    <View style={[
                      styles.barFill,
                      {
                        height: fillH,
                        backgroundColor: day.done >= day.total ? colors.success : colors.primary,
                      },
                    ]} />
                  )}
                </View>
                <Text style={[
                  styles.chartLabel,
                  { color: isToday ? colors.primary : colors.textSecondary },
                  isToday && { fontWeight: '700' },
                ]}>
                  {dayLabelFromDate(day.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Active reminders list */}
      <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Reminders</Text>
        {activeReminders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No active reminders yet. Add some from the Reminders tab!
          </Text>
        ) : (
          activeReminders
            .slice()
            .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
            .map((r) => {
              const status = completionMap[r.id];
              const isDone = status === 'done' || status === 'skipped';
              return (
                <View key={r.id} style={[styles.reminderRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.remEmoji}>{TYPE_EMOJI[r.reminder_type] || '\u{1F4DD}'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.remTitle, { color: colors.text }, isDone && { textDecorationLine: 'line-through', color: colors.textTertiary }]}>
                      {r.title}
                    </Text>
                    <Text style={[styles.remTime, { color: colors.primary }]}>
                      {fmt12h(r.time_of_day.slice(0, 5))} Â· {r.repeat_type}
                    </Text>
                  </View>
                  {isDone && (
                    <View style={[styles.doneBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.doneBadgeText}>{'\u2713'}</Text>
                    </View>
                  )}
                </View>
              );
            })
        )}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cardRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  summaryEmoji: { fontSize: 22, marginBottom: 4 },
  summaryNum: { fontSize: 26, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center' },
  chartVal: { fontSize: 9, marginBottom: 4 },
  barWrap: { justifyContent: 'flex-end', alignItems: 'center', width: 24 },
  barBg: { position: 'absolute', bottom: 0, width: 24, borderRadius: 4 },
  barFill: { width: 24, borderRadius: 4 },
  chartLabel: { fontSize: 11, marginTop: 6, fontWeight: '500' },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  remEmoji: { fontSize: 20 },
  remTitle: { fontSize: 14, fontWeight: '600' },
  remTime: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  doneBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
});
