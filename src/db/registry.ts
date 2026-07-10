// ── Registry database ───────────────────────────────────────────
//
// Holds only cross-cooperative metadata: the `cooperatives` table (one row
// per cooperative, including the demo flag) and `_schema_meta`. All
// operational per-cooperative data lives in its own `coops/<id>.db` file
// (see coopDb.ts). Queries touching the `cooperatives` table MUST use this
// connection, never the per-coop connection.

import Database from "@tauri-apps/plugin-sql";

const REGISTRY_DB = "sqlite:registry.db";

let registryPromise: Promise<Database> | null = null;

export async function getRegistryDb(): Promise<Database> {
  if (!registryPromise) {
    registryPromise = (async () => {
      const db = await Database.load(REGISTRY_DB);
      await db.execute("PRAGMA foreign_keys = ON;");
      return db;
    })();
  }
  return registryPromise;
}

/** Close and drop the cached registry connection. Call before deleting registry.db. */
export async function closeRegistryDb(): Promise<void> {
  const p = registryPromise;
  registryPromise = null;
  if (!p) return;
  try {
    const db = await p;
    await (db as unknown as { close?: (db: string) => Promise<unknown> }).close?.(REGISTRY_DB);
  } catch {
    // Pool may already be gone — nothing to do.
  }
}

export const REGISTRY_SCHEMA_VERSION = 1;

export async function initRegistryDb(): Promise<void> {
  const db = await getRegistryDb();

  await db.execute(`CREATE TABLE IF NOT EXISTS _schema_meta (key TEXT PRIMARY KEY, value TEXT);`);
  const meta = await db.select<Array<{ value: string }>>(
    "SELECT value FROM _schema_meta WHERE key = 'schema_version';",
  );
  const currentVersion = meta.length ? Number(meta[0].value) : 0;

  if (currentVersion < REGISTRY_SCHEMA_VERSION) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cooperatives (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_id TEXT, status TEXT DEFAULT 'aktif',
        address TEXT, village TEXT, district TEXT, regency TEXT NOT NULL, province TEXT NOT NULL,
        postal_code TEXT, phone TEXT, email TEXT, level TEXT DEFAULT 'desa',
        parent_id TEXT, parent_name TEXT, business_units TEXT, officers TEXT,
        logo_path TEXT, rag_status TEXT DEFAULT 'green', health_score REAL DEFAULT 100,
        xp INTEGER NOT NULL DEFAULT 0,
        is_demo INTEGER DEFAULT 0,
        founded_date TEXT, category TEXT,
        created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await db.execute("INSERT OR REPLACE INTO _schema_meta (key, value) VALUES ('schema_version', ?);", [
      String(REGISTRY_SCHEMA_VERSION),
    ]);
  }
}
