import * as SQLite from 'expo-sqlite';

const DB_NAME = 'smart_routines.db';

let dbInstance: any = null;

export async function getDatabase(): Promise<any> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrent performance
  await dbInstance.execAsync('PRAGMA journal_mode=WAL;');

  await dbInstance.execAsync(`
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
      start_date TEXT,
      end_date TEXT,
      medicine_details TEXT,
      exercise_details TEXT,
      version INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );
  `);

  // Add new columns if upgrading from older schema (gracefully ignore if exists)
  const addColumnSafely = async (col: string, type: string) => {
    try {
      await dbInstance.execAsync(`ALTER TABLE reminders ADD COLUMN ${col} ${type};`);
    } catch {
      // column already exists, ignore
    }
  };
  await addColumnSafely('start_date', 'TEXT');
  await addColumnSafely('end_date', 'TEXT');
  await addColumnSafely('medicine_details', 'TEXT');
  await addColumnSafely('exercise_details', 'TEXT');

  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return dbInstance;
}


