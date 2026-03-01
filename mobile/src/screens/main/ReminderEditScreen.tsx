import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  createReminder,
  updateReminder,
  deleteReminder,
} from '../../api/reminderApi';
import {
  useReminderStore,
  ReminderType,
  RepeatType,
  MedicineDetails,
  ExerciseDetails,
} from '../../store/reminderStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const REMINDER_TYPES: { label: string; value: ReminderType }[] = [
  { label: '💊 Medicine', value: 'medicine' },
  { label: '🍎 Food', value: 'food' },
  { label: '💧 Water', value: 'water' },
  { label: '😴 Sleep', value: 'sleep' },
  { label: '🏃 Exercise', value: 'exercise' },
  { label: '✏️ Custom', value: 'custom' },
];

const REPEAT_TYPES: { label: string; value: RepeatType }[] = [
  { label: 'Once', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

const EXERCISE_TYPES = ['Cardio', 'Yoga', 'Strength', 'Stretching', 'Walking', 'Other'];
const INTENSITY_LEVELS = ['Light', 'Moderate', 'Intense'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ScreenRoute = RouteProp<RootStackParamList, 'ReminderEdit'>;
type ScreenNav = NativeStackNavigationProp<RootStackParamList>;

export const ReminderEditScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNav>();
  const route = useRoute<ScreenRoute>();
  const reminderId = route.params?.reminderId;
  const isEdit = !!reminderId;

  const existingReminder = useReminderStore((s) =>
    s.reminders.find((r) => r.id === reminderId),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('medicine');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Medicine-specific fields
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [beforeFood, setBeforeFood] = useState(true);
  const [durationDays, setDurationDays] = useState('');

  // Exercise-specific fields
  const [exerciseType, setExerciseType] = useState('Cardio');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [intensity, setIntensity] = useState('Moderate');

  // Date range fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (existingReminder) {
      setTitle(existingReminder.title);
      setDescription(existingReminder.description || '');
      setReminderType(existingReminder.reminder_type);
      const t = existingReminder.time_of_day;
      setTimeOfDay(t.length > 5 ? t.slice(0, 5) : t);
      setRepeatType(existingReminder.repeat_type);
      if (
        existingReminder.custom_days &&
        Array.isArray((existingReminder.custom_days as any).days)
      ) {
        setCustomDays((existingReminder.custom_days as any).days);
      }
      setIsActive(existingReminder.is_active);

      // Load medicine details
      if (existingReminder.medicine_details) {
        const md = existingReminder.medicine_details;
        setDosage(md.dosage || '');
        setQuantity(String(md.quantity || 1));
        setBeforeFood(md.before_food ?? true);
        setDurationDays(md.duration_days ? String(md.duration_days) : '');
      }

      // Load exercise details
      if (existingReminder.exercise_details) {
        const ed = existingReminder.exercise_details;
        setExerciseType(ed.exercise_type || 'Cardio');
        setDurationMinutes(ed.duration_minutes ? String(ed.duration_minutes) : '30');
        setIntensity(ed.intensity || 'Moderate');
      }

      // Load date range
      if (existingReminder.start_date) {
        setStartDate(existingReminder.start_date.slice(0, 10));
      }
      if (existingReminder.end_date) {
        setEndDate(existingReminder.end_date.slice(0, 10));
      }
    }
  }, [existingReminder]);

  const toggleDay = (index: number) => {
    setCustomDays((prev) =>
      prev.includes(index)
        ? prev.filter((d) => d !== index)
        : [...prev, index].sort(),
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeOfDay)) {
      Alert.alert('Validation', 'Time must be in HH:MM format');
      return;
    }

    // Validate date fields if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate.trim() && !dateRegex.test(startDate.trim())) {
      Alert.alert('Validation', 'Start date must be in YYYY-MM-DD format');
      return;
    }
    if (endDate.trim() && !dateRegex.test(endDate.trim())) {
      Alert.alert('Validation', 'End date must be in YYYY-MM-DD format');
      return;
    }
    if (startDate.trim() && endDate.trim() && startDate.trim() > endDate.trim()) {
      Alert.alert('Validation', 'End date must be on or after start date');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        reminder_type: reminderType,
        time_of_day: timeOfDay.length === 5 ? timeOfDay + ':00' : timeOfDay,
        repeat_type: repeatType,
        custom_days:
          (repeatType === 'weekly' || repeatType === 'custom') &&
          customDays.length > 0
            ? { days: customDays }
            : null,
        is_active: isActive,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
      };

      // Add medicine details if type is medicine
      if (reminderType === 'medicine') {
        payload.medicine_details = {
          dosage: dosage.trim() || null,
          quantity: parseInt(quantity, 10) || 1,
          before_food: beforeFood,
          duration_days: durationDays ? parseInt(durationDays, 10) : null,
        };
      }

      // Add exercise details if type is exercise
      if (reminderType === 'exercise') {
        payload.exercise_details = {
          exercise_type: exerciseType.toLowerCase(),
          duration_minutes: parseInt(durationMinutes, 10) || 30,
          intensity: intensity.toLowerCase(),
        };
      }

      if (isEdit && reminderId) {
        await updateReminder(reminderId, payload);
      } else {
        await createReminder(payload as any);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!reminderId) return;
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminderId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Take morning vitamins"
        placeholderTextColor="#999"
        maxLength={255}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Additional details..."
        placeholderTextColor="#999"
        multiline
        maxLength={1024}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipRow}>
        {REMINDER_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.chip,
              reminderType === t.value && styles.chipSelected,
            ]}
            onPress={() => setReminderType(t.value)}>
            <Text
              style={[
                styles.chipText,
                reminderType === t.value && styles.chipTextSelected,
              ]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Medicine-specific fields */}
      {reminderType === 'medicine' && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Medicine Details</Text>

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 500mg, 1 tablet"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Before Food</Text>
            <Switch value={beforeFood} onValueChange={setBeforeFood} />
          </View>

          <Text style={styles.label}>Duration (days, optional)</Text>
          <TextInput
            style={styles.input}
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="e.g. 30"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Exercise-specific fields */}
      {reminderType === 'exercise' && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Exercise Details</Text>

          <Text style={styles.label}>Exercise Type</Text>
          <View style={styles.chipRow}>
            {EXERCISE_TYPES.map((et) => (
              <TouchableOpacity
                key={et}
                style={[
                  styles.chip,
                  exerciseType === et && styles.chipSelected,
                ]}
                onPress={() => setExerciseType(et)}>
                <Text
                  style={[
                    styles.chipText,
                    exerciseType === et && styles.chipTextSelected,
                  ]}>
                  {et}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="30"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Intensity</Text>
          <View style={styles.chipRow}>
            {INTENSITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  intensity === level && styles.chipSelected,
                ]}
                onPress={() => setIntensity(level)}>
                <Text
                  style={[
                    styles.chipText,
                    intensity === level && styles.chipTextSelected,
                  ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.label}>Time</Text>
      <TextInput
        style={styles.input}
        value={timeOfDay}
        onChangeText={setTimeOfDay}
        placeholder="HH:MM"
        placeholderTextColor="#999"
        keyboardType="numbers-and-punctuation"
        maxLength={8}
      />

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.chipRow}>
        {REPEAT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.chip,
              repeatType === t.value && styles.chipSelected,
            ]}
            onPress={() => setRepeatType(t.value)}>
            <Text
              style={[
                styles.chipText,
                repeatType === t.value && styles.chipTextSelected,
              ]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(repeatType === 'weekly' || repeatType === 'custom') && (
        <>
          <Text style={styles.label}>Days</Text>
          <View style={styles.chipRow}>
            {WEEKDAYS.map((day, i) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  customDays.includes(i) && styles.dayChipSelected,
                ]}
                onPress={() => toggleDay(i)}>
                <Text
                  style={[
                    styles.dayText,
                    customDays.includes(i) && styles.dayTextSelected,
                  ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <Text style={styles.label}>Start Date (optional, YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="e.g. 2025-01-15"
        placeholderTextColor="#999"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <Text style={styles.label}>End Date (optional, YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="e.g. 2025-12-31"
        placeholderTextColor="#999"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}>
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving...' : isEdit ? 'Update Reminder' : 'Create Reminder'}
        </Text>
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete Reminder</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#222',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  chipSelected: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  dayChipSelected: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  dayText: { fontSize: 12, color: '#333' },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  detailsSection: {
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf4',
  },
  detailsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A90D9',
    marginBottom: 4,
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9534f',
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#d9534f', fontSize: 16, fontWeight: '600' },
});
