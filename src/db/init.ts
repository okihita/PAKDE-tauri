import { getDb } from "./index";
import { initWilayah } from "./wilayah-init";

export async function initDb(): Promise<void> {
  const db = await getDb();

  // SQLite FK enforcement is OFF by default — must enable per connection
  await db.execute("PRAGMA foreign_keys = ON;");

  // ── Migration helper: check if column exists, add if missing ──
  async function ensureColumn(table: string, columnDef: string, columnName: string) {
    const cols = await db.select<Array<{ name: string }>>(`PRAGMA table_info(${table});`);
    const exists = cols.some((c: { name: string }) => c.name === columnName);
    if (!exists) {
      console.warn(`[initDb] Adding missing column: ${table}.${columnName}`);
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
    }
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cooperatives (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_id TEXT, status TEXT DEFAULT 'aktif',
      address TEXT, village TEXT, district TEXT, regency TEXT NOT NULL, province TEXT NOT NULL,
      postal_code TEXT, phone TEXT, email TEXT, level TEXT DEFAULT 'desa',
      parent_id TEXT, parent_name TEXT, business_units TEXT, officers TEXT,
      logo_path TEXT, rag_status TEXT DEFAULT 'green', health_score REAL DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY, journal_entry_id TEXT NOT NULL, cooperative_id TEXT NOT NULL DEFAULT 'kdp-001',
      account_code TEXT NOT NULL, description TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_code, cooperative_id) REFERENCES coa_accounts(code, cooperative_id)
    );
  `);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sensitivity_analyses (
      id TEXT PRIMARY KEY, financial_analysis_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL, variables TEXT NOT NULL,
      enpv REAL, eirr REAL, ebcr REAL, tier INTEGER,
      FOREIGN KEY (financial_analysis_id) REFERENCES financial_analyses(id) ON DELETE CASCADE
    );
  `);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ews_metrics (
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL,
      indicator TEXT NOT NULL, value REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_audit (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
      previous_state TEXT, new_state TEXT,
      synced_at TEXT DEFAULT (datetime('now')), synced_by TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT NOT NULL, cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL, icon TEXT,
      PRIMARY KEY (id, cooperative_id),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

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

  // Column migrations for tables that may pre-date schema additions
  await ensureColumn("store_layouts", "cell_size REAL DEFAULT 1.0", "cell_size");

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

  await ensureColumn("inventory_items", "zone_id TEXT", "zone_id");
  await ensureColumn("inventory_items", "shelf_row INTEGER", "shelf_row");
  await ensureColumn("inventory_items", "shelf_col INTEGER", "shelf_col");
  await ensureColumn("inventory_items", "cooperative_id TEXT NOT NULL DEFAULT 'kdp-001'", "cooperative_id");
  await ensureColumn("journal_lines", "cooperative_id TEXT NOT NULL DEFAULT 'kdp-001'", "cooperative_id");

  // Cooperative metadata columns (UU 25/1992 compliance)
  await ensureColumn("cooperatives", "founded_date TEXT", "founded_date");
  await ensureColumn("cooperatives", "category TEXT", "category");

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

  await ensureColumn("sales_transaction_items", "cooperative_id TEXT NOT NULL DEFAULT 'kdp-001'", "cooperative_id");

  await initWilayah();
}
