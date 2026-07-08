// ── Demo seed helpers ──────────────────────────────────────

import { getDb } from "./index";

/** Well-known UUID for the demo cooperative — referenced by both seed logic and UI. */
export const DEMO_COOP_UUID = "00000000-0000-0000-0000-000000000001";

const DEMO_COOP = {
  id: DEMO_COOP_UUID,
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
  founded_date: "2020-01-15",
  category: "serba_usaha",
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
    `INSERT INTO cooperatives (id, name, regency, province, level, business_units, officers, status, founded_date, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      DEMO_COOP.id,
      DEMO_COOP.name,
      DEMO_COOP.regency,
      DEMO_COOP.province,
      DEMO_COOP.level,
      units,
      DEMO_COOP.officers,
      DEMO_COOP.status,
      DEMO_COOP.founded_date,
      DEMO_COOP.category,
    ],
  );

  // 3. Seed demo admin user (PIN: 123456)
  const demoUserId = "usr-demo-001";
  const defaultPinHash = "8d969ee56701d853af7b830aef854b3c7b288d60c9329ee3073a56657a8c462a"; // SHA-256 of "123456"
  await db.execute(
    `INSERT INTO local_users (id, cooperative_id, name, role, pin_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [demoUserId, DEMO_COOP.id, "Slamet Riyadi", "admin", defaultPinHash],
  );

  // 4. Seed COA — always full set (no harm; unused accounts just sit idle)
  await seedDemoCoaAccounts(db);

  // 5. Seed categories — tier-specific
  await seedDemoCategoriesAtLevel(db, level);

  // 6. Seed inventory — tier-specific
  await seedDemoInventoryAtLevel(db, level);
}

export async function seedDemoCooperative(): Promise<void> {
  await seedDemoCooperativeAtLevel("lanjutan");
}

export async function clearDemoCooperative(): Promise<void> {
  const db = await getDb();

  // Delete in dependency order (children before parents) to avoid FK constraint violations.
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
  await db.execute("DELETE FROM inventory_items WHERE cooperative_id = ?", [DEMO_COOP.id]);
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

// ── Internal seed helpers ──

async function seedDemoCoaAccounts(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const existing = await db.select<Array<{ code: string }>>(
    "SELECT code FROM coa_accounts WHERE cooperative_id = ? LIMIT 1",
    [DEMO_COOP.id],
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
       VALUES (?, ?, ?, ?, ?, ?)`,
      [acc.code, DEMO_COOP.id, acc.name, acc.type, acc.normal_balance, acc.balance],
    );
  }
}

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

async function seedDemoInventoryAtLevel(db: Awaited<ReturnType<typeof getDb>>, level: DemoLevel): Promise<void> {
  const allItems = [
    {
      id: "item_urea",
      name: "Pupuk Urea Bersubsidi",
      category_id: "unit_pupuk",
      stock_quantity: 120,
      unit: "sak",
      cost_price: 110000,
      selling_price: 150000,
    },
    {
      id: "item_npk",
      name: "Pupuk NPK Phonska",
      category_id: "unit_pupuk",
      stock_quantity: 85,
      unit: "sak",
      cost_price: 130000,
      selling_price: 170000,
    },
    {
      id: "item_benih",
      name: "Benih Padi Ciherang 5kg",
      category_id: "unit_pupuk",
      stock_quantity: 50,
      unit: "kantong",
      cost_price: 65000,
      selling_price: 85000,
    },
    {
      id: "item_paracetamol",
      name: "Paracetamol 500mg",
      category_id: "unit_apotek",
      stock_quantity: 200,
      unit: "strip",
      cost_price: 2500,
      selling_price: 4500,
    },
    {
      id: "item_amoxicillin",
      name: "Amoxicillin 500mg",
      category_id: "unit_apotek",
      stock_quantity: 150,
      unit: "strip",
      cost_price: 5000,
      selling_price: 9000,
    },
    {
      id: "item_organik",
      name: "Pupuk Organik Granul",
      category_id: "unit_pupuk",
      stock_quantity: 150,
      unit: "sak",
      cost_price: 70000,
      selling_price: 90000,
    },
    {
      id: "item_karung",
      name: "Karung Plastik 50kg",
      category_id: "unit_pemasaran",
      stock_quantity: 500,
      unit: "pcs",
      cost_price: 1800,
      selling_price: 3000,
    },
  ];
  const tiers: Record<DemoLevel, string[]> = {
    pemula: ["item_urea", "item_npk"],
    menengah: ["item_urea", "item_npk", "item_benih", "item_organik"],
    lanjutan: [
      "item_urea",
      "item_npk",
      "item_benih",
      "item_paracetamol",
      "item_amoxicillin",
      "item_organik",
      "item_karung",
    ],
  };
  const tierIds = tiers[level];
  for (const item of allItems) {
    if (!tierIds.includes(item.id)) continue;
    await db.execute(
      `INSERT INTO inventory_items (id, cooperative_id, name, category_id, stock_quantity, unit, cost_price, selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        DEMO_COOP.id,
        item.name,
        item.category_id,
        item.stock_quantity,
        item.unit,
        item.cost_price,
        item.selling_price,
      ],
    );
  }
}
