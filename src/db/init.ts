import { getDb } from "./index";

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
      code TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL, name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('aset','kewajiban','ekuitas','pendapatan','beban')),
      category TEXT, normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit','kredit')),
      balance REAL DEFAULT 0, is_active INTEGER DEFAULT 1, parent_code TEXT,
      sort_order INTEGER, created_at TEXT DEFAULT (datetime('now')),
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
      id TEXT PRIMARY KEY, journal_entry_id TEXT NOT NULL, account_code TEXT NOT NULL,
      description TEXT, debit REAL DEFAULT 0, credit REAL DEFAULT 0,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_code) REFERENCES coa_accounts(code)
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
      id TEXT PRIMARY KEY, cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL, icon TEXT,
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
      id TEXT PRIMARY KEY,
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
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (zone_id) REFERENCES layout_zones(id) ON DELETE SET NULL
    );
  `);

  await ensureColumn("inventory_items", "zone_id TEXT", "zone_id");
  await ensureColumn("inventory_items", "shelf_row INTEGER", "shelf_row");
  await ensureColumn("inventory_items", "shelf_col INTEGER", "shelf_col");

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
}

// ── Demo seed data functions (idempotent, scoped to kdp-001) ──

async function seedDemoCoaAccounts(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const existing = await db.select<Array<{ code: string }>>(
    "SELECT code FROM coa_accounts WHERE cooperative_id = 'kdp-001' LIMIT 1",
  );
  if (existing.length > 0) return;

  const accounts = [
    { code: "1.1.01", name: "Kas", type: "aset", normal_balance: "debit", balance: 125000000 },
    { code: "1.1.02", name: "Bank BRI", type: "aset", normal_balance: "debit", balance: 450000000 },
    { code: "1.1.03", name: "Piutang Usaha", type: "aset", normal_balance: "debit", balance: 275000000 },
    { code: "1.1.04", name: "Persediaan", type: "aset", normal_balance: "debit", balance: 50000000 },
    { code: "1.2.01", name: "Tanah", type: "aset", normal_balance: "debit", balance: 200000000 },
    { code: "1.2.02", name: "Bangunan", type: "aset", normal_balance: "debit", balance: 150000000 },
    { code: "1.2.03", name: "Kendaraan", type: "aset", normal_balance: "debit", balance: 50000000 },
    { code: "1.2.04", name: "Akumulasi Penyusutan", type: "aset", normal_balance: "kredit", balance: -25000000 },
    { code: "1.2.05", name: "Peralatan", type: "aset", normal_balance: "debit", balance: 15000000 },
    { code: "2.1.01", name: "Utang Usaha", type: "kewajiban", normal_balance: "kredit", balance: 300000000 },
    { code: "2.1.02", name: "Utang Pajak", type: "kewajiban", normal_balance: "kredit", balance: 25000000 },
    { code: "2.1.03", name: "Utang Bank", type: "kewajiban", normal_balance: "kredit", balance: 125000000 },
    { code: "3.01", name: "Modal Koperasi", type: "ekuitas", normal_balance: "kredit", balance: 500000000 },
    { code: "3.02", name: "SHU Berjalan", type: "ekuitas", normal_balance: "kredit", balance: 175000000 },
    { code: "3.03", name: "Cadangan", type: "ekuitas", normal_balance: "kredit", balance: 140000000 },
    { code: "4.01", name: "Pendapatan Jasa", type: "pendapatan", normal_balance: "kredit", balance: 89000000 },
    { code: "4.02", name: "Pendapatan Unit Usaha", type: "pendapatan", normal_balance: "kredit", balance: 77000000 },
    { code: "4.03", name: "Pendapatan Lain-lain", type: "pendapatan", normal_balance: "kredit", balance: 12000000 },
    { code: "5.01", name: "Beban Gaji", type: "beban", normal_balance: "debit", balance: 72000000 },
    { code: "5.02", name: "Beban Listrik", type: "beban", normal_balance: "debit", balance: 9600000 },
    { code: "5.03", name: "Beban Penyusutan", type: "beban", normal_balance: "debit", balance: 12500000 },
    { code: "5.04", name: "Beban Operasional", type: "beban", normal_balance: "debit", balance: 15000000 },
    { code: "5.05", name: "Beban Lain-lain", type: "beban", normal_balance: "debit", balance: 8900000 },
  ];
  for (const acc of accounts) {
    await db.execute(
      `INSERT INTO coa_accounts (code, cooperative_id, name, type, normal_balance, balance)
       VALUES (?, 'kdp-001', ?, ?, ?, ?)`,
      [acc.code, acc.name, acc.type, acc.normal_balance, acc.balance],
    );
  }
}

// ── Dev-only seed helpers ──────────────────────────────────────

const DEMO_COOP = {
  id: "kdp-001",
  name: "Koperasi Maju Bersama",
  regency: "Mojokerto",
  province: "Jawa Timur",
  level: "desa",
  business_units: JSON.stringify(["unit_apotek", "unit_pupuk", "unit_pemasaran"]),
  officers: JSON.stringify({
    chairman: "Slamet Riyadi",
    secretary: "Siti Rahmawati",
    treasurer: "Ahmad Hidayat",
    supervisor: "Drs. Suparman",
  }),
  status: "aktif",
};

export type DemoLevel = "pemula" | "menengah" | "lanjutan";

const LEVEL_BUSINESS_UNITS: Record<DemoLevel, string[]> = {
  pemula: ["unit_pupuk"],
  menengah: ["unit_pupuk", "unit_simpan_pinjam"],
  lanjutan: ["unit_apotek", "unit_pupuk", "unit_pemasaran"],
};

/**
 * Clear + seed the demo cooperative at the given complexity tier.
 * All three tiers share cooperative id `kdp-001`; the difference is
 * how much data (COA, categories, inventory) gets populated.
 */
export async function seedDemoCooperativeAtLevel(level: DemoLevel): Promise<void> {
  const db = await getDb();

  // 1. Clear any existing demo data
  await clearDemoCooperative();

  // 2. Insert cooperative row with tier-specific units
  const units = JSON.stringify(LEVEL_BUSINESS_UNITS[level]);
  await db.execute(
    `INSERT INTO cooperatives (id, name, regency, province, level, business_units, officers, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [DEMO_COOP.id, DEMO_COOP.name, DEMO_COOP.regency, DEMO_COOP.province, DEMO_COOP.level, units, DEMO_COOP.officers, DEMO_COOP.status],
  );

  // 3. Seed COA — always full set (no harm; unused accounts just sit idle)
  await seedDemoCoaAccounts(db);

  // 4. Seed categories — tier-specific
  await seedDemoCategoriesAtLevel(db, level);

  // 5. Seed inventory — tier-specific
  await seedDemoInventoryAtLevel(db, level);
}

