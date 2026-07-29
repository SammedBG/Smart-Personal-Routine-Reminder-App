import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { apiClient } from '../api/client';
import { useReminderStore, type Reminder } from '../store/reminderStore';
import { loadAllRemindersFromDb, upsertRemindersInDb } from '../db/reminderDao';
import { flushPendingChanges } from '../db/offlineQueue';

let isSyncing = false;
let netInfoUnsubscribe: (() => void) | null = null;

type SyncResponse = {
  reminders: Reminder[];
  last_sync_at: string;
  total_count: number;
  has_more: boolean;
  server_timezone: string;
};

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function initialLoadReminders(): Promise<void> {
  const localReminders = await loadAllRemindersFromDb();
  useReminderStore.getState().setReminders(localReminders);
}

export async function syncFromServer(): Promise<void> {
  if (isSyncing) return;
  const netState = await NetInfo.fetch();
  if (netState.isConnected !== true) return;

  try {
    isSyncing = true;

    // First flush any pending offline changes
    await flushPendingChanges();

    const { lastSyncAt } = useReminderStore.getState();
    const since = lastSyncAt ?? undefined;
    const timezone = getDeviceTimezone();
    const limit = 50;
    let skip = 0;
    let hasMore = true;
    let lastSyncFromServer: string | null = null;

    while (hasMore) {
      const response = await apiClient.get<SyncResponse>('/reminders/sync', {
        params: {
          since,
          skip,
          limit,
          timezone,
        },
      });

      const updated = response.data.reminders;
      if (updated.length) {
        await upsertRemindersInDb(updated);
        const all = await loadAllRemindersFromDb();
        useReminderStore.getState().setReminders(all);
      }

      lastSyncFromServer = response.data.last_sync_at;
      hasMore = response.data.has_more === true;
      skip += limit;
    }

    if (lastSyncFromServer) {
      useReminderStore.getState().setLastSyncAt(lastSyncFromServer);
    }
  } catch {
    console.warn('Sync failed; will retry on next sync cycle.');
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

