import { apiClient } from './client';
import type { Reminder } from '../store/reminderStore';
import { upsertRemindersInDb, loadAllRemindersFromDb } from '../db/reminderDao';
import { useReminderStore } from '../store/reminderStore';

type ReminderPayload = {
  title: string;
  description?: string;
  reminder_type: string;
  time_of_day: string;
  repeat_type: string;
  custom_days?: Record<string, unknown> | null;
  is_active: boolean;
};

export async function fetchReminders(): Promise<void> {
  const items = await apiClient.get<Reminder[]>('/reminders').then((r) => r.data);
  await upsertRemindersInDb(items);
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function createReminder(payload: ReminderPayload): Promise<void> {
  const created = await apiClient.post<Reminder>('/reminders', payload).then((r) => r.data);
  await upsertRemindersInDb([created]);
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function updateReminder(id: string, payload: Partial<ReminderPayload>): Promise<void> {
  const updated = await apiClient.patch<Reminder>(`/reminders/${id}`, payload).then((r) => r.data);
  await upsertRemindersInDb([updated]);
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function deleteReminder(id: string): Promise<void> {
  await apiClient.delete(`/reminders/${id}`);
  // Remove from local DB and store
  const current = useReminderStore.getState().reminders.filter((r) => r.id !== id);
  useReminderStore.getState().setReminders(current);
}

export async function toggleReminder(id: string): Promise<void> {
  const updated = await apiClient.post<Reminder>(`/reminders/${id}/toggle`).then((r) => r.data);
  await upsertRemindersInDb([updated]);
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