/** Seed categories scoped to the tier (subsets of the full list). */
async function seedDemoCategoriesAtLevel(db: Awaited<ReturnType<typeof getDb>>, level: DemoLevel): Promise<void> {
  const allCategories = [
    { id: "unit_pupuk", name: "Unit Pupuk", icon: "🌱" },
    { id: "unit_simpan_pinjam", name: "Unit Simpan Pinjam", icon: "💰" },
    { id: "unit_apotek", name: "Unit Apotek", icon: "💊" },
    { id: "unit_pemasaran", name: "Pemasaran Hasil Tani", icon: "📦" },
  ];
  const tiers: Record<DemoLevel, string[]> = {
    pemula: ["unit_pupuk"],
    menengah: ["unit_pupuk", "unit_simpan_pinjam"],
    lanjutan: ["unit_pupuk", "unit_simpan_pinjam", "unit_apotek", "unit_pemasaran"],
  };
  const tierIds = tiers[level];
  for (const cat of allCategories) {
    if (!tierIds.includes(cat.id)) continue;
    await db.execute("INSERT INTO categories (id, cooperative_id, name, icon) VALUES (?, ?, ?, ?)", [
      cat.id,
      DEMO_COOP.id,
      cat.name,
      cat.icon,
    ]);
  }
}

