import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';

import { useReminderStore, Reminder } from '../../store/reminderStore';
import { fetchReminders, toggleReminder, deleteReminder } from '../../api/reminderApi';
import { useTheme } from '../../theme/ThemeContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_EMOJI: Record<string, string> = {
  medicine: '\u{1F48A}',
  food: '\u{1F34E}',
  water: '\u{1F4A7}',
  sleep: '\u{1F634}',
  exercise: '\u{1F3C3}',
  custom: '\u{1F4DD}',
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

const SwipeableRow: React.FC<{
  reminder: Reminder;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ reminder, onDelete, onToggle, children }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={swStyles.rightContainer}>
        <TouchableOpacity
          style={[swStyles.actionBtn, swStyles.toggleBtn]}
          onPress={() => {
            swipeableRef.current?.close();
            onToggle(reminder.id);
          }}>
          <Animated.Text style={[swStyles.actionText, { transform: [{ scale }] }]}>
            {reminder.is_active ? '⏸' : '▶'}
          </Animated.Text>
          <Animated.Text style={[swStyles.actionLabel, { transform: [{ scale }] }]}>
            {reminder.is_active ? 'Disable' : 'Enable'}
          </Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[swStyles.actionBtn, swStyles.deleteBtn]}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(reminder.id);
          }}>
          <Animated.Text style={[swStyles.actionText, { transform: [{ scale }] }]}>
            🗑
          </Animated.Text>
          <Animated.Text style={[swStyles.actionLabel, { transform: [{ scale }] }]}>
            Delete
          </Animated.Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      {children}
    </Swipeable>
  );
};

const swStyles = StyleSheet.create({
  rightContainer: {
    flexDirection: 'row',
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  toggleBtn: {
    backgroundColor: '#f0ad4e',
  },
  deleteBtn: {
    backgroundColor: '#d9534f',
  },
  actionText: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
});

export const ReminderListScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const reminders = useReminderStore((s) => s.reminders);
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchReminders().finally(() => setInitialLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchReminders();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReminders();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Reminder', 'Delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteReminder(id),
      },
    ]);
  };

  const handleToggle = (id: string) => {
    void toggleReminder(id);
  };

  const filteredReminders = reminders.filter((r) => {
    if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) {
      return false;
    }
    if (typeFilter && r.reminder_type !== typeFilter) return false;
    if (statusFilter === 'active' && !r.is_active) return false;
    if (statusFilter === 'inactive' && r.is_active) return false;
    return true;
  });

  const TYPE_CHIPS = [
    { key: 'medicine', label: '\u{1F48A} Medicine' },
    { key: 'food', label: '\u{1F34E} Food' },
    { key: 'water', label: '\u{1F4A7} Water' },
    { key: 'sleep', label: '\u{1F634} Sleep' },
    { key: 'exercise', label: '\u{1F3C3} Exercise' },
    { key: 'custom', label: '\u{1F4DD} Custom' },
  ];
  const STATUS_CHIPS = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'inactive' as const, label: 'Inactive' },
  ];

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search reminders..."
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search reminders"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 16, color: colors.textTertiary }}>{'\u2715'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.chipBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {STATUS_CHIPS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, statusFilter === c.key && styles.chipActive]}
              onPress={() => setStatusFilter(c.key)}
              accessibilityLabel={`Filter ${c.label}`}
              accessibilityRole="button">
              <Text style={[styles.chipText, statusFilter === c.key && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {TYPE_CHIPS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, typeFilter === c.key && styles.chipActive]}
              onPress={() => setTypeFilter(typeFilter === c.key ? null : c.key)}
              accessibilityLabel={`Filter by ${c.label}`}
              accessibilityRole="button">
              <Text style={[styles.chipText, typeFilter === c.key && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          initialLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ paddingVertical: 32 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <SwipeableRow
            reminder={item}
            onDelete={handleDelete}
            onToggle={handleToggle}>
            <TouchableOpacity
              style={[styles.item, !item.is_active && styles.itemDisabled]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ReminderEdit', { reminderId: item.id })
              }
              accessibilityLabel={`Edit reminder ${item.title}`}
              accessibilityRole="button">
              <View style={[styles.emojiCircle, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.emoji}>
                  {TYPE_EMOJI[item.reminder_type] || '\u{1F4DD}'}
                </Text>
              </View>
              <View style={styles.info}>
                <Text
                  style={[
                    styles.title,
                    !item.is_active && styles.titleDisabled,
                  ]}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle}>
                  {formatTime12h(item.time_of_day.slice(0, 5))} {'\u00B7'} {item.repeat_type}
                  {item.reminder_type === 'medicine' && item.medicine_details?.dosage
                    ? ` \u00B7 ${item.medicine_details.dosage}`
                    : ''}
                </Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => handleToggle(item.id)}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={item.is_active ? colors.primary : colors.textTertiary}
                accessibilityLabel={`Toggle ${item.title} ${item.is_active ? 'off' : 'on'}`}
              />
            </TouchableOpacity>
          </SwipeableRow>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No reminders yet.{'\n'}Tap + to create one.
          </Text>
        }
      />
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ReminderEdit')}
        accessibilityLabel="Create new reminder"
        accessibilityRole="button">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 2,
  },
  chipBar: {
    marginBottom: 4,
  },
  chipScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 4,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  itemDisabled: {
    opacity: 0.5,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  titleDisabled: {
    color: colors.textTertiary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 15,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  },
});

