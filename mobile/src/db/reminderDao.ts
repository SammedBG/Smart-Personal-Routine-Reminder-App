import { Reminder } from '../store/reminderStore';
import { getDatabase } from './database';

export async function loadAllRemindersFromDb(): Promise<Reminder[]> {
  const db = await getDatabase();
  const [result] = await db.executeSql('SELECT * FROM reminders WHERE deleted = 0');
  const rows: Reminder[] = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    const row = result.rows.item(i);
    rows.push({
      id: row.id,
      title: row.title,
      description: row.description,
      reminder_type: row.reminder_type,
      time_of_day: row.time_of_day,
      repeat_type: row.repeat_type,
      custom_days: row.custom_days ? JSON.parse(row.custom_days) : null,
      is_active: row.is_active === 1,
      next_trigger_at: row.next_trigger_at,
      last_triggered_at: row.last_triggered_at,
      start_date: row.start_date || null,
      end_date: row.end_date || null,
      medicine_details: row.medicine_details ? JSON.parse(row.medicine_details) : null,
      exercise_details: row.exercise_details ? JSON.parse(row.exercise_details) : null,
      version: row.version,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }
  return rows;
}

export async function deleteReminderFromDb(id: string): Promise<void> {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM reminders WHERE id = ?', [id]);
}

export async function upsertRemindersInDb(reminders: Reminder[]): Promise<void> {
  if (!reminders.length) return;
  const db = await getDatabase();
  await db.transaction(async (tx) => {
    reminders.forEach((r) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO reminders
        (id, title, description, reminder_type, time_of_day, repeat_type, custom_days,
         is_active, next_trigger_at, last_triggered_at, start_date, end_date,
         medicine_details, exercise_details, version, created_at, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          r.id,
          r.title,
          r.description ?? null,
          r.reminder_type,
          r.time_of_day,
          r.repeat_type,
          r.custom_days ? JSON.stringify(r.custom_days) : null,
          r.is_active ? 1 : 0,
          r.next_trigger_at ?? null,
          r.last_triggered_at ?? null,
          r.start_date ?? null,
          r.end_date ?? null,
          r.medicine_details ? JSON.stringify(r.medicine_details) : null,
          r.exercise_details ? JSON.stringify(r.exercise_details) : null,
          r.version,
          r.created_at,
          r.updated_at,
        ],
      );
    });
  });
}