/** Seed inventory items scoped to the tier. */
async function seedDemoInventoryAtLevel(db: Awaited<ReturnType<typeof getDb>>, level: DemoLevel): Promise<void> {
  const allItems = [
    { id: "item_urea", name: "Pupuk Urea Bersubsidi", category_id: "unit_pupuk", stock_quantity: 120, unit: "sak", cost_price: 110000, selling_price: 150000 },
    { id: "item_npk", name: "Pupuk NPK Phonska", category_id: "unit_pupuk", stock_quantity: 85, unit: "sak", cost_price: 130000, selling_price: 170000 },
    { id: "item_benih", name: "Benih Padi Ciherang 5kg", category_id: "unit_pupuk", stock_quantity: 50, unit: "kantong", cost_price: 65000, selling_price: 85000 },
    { id: "item_paracetamol", name: "Paracetamol 500mg", category_id: "unit_apotek", stock_quantity: 200, unit: "strip", cost_price: 2500, selling_price: 4500 },
    { id: "item_amoxicillin", name: "Amoxicillin 500mg", category_id: "unit_apotek", stock_quantity: 150, unit: "strip", cost_price: 5000, selling_price: 9000 },
    { id: "item_organik", name: "Pupuk Organik Granul", category_id: "unit_pupuk", stock_quantity: 150, unit: "sak", cost_price: 70000, selling_price: 90000 },
    { id: "item_karung", name: "Karung Plastik 50kg", category_id: "unit_pemasaran", stock_quantity: 500, unit: "pcs", cost_price: 1800, selling_price: 3000 },
  ];
  const tiers: Record<DemoLevel, string[]> = {
    pemula: ["item_urea", "item_npk"],
    menengah: ["item_urea", "item_npk", "item_benih", "item_organik"],
    lanjutan: ["item_urea", "item_npk", "item_benih", "item_paracetamol", "item_amoxicillin", "item_organik", "item_karung"],
  };
  const tierIds = tiers[level];
  for (const item of allItems) {
    if (!tierIds.includes(item.id)) continue;
    await db.execute(
      `INSERT INTO inventory_items (id, name, category_id, stock_quantity, unit, cost_price, selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.category_id, item.stock_quantity, item.unit, item.cost_price, item.selling_price],
    );
  }
}

export async function seedDemoCooperative(): Promise<void> {
  await seedDemoCooperativeAtLevel("lanjutan");
}

export async function clearDemoCooperative(): Promise<void> {
  const db = await getDb();

  // Delete in dependency order (children before parents) to avoid FK constraint violations.
  // This covers the case where the user has interacted with the demo co-op
  // (created members, sales, journal entries, store layouts, etc.).

  await db.execute(
    `DELETE FROM sales_transaction_items WHERE transaction_id IN
     (SELECT id FROM sales_transactions WHERE cooperative_id = ?)`,
    [DEMO_COOP.id],
  );
  await db.execute("DELETE FROM sales_transactions WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute(
    `DELETE FROM journal_lines WHERE journal_entry_id IN
     (SELECT id FROM journal_entries WHERE cooperative_id = ?)`,
    [DEMO_COOP.id],
  );
  await db.execute("DELETE FROM journal_entries WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute(
    "DELETE FROM sensitivity_analyses WHERE financial_analysis_id IN (SELECT id FROM financial_analyses WHERE cooperative_id = ?)",
    [DEMO_COOP.id],
  );
  await db.execute("DELETE FROM financial_analyses WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute(
    "DELETE FROM layout_zones WHERE layout_id IN (SELECT id FROM store_layouts WHERE cooperative_id = ?)",
    [DEMO_COOP.id],
  );
  await db.execute("DELETE FROM store_layouts WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM inventory_items WHERE id LIKE 'item_%'");
  await db.execute("DELETE FROM categories WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM members WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM local_users WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM ews_alerts WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM ews_metrics WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM sync_history WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM coa_accounts WHERE cooperative_id = ?", [DEMO_COOP.id]);
  await db.execute("DELETE FROM cooperatives WHERE id = ?", [DEMO_COOP.id]);
}

export async function isDemoSeeded(): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<Array<{ id: string }>>("SELECT id FROM cooperatives WHERE id = ?", [DEMO_COOP.id]);
  return rows.length > 0;
}
