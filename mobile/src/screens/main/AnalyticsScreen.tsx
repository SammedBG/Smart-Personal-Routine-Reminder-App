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
import { fetchStreakInfo, DailyStats } from '../../api/completionApi';
import { useTheme } from '../../theme/ThemeContext';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Derive short weekday label from a YYYY-MM-DD date string */
function dayLabelFromDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAY_SHORT[d.getDay()] || dateStr.slice(5);
}

export const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const streak = useCompletionStore((s) => s.streak);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const info = await fetchStreakInfo();
      useCompletionStore.getState().setStreak(info);
    } catch {
      // silently fail
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadData(); } finally { setRefreshing(false); }
  }, [loadData]);

  const weeklyStats = streak?.weekly_stats || [];
  const maxTotal = Math.max(...weeklyStats.map((s) => s.total), 1);

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Streak Cards */}
      <View style={styles.streakRow}>
        <View style={[styles.streakCard, styles.streakCardPrimary]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🏆</Text>
          <Text style={styles.streakNumber}>{streak?.longest_streak || 0}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>

      {/* Today Summary */}
      <View style={styles.todayCard}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.todayRow}>
          <View style={styles.todayStat}>
            <Text style={styles.todayNumber}>{streak?.today_done || 0}</Text>
            <Text style={styles.todayLabel}>Done</Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayStat}>
            <Text style={styles.todayNumber}>{streak?.today_total || 0}</Text>
            <Text style={styles.todayLabel}>Total</Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayStat}>
            <Text style={[styles.todayNumber, styles.rateText]}>
              {Math.round((streak?.today_rate || 0) * 100)}%
            </Text>
            <Text style={styles.todayLabel}>Rate</Text>
          </View>
        </View>
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.chartContainer}>
          {weeklyStats.map((day, index) => {
            const barHeight = day.total > 0
              ? Math.max((day.done / maxTotal) * 100, 4)
              : 4;
            const bgHeight = day.total > 0
              ? Math.max((day.total / maxTotal) * 100, 4)
              : 4;
            const dayLabel = dayLabelFromDate(day.date);
            const isToday = index === weeklyStats.length - 1;

            return (
              <View key={day.date} style={styles.chartColumn}>
                <Text style={styles.chartValue}>
                  {day.total > 0 ? `${day.done}/${day.total}` : '-'}
                </Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.barBg,
                      { height: bgHeight },
                    ]}
                  />
                  <View
                    style={[
                      styles.barFill,
                      { height: barHeight },
                      day.done === day.total && day.total > 0 && styles.barPerfect,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.chartLabel,
                    isToday && styles.chartLabelToday,
                  ]}
                >
                  {dayLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.sectionTitle}>Tips</Text>
        {(streak?.current_streak || 0) === 0 && (
          <Text style={styles.tipText}>
            Complete all your reminders today to start a streak! 💪
          </Text>
        )}
        {(streak?.current_streak || 0) > 0 &&
          (streak?.current_streak || 0) < 7 && (
            <Text style={styles.tipText}>
              Keep going! You&apos;re building a great habit. 🌱
            </Text>
          )}
        {(streak?.current_streak || 0) >= 7 && (
          <Text style={styles.tipText}>
            Amazing! You&apos;ve been consistent for over a week! 🌟
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  streakRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  streakCardPrimary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  streakEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  streakLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  rateText: {
    color: colors.primary,
  },
  todayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  todayDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  chartCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartValue: {
    fontSize: 10,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  barContainer: {
    width: 24,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barBg: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  barFill: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barPerfect: {
    backgroundColor: colors.success,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  chartLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
