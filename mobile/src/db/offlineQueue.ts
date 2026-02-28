import { getDatabase } from './database';
import { apiClient } from '../api/client';
import NetInfo from '@react-native-community/netinfo';

export type PendingOperation = 'create' | 'update' | 'delete' | 'toggle';

export interface PendingChange {
  id: number;
  operation: PendingOperation;
  payload: string; // JSON stringified { endpoint, method, data }
}

interface QueuePayload {
  endpoint: string;
  method: 'post' | 'patch' | 'delete';
  data?: Record<string, unknown>;
}

/** Enqueue a failed write operation for later retry */
export async function enqueueChange(
  operation: PendingOperation,
  endpoint: string,
  method: 'post' | 'patch' | 'delete',
  data?: Record<string, unknown>,
): Promise<void> {
  const db = await getDatabase();
  const payload: QueuePayload = { endpoint, method, data };
  await db.executeSql(
    'INSERT INTO pending_changes (operation, payload) VALUES (?, ?)',
    [operation, JSON.stringify(payload)],
  );
}

/** Load all pending changes ordered by creation */
export async function loadPendingChanges(): Promise<PendingChange[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT * FROM pending_changes ORDER BY id ASC',
  );
  const items: PendingChange[] = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    items.push(result.rows.item(i));
  }
  return items;
}

/** Remove a pending change after it's been flushed */
async function removePendingChange(id: number): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM pending_changes WHERE id = ?', [id]);
}

/** Flush all pending changes to the server. Returns count of successfully flushed items. */
export async function flushPendingChanges(): Promise<number> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return 0;

  const changes = await loadPendingChanges();
  let flushed = 0;

  for (const change of changes) {
    try {
      const payload: QueuePayload = JSON.parse(change.payload);
      switch (payload.method) {
        case 'post':
          await apiClient.post(payload.endpoint, payload.data || null);
          break;
        case 'patch':
          await apiClient.patch(payload.endpoint, payload.data || null);
          break;
        case 'delete':
          await apiClient.delete(payload.endpoint);
          break;
      }
      await removePendingChange(change.id);
      flushed++;
    } catch {
      // Stop on first failure — preserve ordering
      break;
    }
  }

  return flushed;
}

/** Get the count of pending changes waiting to sync */
export async function pendingChangeCount(): Promise<number> {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    'SELECT COUNT(*) as cnt FROM pending_changes',
  );
  return result.rows.item(0).cnt;
}
