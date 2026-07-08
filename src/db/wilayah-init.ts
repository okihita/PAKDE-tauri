import Database from "@tauri-apps/plugin-sql";

let _wilayahDb: Database | null = null;
let _loadPromise: Promise<Database> | null = null;

/** Load the prebuilt wilayah reference database (lazy, cached). */
export async function getWilayahDb(): Promise<Database> {
  if (_wilayahDb) return _wilayahDb;
  if (!_loadPromise) {
    _loadPromise = Database.load("sqlite:wilayah.sqlite").then((db) => {
      _wilayahDb = db;
      return db;
    });
  }
  return _loadPromise;
}

/** Preload during initDb() so the first query is instant. */
export async function initWilayah(): Promise<void> {
  await getWilayahDb();
}
