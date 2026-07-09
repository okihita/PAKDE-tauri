import Database from "@tauri-apps/plugin-sql";

// Memoize the connection promise so concurrent callers (e.g. initDb + a hook
// firing on the same tick) share one Database.load instead of racing two
// opens, which throws SQLITE_BUSY ("database is locked").
let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await Database.load("sqlite:kdkmp.db");
      await db.execute("PRAGMA foreign_keys = ON;");
      return db;
    })();
  }
  return dbPromise;
}
