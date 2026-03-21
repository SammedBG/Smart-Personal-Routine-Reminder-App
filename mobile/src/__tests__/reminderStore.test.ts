import { useReminderStore, Reminder } from '../store/reminderStore';

const makeReminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: 'r1',
  title: 'Test Reminder',
  reminder_type: 'medicine',
  time_of_day: '08:00:00',
  repeat_type: 'daily',
  is_active: true,
  version: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('useReminderStore', () => {
  beforeEach(() => {
    useReminderStore.setState({
      reminders: [],
      lastSyncAt: null,
    });
  });

  it('should initialize with empty reminders', () => {
    const state = useReminderStore.getState();
    expect(state.reminders).toEqual([]);
    expect(state.lastSyncAt).toBeNull();
  });

  it('should set reminders', () => {
    const reminders = [makeReminder(), makeReminder({ id: 'r2', title: 'Second' })];
    useReminderStore.getState().setReminders(reminders);

    expect(useReminderStore.getState().reminders).toHaveLength(2);
    expect(useReminderStore.getState().reminders[0].title).toBe('Test Reminder');
    expect(useReminderStore.getState().reminders[1].title).toBe('Second');
  });

  it('should replace all reminders on setReminders', () => {
    useReminderStore.getState().setReminders([makeReminder()]);
    useReminderStore.getState().setReminders([makeReminder({ id: 'r3', title: 'Replaced' })]);

    expect(useReminderStore.getState().reminders).toHaveLength(1);
    expect(useReminderStore.getState().reminders[0].id).toBe('r3');
  });

  it('should set lastSyncAt', () => {
    useReminderStore.getState().setLastSyncAt('2025-06-15T12:00:00Z');
    expect(useReminderStore.getState().lastSyncAt).toBe('2025-06-15T12:00:00Z');
  });

  it('should handle null lastSyncAt', () => {
    useReminderStore.getState().setLastSyncAt('2025-06-15T12:00:00Z');
    useReminderStore.getState().setLastSyncAt(null);
    expect(useReminderStore.getState().lastSyncAt).toBeNull();
  });

  it('should handle different reminder types', () => {
    const reminders = [
      makeReminder({ id: '1', reminder_type: 'medicine' }),
      makeReminder({ id: '2', reminder_type: 'water' }),
      makeReminder({ id: '3', reminder_type: 'exercise' }),
      makeReminder({ id: '4', reminder_type: 'food' }),
      makeReminder({ id: '5', reminder_type: 'sleep' }),
      makeReminder({ id: '6', reminder_type: 'custom' }),
    ];
    useReminderStore.getState().setReminders(reminders);
    expect(useReminderStore.getState().reminders).toHaveLength(6);
  });

  it('should handle reminders with medicine details', () => {
    const r = makeReminder({
      medicine_details: {
        dosage: '500mg',
        quantity: 2,
        before_food: true,
        duration_days: 14,
      },
    });
    useReminderStore.getState().setReminders([r]);
    const stored = useReminderStore.getState().reminders[0];
    expect(stored.medicine_details?.dosage).toBe('500mg');
    expect(stored.medicine_details?.quantity).toBe(2);
  });

  it('should handle reminders with exercise details', () => {
    const r = makeReminder({
      reminder_type: 'exercise',
      exercise_details: {
        exercise_type: 'cardio',
        duration_minutes: 30,
        intensity: 'moderate',
      },
    });
    useReminderStore.getState().setReminders([r]);
    const stored = useReminderStore.getState().reminders[0];
    expect(stored.exercise_details?.exercise_type).toBe('cardio');
    expect(stored.exercise_details?.duration_minutes).toBe(30);
  });
});
