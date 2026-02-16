import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DB_NAME = 'smart_routines.db';

let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabase({ name: DB_NAME, location: 'default' });
  await dbInstance.executeSql(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reminder_type TEXT NOT NULL,
      time_of_day TEXT NOT NULL,
      repeat_type TEXT NOT NULL,
      custom_days TEXT,
      is_active INTEGER NOT NULL,
      next_trigger_at TEXT,
      last_triggered_at TEXT,
      version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );
  `);
  await dbInstance.executeSql(`
    CREATE TABLE IF NOT EXISTS pending_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return dbInstance;
}

