// ── Per-cooperative database ───────────────────────────────────
//
// Each cooperative gets its own SQLite file at `coops/<coopId>.db` containing
// all of its operational data. Because the tenant is implied by the file, no
// `cooperative_id` / `coop_id` column exists anywhere — cross-coop leakage is
// structurally impossible and there is no default ("kdp-001") tenant.
//
// The `cooperatives` registry row lives in registry.db (see registry.ts), NOT
// here.

import Database from "@tauri-apps/plugin-sql";
import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { getActiveCoopId } from "./active-coop";

const COOPS_DIR = "coops";
const COOP_SCHEMA_VERSION = 4;

let coopDirEnsured: Promise<void> | null = null;
const coopPromises = new Map<string, Promise<Database>>();

async function ensureCoopDir(): Promise<void> {
  if (!coopDirEnsured) {
    coopDirEnsured = (async () => {
      const dir = await appDataDir();
      await mkdir(await join(dir, COOPS_DIR), { recursive: true });
    })();
  }
  return coopDirEnsured;
}

export function coopDbPath(coopId: string): string {
  return `sqlite:${COOPS_DIR}/${coopId}.db`;
}

/** Open (and memoize) the DB file for a cooperative. Defaults to the active coop. */
export async function getCoopDb(coopId?: string): Promise<Database> {
  const id = coopId || getActiveCoopId();
  if (!id) throw new Error("No active cooperative selected.");
  let promise = coopPromises.get(id);
  if (!promise) {
    promise = (async () => {
      await ensureCoopDir();
      const db = await Database.load(coopDbPath(id));
      await db.execute("PRAGMA foreign_keys = ON;");
      return db;
    })();
    coopPromises.set(id, promise);
  }
  return promise;
}

/** Backward-compatible alias: the active cooperative's DB. */
export const getDb = getCoopDb;

/**
 * Drop any cached connection for a cooperative (e.g. after its DB file is
 * deleted). The next getCoopDb() re-opens a fresh connection instead of
 * writing to a deleted file.
 */
export function invalidateCoopDb(coopId: string): void {
  const p = coopPromises.get(coopId);
  if (p) {
    void p.then((db) => (db as unknown as { close?: () => Promise<void> }).close?.()).catch(() => {});
    coopPromises.delete(coopId);
  }
}

/**
 * Create (if absent) the per-cooperative schema. The default-admin
 * backfill is intentionally NOT done here — it would bypass the "create your
 * own admin" onboarding. The safety-net backfill runs once per launch in
 * initDb() (mirrors the legacy behaviour). Idempotent.
 */
