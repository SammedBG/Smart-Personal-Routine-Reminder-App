import { create } from 'zustand';

export type ReminderType = 'medicine' | 'food' | 'water' | 'sleep' | 'exercise' | 'custom';
export type RepeatType = 'once' | 'daily' | 'weekly' | 'custom';

export type MedicineDetails = {
  dosage?: string | null;
  quantity?: number | null;
  before_food?: boolean | null;
  duration_days?: number | null;
};

export type ExerciseDetails = {
  exercise_type?: string | null;
  duration_minutes?: number | null;
  intensity?: string | null;
};

export type Reminder = {
  id: string;
  title: string;
  description?: string | null;
  reminder_type: ReminderType;
  time_of_day: string;
  repeat_type: RepeatType;
  custom_days?: Record<string, unknown> | null;
  is_active: boolean;
  next_trigger_at?: string | null;
  last_triggered_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  medicine_details?: MedicineDetails | null;
  exercise_details?: ExerciseDetails | null;
  version: number;
  created_at: string;
  updated_at: string;
};

type ReminderState = {
  reminders: Reminder[];
  lastSyncAt: string | null;
  setReminders: (reminders: Reminder[]) => void;
  setLastSyncAt: (iso: string | null) => void;
};

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: [],
  lastSyncAt: null,
  setReminders: (reminders) => set({ reminders }),
  setLastSyncAt: (iso) => set({ lastSyncAt: iso }),
}));

