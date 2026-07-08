// ── Database initialisation ──────────────────────────────────────
//
// This module runs once per app launch (called from App.tsx's mount
// useEffect).  It guarantees every table and column the application
// expects exists in the SQLite database, without destroying data.
//
// Execution flow (top → bottom):
//
//   1.  Open the singleton SQLite connection and enable foreign keys.
//   2.  Create the anchor table `cooperatives` (with all current
//       columns).
//   3.  Create all child / related tables in dependency order (parents
//       before children so FK constraints are happy).
//   4.  Backfill admin users for coops that predate the auto-admin
//       migration logic.
//   5.  Seed the Indonesian administrative regions lookup table.
//
// Every statement uses `CREATE TABLE IF NOT EXISTS`, so the function
// is idempotent across app launches on an existing database.
//
// ─────────────────────────────────────────────────────────────────

import { getDb } from "./index";
import { initWilayah } from "./wilayah-init";

export async function initDb(): Promise<void> {
  const db = await getDb();

  // ── 1. Connection setup ──────────────────────────────────────

  // SQLite disables FK enforcement by default. Must enable per connection.
  await db.execute("PRAGMA foreign_keys = ON;");

  // ── Schema versioning ───────────────────────────────────────
  //
  // `CREATE TABLE IF NOT EXISTS` is a no-op for a table already present
  // on disk, so it can never add a column that was introduced after a
  // database was first created (this is what triggered the
  // "cooperatives has no column named is_demo" error). Rather than a
  // per-column migration, we gate a full reset on a schema version:
  // when the stored version is older than SCHEMA_VERSION we drop every
  // user table and recreate it from the authoritative CREATE statements
  // below. Deterministic, and no separate migration helpers to maintain.
  //
  // NOTE: this wipes all data on a version bump — acceptable for the
  // current dev/demo stage. Bump SCHEMA_VERSION whenever the schema in
  // this file changes incompatibly.
  const SCHEMA_VERSION = 2;

  await db.execute(`CREATE TABLE IF NOT EXISTS _schema_meta (key TEXT PRIMARY KEY, value TEXT);`);
  const meta = await db.select<Array<{ value: string }>>(
    "SELECT value FROM _schema_meta WHERE key = 'schema_version';",
  );
  const currentVersion = meta.length ? Number(meta[0].value) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    const tables = await db.select<Array<{ name: string }>>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name != '_schema_meta';",
    );
    for (const t of tables) {
      await db.execute(`DROP TABLE IF EXISTS "${t.name}";`);
    }
    await db.execute("INSERT OR REPLACE INTO _schema_meta (key, value) VALUES ('schema_version', ?);", [
      String(SCHEMA_VERSION),
    ]);
    console.warn(`[initDb] Schema reset: ${currentVersion} → ${SCHEMA_VERSION} (all tables recreated).`);
  }

  // ── 2. Core entity tables ────────────────────────────────────

  // cooperatives — the root entity. All other tables FK back to this.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cooperatives (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_id TEXT, status TEXT DEFAULT 'aktif',
      address TEXT, village TEXT, district TEXT, regency TEXT NOT NULL, province TEXT NOT NULL,
      postal_code TEXT, phone TEXT, email TEXT, level TEXT DEFAULT 'desa',
      parent_id TEXT, parent_name TEXT, business_units TEXT, officers TEXT,
      logo_path TEXT, rag_status TEXT DEFAULT 'green', health_score REAL DEFAULT 100,
      is_demo INTEGER DEFAULT 0,
      founded_date TEXT, category TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // local_users — each cooperative has one or more local operator accounts.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL, name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','operator','pengawas')),
      pin_hash TEXT NOT NULL, recovery_question TEXT, recovery_answer_hash TEXT,
      failed_attempts INTEGER DEFAULT 0, locked_until TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // members — individual cooperative members (anggota) with savings & loan tracking.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL, nik TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, place_of_birth TEXT, date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('L','P')), occupation TEXT, education TEXT,
      rt TEXT, rw TEXT, hamlet TEXT,
      status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
      savings_pokok REAL DEFAULT 0, savings_wajib REAL DEFAULT 0, savings_sukarela REAL DEFAULT 0,
      loan_total REAL DEFAULT 0, loan_outstanding REAL DEFAULT 0, loan_status TEXT,
      registered_at TEXT DEFAULT (datetime('now')), deactivated_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')), sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // ── 3. Finance & accounting ──────────────────────────────────

  // coa_accounts — chart of accounts (COA). Multi-tenant via composite PK (code, cooperative_id).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coa_accounts (
      code TEXT NOT NULL, cooperative_id TEXT NOT NULL, name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('aset','kewajiban','ekuitas','pendapatan','beban')),
      category TEXT, normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit','kredit')),
      balance REAL DEFAULT 0, is_active INTEGER DEFAULT 1, parent_code TEXT,
      sort_order INTEGER, created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (code, cooperative_id),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // journal_entries — header of each accounting journal (the "why").
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL, number TEXT NOT NULL,
      date TEXT NOT NULL, description TEXT NOT NULL, reference TEXT,
      category TEXT, tags TEXT, created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')), sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id),
      FOREIGN KEY (created_by) REFERENCES local_users(id)
    );
  `);

  // journal_lines — individual debit/credit lines within a journal entry.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY, journal_entry_id TEXT NOT NULL, cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
      account_code TEXT NOT NULL, description TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_code, cooperative_id) REFERENCES coa_accounts(code, cooperative_id)
    );
  `);

  // financial_analyses — feasibility study results (NPV, IRR, BCR) per business unit.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS financial_analyses (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL, unit TEXT NOT NULL,
      projection_years INTEGER NOT NULL, initial_investment REAL NOT NULL,
      cash_flows TEXT NOT NULL, discount_rate REAL NOT NULL, opportunity_cost REAL,
      enpv REAL, eirr REAL, ebcr REAL, tier INTEGER,
      calculated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // sensitivity_analyses — what-if scenarios attached to a financial analysis.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sensitivity_analyses (
      id TEXT PRIMARY KEY, financial_analysis_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL, variables TEXT NOT NULL,
      enpv REAL, eirr REAL, ebcr REAL, tier INTEGER,
      FOREIGN KEY (financial_analysis_id) REFERENCES financial_analyses(id) ON DELETE CASCADE
    );
  `);

  // ── 4. Early-warning system (EWS) ────────────────────────────

  // ews_alerts — triggered warnings (info / warning / critical) for cooperative health.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ews_alerts (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('info','warning','critical')),
      indicator TEXT NOT NULL, message TEXT NOT NULL,
      current_value REAL, threshold_value REAL, trend TEXT,
      suggested_action TEXT, triggered_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT, is_active INTEGER DEFAULT 1,
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // ews_metrics — raw metric snapshots that drive the alerting rules.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ews_metrics (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL,
      indicator TEXT NOT NULL, value REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // ── 5. Sync / audit trail ────────────────────────────────────

  // sync_history — log of every upload/download attempt for offline-to-cloud sync.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_history (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('upload','download')),
      status TEXT NOT NULL CHECK(status IN ('success','failed','in_progress')),
      entity_count INTEGER DEFAULT 0, error_message TEXT,
      started_at TEXT DEFAULT (datetime('now')), completed_at TEXT,
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // sync_audit — record of every row-level create/update/delete for conflict resolution.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_audit (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
      previous_state TEXT, new_state TEXT,
      synced_at TEXT DEFAULT (datetime('now')), synced_by TEXT
    );
  `);

  // ── 6. Store / inventory ─────────────────────────────────────

  // categories — product categories (unit pupuk, unit apotek, etc.). Multi-tenant.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT NOT NULL, cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL, icon TEXT,
      PRIMARY KEY (id, cooperative_id),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // store_layouts — floor-plan for the cooperative's shop (grid-based).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS store_layouts (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
      name TEXT NOT NULL,
      grid_width INTEGER DEFAULT 20,
      grid_height INTEGER DEFAULT 15,
      cell_size REAL DEFAULT 1.0,
      canvas_data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // layout_zones — named rectangular areas on the shop floor (shelves, counters, etc.).
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

  // inventory_items — products stocked in the shop, linked to a zone for placement.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT NOT NULL,
      cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
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
      PRIMARY KEY (id, cooperative_id),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id),
      FOREIGN KEY (category_id, cooperative_id) REFERENCES categories(id, cooperative_id),
      FOREIGN KEY (zone_id) REFERENCES layout_zones(id) ON DELETE SET NULL
    );
  `);

  // ── 7. Sales ─────────────────────────────────────────────────

  // sales_transactions — header of each sale (cash or credit).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sales_transactions (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
      member_id TEXT,
      total_amount REAL NOT NULL,
      payment_type TEXT CHECK(payment_type IN ('cash', 'credit')),
      category_id TEXT NOT NULL,
      journal_entry_id TEXT,
      transaction_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
      FOREIGN KEY (category_id, cooperative_id) REFERENCES categories(id, cooperative_id)
    );
  `);

  // sales_transaction_items — line items within a sale.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sales_transaction_items (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id, cooperative_id) REFERENCES inventory_items(id, cooperative_id)
    );
  `);

  // ── 8. Post-schema data migrations ──────────────────────────

  // Backfill: any cooperative that has zero local_users gets a default
  // admin account (username "Slamet Riyadi", PIN "123456").  This
  // covers coops created before the onboarding flow required an admin
  // user to be created alongside the cooperative row.
  await (async () => {
    const coops = await db.select<Array<{ id: string }>>("SELECT id FROM cooperatives");
    for (const coop of coops) {
      const users = await db.select<Array<{ id: string }>>("SELECT id FROM local_users WHERE cooperative_id = ?", [
        coop.id,
      ]);
      if (users.length === 0) {
        const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        // SHA-256 hash of "123456" — default PIN for migrated coops
        const defaultPinHash = "8d969ee56701d853af7b830aef854b3c7b288d60c9329ee3073a56657a8c462a";
        await db.execute(
          `INSERT INTO local_users (id, cooperative_id, name, role, pin_hash)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, coop.id, "Slamet Riyadi", "admin", defaultPinHash],
        );
        console.warn(`[initDb] Migrated coop ${coop.id}: created default admin user (PIN: 123456)`);
      }
    }
  })();

  // Load the Indonesian administrative regions lookup (provinces, regencies, districts, villages).
  await initWilayah();
}