export async function initCoopDb(coopId: string): Promise<void> {
  const db = await getCoopDb(coopId);

  await db.execute(`CREATE TABLE IF NOT EXISTS _schema_meta (key TEXT PRIMARY KEY, value TEXT);`);
  const meta = await db.select<Array<{ value: string }>>(
    "SELECT value FROM _schema_meta WHERE key = 'schema_version';",
  );
  const currentVersion = meta.length ? Number(meta[0].value) : 0;

  if (currentVersion < COOP_SCHEMA_VERSION) {
    // ── local_users (per-coop admin/operator accounts) ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS local_users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','operator','pengawas')),
        pin_hash TEXT NOT NULL, recovery_question TEXT, recovery_answer_hash TEXT,
        failed_attempts INTEGER DEFAULT 0, locked_until TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ── members ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY, nik TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL, place_of_birth TEXT, date_of_birth TEXT,
        gender TEXT CHECK(gender IN ('L','P')), occupation TEXT, education TEXT,
        rt TEXT, rw TEXT, hamlet TEXT,
        status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
        savings_pokok REAL DEFAULT 0, savings_wajib REAL DEFAULT 0, savings_sukarela REAL DEFAULT 0,
        loan_total REAL DEFAULT 0, loan_outstanding REAL DEFAULT 0, loan_status TEXT,
        registered_at TEXT DEFAULT (datetime('now')), deactivated_at TEXT,
        updated_at TEXT DEFAULT (datetime('now')), sync_status TEXT DEFAULT 'pending'
      );
    `);

    // ── chart of accounts (PK is just code within this coop) ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS coa_accounts (
        code TEXT NOT NULL, name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('aset','kewajiban','ekuitas','pendapatan','beban')),
        category TEXT, normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit','kredit')),
        balance REAL DEFAULT 0, is_active INTEGER DEFAULT 1, parent_code TEXT,
        sort_order INTEGER, created_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (code)
      );
    `);

    // ── journal entries / lines ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY, number TEXT NOT NULL,
        date TEXT NOT NULL, description TEXT NOT NULL, reference TEXT,
        category TEXT, tags TEXT, created_by TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')), sync_status TEXT DEFAULT 'pending',
        FOREIGN KEY (created_by) REFERENCES local_users(id)
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS journal_lines (
        id TEXT PRIMARY KEY, journal_entry_id TEXT NOT NULL, account_code TEXT NOT NULL,
        description TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_code) REFERENCES coa_accounts(code)
      );
    `);

    // ── feasibility analyses ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_analyses (
        id TEXT PRIMARY KEY, unit TEXT NOT NULL,
        projection_years INTEGER NOT NULL, initial_investment REAL NOT NULL,
        cash_flows TEXT NOT NULL, discount_rate REAL NOT NULL, opportunity_cost REAL,
        enpv REAL, eirr REAL, ebcr REAL, tier INTEGER,
        calculated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sensitivity_analyses (
        id TEXT PRIMARY KEY, financial_analysis_id TEXT NOT NULL,
        scenario_name TEXT NOT NULL, variables TEXT NOT NULL,
        enpv REAL, eirr REAL, ebcr REAL, tier INTEGER,
        FOREIGN KEY (financial_analysis_id) REFERENCES financial_analyses(id) ON DELETE CASCADE
      );
    `);

    // ── early-warning system ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ews_alerts (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL CHECK(level IN ('info','warning','critical')),
        indicator TEXT NOT NULL, message TEXT NOT NULL,
        current_value REAL, threshold_value REAL, trend TEXT,
        suggested_action TEXT, triggered_at TEXT DEFAULT (datetime('now')),
        resolved_at TEXT, is_active INTEGER DEFAULT 1
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ews_metrics (
        id TEXT PRIMARY KEY, indicator TEXT NOT NULL, value REAL NOT NULL,
        recorded_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // ── sync / audit ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_history (
        id TEXT PRIMARY KEY,
        direction TEXT NOT NULL CHECK(direction IN ('upload','download')),
        status TEXT NOT NULL CHECK(status IN ('success','failed','in_progress')),
        entity_count INTEGER DEFAULT 0, error_message TEXT,
        started_at TEXT DEFAULT (datetime('now')), completed_at TEXT
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_audit (
        id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
        previous_state TEXT, new_state TEXT,
        synced_at TEXT DEFAULT (datetime('now')), synced_by TEXT
      );
    `);

    // ── categories (PK is just id within this coop) ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT NOT NULL, name TEXT NOT NULL, icon TEXT,
        PRIMARY KEY (id)
      );
    `);

    // ── store layout ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS store_layouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grid_width INTEGER DEFAULT 20,
        grid_height INTEGER DEFAULT 15,
        cell_size REAL DEFAULT 1.0,
        canvas_data TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS layout_zones (
        id TEXT PRIMARY KEY,
        layout_id TEXT NOT NULL,
        name TEXT NOT NULL,
        zone_type TEXT DEFAULT 'shelf',
        x REAL NOT NULL,
        y REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        rows INTEGER DEFAULT 4,
        cols INTEGER DEFAULT 3,
        color TEXT DEFAULT '#4CAF50',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (layout_id) REFERENCES store_layouts(id) ON DELETE CASCADE
      );
    `);

    // ── inventory (PK is just id within this coop) ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT NOT NULL,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        stock_quantity REAL DEFAULT 0,
        unit TEXT NOT NULL,
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        zone_id TEXT,
        shelf_row INTEGER,
        shelf_col INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (zone_id) REFERENCES layout_zones(id) ON DELETE SET NULL
      );
    `);

    // ── sales ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales_transactions (
        id TEXT PRIMARY KEY,
        member_id TEXT,
        total_amount REAL NOT NULL,
        payment_type TEXT CHECK(payment_type IN ('cash', 'credit')),
        category_id TEXT NOT NULL,
        journal_entry_id TEXT,
        transaction_date TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales_transaction_items (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES inventory_items(id)
      );
    `);

    // ── community events (Kegiatan) ──
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'other',
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT,
        duration_min INTEGER,
        participant_ids TEXT,
        proposal_path TEXT, proposal_name TEXT, proposal_mime TEXT, proposal_size INTEGER,
        report_path TEXT, report_name TEXT, report_mime TEXT, report_size INTEGER,
        social_links TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);`);

    // ── events: add description column for coops created before v4 ──
    await db.execute(`ALTER TABLE events ADD COLUMN description TEXT;`);

    await db.execute("INSERT OR REPLACE INTO _schema_meta (key, value) VALUES ('schema_version', ?);", [
      String(COOP_SCHEMA_VERSION),
    ]);
  }
}
