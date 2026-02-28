import { apiClient } from './client';
import type { Reminder } from '../store/reminderStore';
import { upsertRemindersInDb, loadAllRemindersFromDb, deleteReminderFromDb } from '../db/reminderDao';
import { useReminderStore } from '../store/reminderStore';
import { enqueueChange } from '../db/offlineQueue';

type ReminderPayload = {
  title: string;
  description?: string;
  reminder_type: string;
  time_of_day: string;
  repeat_type: string;
  custom_days?: Record<string, unknown> | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  medicine_details?: Record<string, unknown> | null;
  exercise_details?: Record<string, unknown> | null;
};

function isNetworkError(e: any): boolean {
  return !e?.response && (e?.message === 'Network Error' || e?.code === 'ECONNABORTED');
}

export async function fetchReminders(): Promise<void> {
  try {
    const items = await apiClient.get<Reminder[]>('/reminders').then((r) => r.data);
    await upsertRemindersInDb(items);
  } catch {
    // Fall back to local data when offline
  }
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function createReminder(payload: ReminderPayload): Promise<void> {
  try {
    const created = await apiClient.post<Reminder>('/reminders', payload).then((r) => r.data);
    await upsertRemindersInDb([created]);
  } catch (e: any) {
    if (isNetworkError(e)) {
      await enqueueChange('create', '/reminders', 'post', payload as Record<string, unknown>);
    } else {
      throw e;
    }
  }
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function updateReminder(id: string, payload: Partial<ReminderPayload>): Promise<void> {
  try {
    const updated = await apiClient.patch<Reminder>(`/reminders/${id}`, payload).then((r) => r.data);
    await upsertRemindersInDb([updated]);
  } catch (e: any) {
    if (isNetworkError(e)) {
      await enqueueChange('update', `/reminders/${id}`, 'patch', payload as Record<string, unknown>);
    } else {
      throw e;
    }
  }
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function deleteReminder(id: string): Promise<void> {
  try {
    await apiClient.delete(`/reminders/${id}`);
  } catch (e: any) {
    if (isNetworkError(e)) {
      await enqueueChange('delete', `/reminders/${id}`, 'delete');
    } else {
      throw e;
    }
  }
  await deleteReminderFromDb(id);
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

export async function toggleReminder(id: string): Promise<void> {
  try {
    const updated = await apiClient.post<Reminder>(`/reminders/${id}/toggle`).then((r) => r.data);
    await upsertRemindersInDb([updated]);
  } catch (e: any) {
    if (isNetworkError(e)) {
      await enqueueChange('toggle', `/reminders/${id}/toggle`, 'post');
    } else {
      throw e;
    }
  }
  const all = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(all);
}

