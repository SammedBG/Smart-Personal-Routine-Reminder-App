import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { apiClient } from '../api/client';
import { useReminderStore, type Reminder } from '../store/reminderStore';
import { loadAllRemindersFromDb, upsertRemindersInDb } from '../db/reminderDao';
import { flushPendingChanges } from '../db/offlineQueue';

let isSyncing = false;
let netInfoUnsubscribe: (() => void) | null = null;

export async function initialLoadReminders(): Promise<void> {
  const localReminders = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(localReminders);
}

export async function syncFromServer(): Promise<void> {
  if (isSyncing) return;
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  try {
    isSyncing = true;

    // First flush any pending offline changes
    await flushPendingChanges();

    const { lastSyncAt } = useReminderStore.getState();
    const response = await apiClient.get<{
      reminders: Reminder[];
      last_sync_at: string;
    }>('/reminders/sync', {
      params: lastSyncAt ? { since: lastSyncAt } : undefined,
    });
    const updated = response.data.reminders;
    if (updated.length) {
      await upsertRemindersInDb(updated);
      const all = await loadAllRemindersFromDb();
      useReminderStore.getState().setReminders(all);
    }
    useReminderStore.getState().setLastSyncAt(response.data.last_sync_at);
  } finally {
    isSyncing = false;
  }
}

/** Start listening for connectivity changes and auto-sync when back online */
export function startNetInfoListener(): void {
  if (netInfoUnsubscribe) return; // already listening
  let wasDisconnected = false;
  netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && wasDisconnected) {
      // Reconnected — flush pending changes and sync
      void syncFromServer();
    }
    wasDisconnected = !state.isConnected;
  });
}

/** Stop the connectivity listener */
export function stopNetInfoListener(): void {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
}

