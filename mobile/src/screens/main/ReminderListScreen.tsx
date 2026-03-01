import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
    { key: 'medicine', label: '💊 Medicine' },
    { key: 'food', label: '🍎 Food' },
    { key: 'water', label: '💧 Water' },
    { key: 'sleep', label: '😴 Sleep' },
    { key: 'exercise', label: '🏃 Exercise' },
    { key: 'custom', label: '📝 Custom' },
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
        <Text style={styles.searchIcon}>🔍</Text>
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search reminders..."
            placeholderTextColor="#999"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.chipBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {STATUS_CHIPS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, statusFilter === c.key && styles.chipActive]}
              onPress={() => setStatusFilter(c.key)}>
              <Text style={[styles.chipText, statusFilter === c.key && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.chipDivider} />
          {TYPE_CHIPS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, typeFilter === c.key && styles.chipActive]}
              onPress={() => setTypeFilter(typeFilter === c.key ? null : c.key)}>
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
            <ActivityIndicator size="large" color="#4A90D9" style={{ paddingVertical: 32 }} />
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
              }>
              <Text style={styles.emoji}>
                {TYPE_EMOJI[item.reminder_type] || '📝'}
              </Text>
              <View style={styles.info}>
                <Text
                  style={[
                    styles.title,
                    !item.is_active && styles.titleDisabled,
                  ]}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle}>
                  {formatTime12h(item.time_of_day.slice(0, 5))} · {item.repeat_type}
                  {item.reminder_type === 'medicine' && item.medicine_details?.dosage
                    ? ` · ${item.medicine_details.dosage}`
                    : ''}
                </Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={() => handleToggle(item.id)}
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
        onPress={() => navigation.navigate('ReminderEdit')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInputWrap: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 6,
  },
  chipBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  },
  chipScroll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    marginRight: 4,
  },
  chipActive: {
    backgroundColor: '#4A90D9',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  itemDisabled: {
    opacity: 0.5,
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
  titleDisabled: {
    color: '#999',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});

