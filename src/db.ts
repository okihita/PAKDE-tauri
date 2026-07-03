import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:kdkmp.db");
  }
  return dbInstance;
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  // Create Cooperatives Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cooperatives (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      legal_id TEXT,
      status TEXT DEFAULT 'aktif',
      address TEXT,
      village TEXT,
      district TEXT,
      regency TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT,
      phone TEXT,
      email TEXT,
      level TEXT DEFAULT 'desa',
      parent_id TEXT,
      parent_name TEXT,
      business_units TEXT, -- JSON array
      officers TEXT, -- JSON object
      logo_path TEXT,
      rag_status TEXT DEFAULT 'green',
      health_score REAL DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create Local Users Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','operator','pengawas')),
      pin_hash TEXT NOT NULL,
      recovery_question TEXT,
      recovery_answer_hash TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Members Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      nik TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      place_of_birth TEXT,
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('L','P')),
      occupation TEXT,
      education TEXT,
      rt TEXT,
      rw TEXT,
      hamlet TEXT,
      status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
      savings_pokok REAL DEFAULT 0,
      savings_wajib REAL DEFAULT 0,
      savings_sukarela REAL DEFAULT 0,
      loan_total REAL DEFAULT 0,
      loan_outstanding REAL DEFAULT 0,
      loan_status TEXT,
      registered_at TEXT DEFAULT (datetime('now')),
      deactivated_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Chart of Accounts (COA) Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coa_accounts (
      code TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('aset','kewajiban','ekuitas','pendapatan','beban')),
      category TEXT,
      normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit','kredit')),
      balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      parent_code TEXT,
      sort_order INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Journal Entries Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      number TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      reference TEXT,
      category TEXT,
      tags TEXT, -- JSON array
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id),
      FOREIGN KEY (created_by) REFERENCES local_users(id)
    );
  `);

  // Create Journal Lines Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journal_lines (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL,
      account_code TEXT NOT NULL,
      description TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (account_code) REFERENCES coa_accounts(code)
    );
  `);

  // Create Financial Analysis Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS financial_analyses (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      unit TEXT NOT NULL,
      projection_years INTEGER NOT NULL,
      initial_investment REAL NOT NULL,
      cash_flows TEXT NOT NULL, -- JSON array
      discount_rate REAL NOT NULL,
      opportunity_cost REAL,
      enpv REAL,
      eirr REAL,
      ebcr REAL,
      tier INTEGER,
      calculated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Sensitivity Analysis Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sensitivity_analyses (
      id TEXT PRIMARY KEY,
      financial_analysis_id TEXT NOT NULL,
      scenario_name TEXT NOT NULL,
      variables TEXT NOT NULL, -- JSON object
      enpv REAL,
      eirr REAL,
      ebcr REAL,
      tier INTEGER,
      FOREIGN KEY (financial_analysis_id) REFERENCES financial_analyses(id) ON DELETE CASCADE
    );
  `);

  // Create EWS Alerts Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ews_alerts (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('info','warning','critical')),
      indicator TEXT NOT NULL,
      message TEXT NOT NULL,
      current_value REAL,
      threshold_value REAL,
      trend TEXT,
      suggested_action TEXT,
      triggered_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create EWS Metrics Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ews_metrics (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      indicator TEXT NOT NULL,
      value REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Sync History Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_history (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('upload','download')),
      status TEXT NOT NULL CHECK(status IN ('success','failed','in_progress')),
      entity_count INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // Create Sync Audit Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_audit (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
      previous_state TEXT, -- JSON snapshot
      new_state TEXT, -- JSON snapshot
      synced_at TEXT DEFAULT (datetime('now')),
      synced_by TEXT
    );
  `);

  // Create Categories Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      cooperative_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
    );
  `);

  // --- SEED DEFAULT DATA ---

  // 1. Seed Cooperative profile if empty
  const cooperatives = await db.select<any[]>("SELECT * FROM cooperatives LIMIT 1");
  if (cooperatives.length === 0) {
    await db.execute(`
      INSERT INTO cooperatives (id, name, regency, province, level, business_units, officers, status)
      VALUES (
        'kdp-001', 
        'Koperasi Maju Bersama', 
        'Mojokerto', 
        'Jawa Timur', 
        'desa', 
        '["unit_apotek", "unit_pupuk", "unit_pemasaran"]', 
        '{"chairman": "Slamet Riyadi", "secretary": "Siti Rahmawati", "treasurer": "Ahmad Hidayat", "supervisor": "Drs. Suparman"}',
        'aktif'
      );
    `);
  }

  // 2. Seed default SAK EP Chart of Accounts if empty
  const coa = await db.select<any[]>("SELECT * FROM coa_accounts LIMIT 1");
  if (coa.length === 0) {
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

  // 3. Seed default categories if empty
  const cats = await db.select<any[]>("SELECT * FROM categories LIMIT 1");
  if (cats.length === 0) {
    const categoriesList = [
      { id: "unit_apotek", name: "Unit Apotek", icon: "💊" },
      { id: "unit_pupuk", name: "Unit Pupuk", icon: "🌱" },
      { id: "unit_simpan_pinjam", name: "Unit Simpan Pinjam", icon: "💰" },
      { id: "unit_penggilingan", name: "Penggilingan Padi", icon: "🌾" },
      { id: "unit_pemasaran", name: "Pemasaran Hasil Tani", icon: "📦" },
      { id: "operasional", name: "Operasional", icon: "⚙️" },
      { id: "investasi", name: "Investasi", icon: "📈" },
    ];

    for (const cat of categoriesList) {
      await db.execute("INSERT INTO categories (id, cooperative_id, name, icon) VALUES (?, 'kdp-001', ?, ?)", [
        cat.id,
        cat.name,
        cat.icon,
      ]);
    }
  }
}
