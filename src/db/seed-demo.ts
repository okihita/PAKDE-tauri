// ── Demo seed helpers ──────────────────────────────────────

import { getRegistryDb, getCoopDb, initCoopDb, invalidateCoopDb } from "@/db";
import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, remove } from "@tauri-apps/plugin-fs";
import { DEMO_TIERS, type DemoTier } from "@/features/System/ProfileSelect/demoTiers";

/** Well-known UUID for the demo cooperative — referenced by both seed logic and UI. */
export const DEMO_COOP_UUID = "00000000-0000-0000-0000-000000000001";

/** Returns true if the profile is the seeded demo cooperative (checks flag, not UUID). */
export const isDemoCooperative = (p?: { is_demo?: number } | null): boolean => !!p && p.is_demo === 1;

const DEMO_COOP = {
  id: DEMO_COOP_UUID,
  officers: JSON.stringify({
    chairman: "Slamet Riyadi",
    secretary: "Siti Rahmawati",
    treasurer: "Ahmad Hidayat",
    supervisor: "Drs. Suparman",
  }),
  status: "aktif",
  level: "desa",
  category: "serba_usaha",
};

export type DemoLevel = "pemula" | "menengah" | "lanjutan";

/**
 * Clear + seed the demo cooperative at the given complexity tier. The demo
 * cooperative owns its own `coops/<uuid>.db` file; its metadata row lives in
 * the registry (`cooperatives`). No `cooperative_id` column is involved.
 */
export async function seedDemoCooperativeAtLevel(level: DemoLevel): Promise<void> {
  const tier = DEMO_TIERS.find((t) => t.level === level) ?? DEMO_TIERS[0];

  // Progression (xp) + operational EWS health, mapped onto the demo tier so a
  // "pemula" coop genuinely starts low and "lanjutan" sits near the top.
  const TIER_PROGRESSION: Record<DemoLevel, { xp: number; health: number; rag: string }> = {
    pemula: { xp: 12, health: 18, rag: "Merah" },
    menengah: { xp: 45, health: 55, rag: "Kuning" },
    lanjutan: { xp: 82, health: 88, rag: "Hijau" },
  };
  const prog = TIER_PROGRESSION[tier.level];

  // 1. Clear any existing demo data (file + registry row)
  await clearDemoCooperative();

  // 2. Insert the cooperative metadata row into the REGISTRY.
  const reg = await getRegistryDb();
  const units = JSON.stringify(tier.units);
  const foundedDate = computeFoundedDate(tier);
  await reg.execute(
    `INSERT INTO cooperatives (id, name, regency, province, village, level, business_units, officers, status, founded_date, category, xp, health_score, rag_status, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      DEMO_COOP.id,
      tier.coopName,
      tier.regency,
      tier.province,
      tier.village,
      DEMO_COOP.level,
      units,
      DEMO_COOP.officers,
      DEMO_COOP.status,
      foundedDate,
      DEMO_COOP.category,
      prog.xp,
      prog.health,
      prog.rag,
    ],
  );

  // 3. Provision the demo coop's own data file. We seed our own admin below,
  //    so skip the default-admin backfill.
  await initCoopDb(DEMO_COOP.id);
  const db = await getCoopDb(DEMO_COOP.id);

  // 4. Seed demo admin user (PIN: 123456)
  const demoUserId = "usr-demo-001";
  const defaultPinHash = "8d969ee56701d853af7b830aef854b3c7b288d60c9329ee3073a56657a8c462a"; // SHA-256 of "123456"
  await db.execute(
    `INSERT INTO local_users (id, name, role, pin_hash)
     VALUES (?, ?, ?, ?)`,
    [demoUserId, "Slamet Riyadi", "admin", defaultPinHash],
  );

  // 5. Seed COA — always full set (no harm; unused accounts just sit idle)
  await seedDemoCoaAccounts(db);

  // 6. Seed categories — tier-specific
  await seedDemoCategoriesAtLevel(db, level);

  // 7. Seed inventory — tier-specific
  await seedDemoInventoryAtLevel(db, level);

  // 8. Seed members to match the tier's "Anggota" stat
  await seedDemoMembers(db, tier);
}

export async function seedDemoCooperative(): Promise<void> {
  await seedDemoCooperativeAtLevel("lanjutan");
}

export async function clearDemoCooperative(): Promise<void> {
  const reg = await getRegistryDb();

  // Delete the demo coop's data file directly (children are inside it).
  const dataDir = await appDataDir();
  const coopFile = await join(dataDir, "coops", `${DEMO_COOP.id}.db`);
  if (await exists(coopFile)) await remove(coopFile);
  // Drop any cached connection so the re-seed re-opens a fresh file.
  await invalidateCoopDb(DEMO_COOP.id);

  // Drop the registry row (no-op if absent).
  await reg.execute("DELETE FROM cooperatives WHERE id = ?", [DEMO_COOP.id]);
}

export async function isDemoSeeded(): Promise<boolean> {
  const reg = await getRegistryDb();
  const rows = await reg.select<Array<{ id: string }>>("SELECT id FROM cooperatives WHERE is_demo = 1 LIMIT 1");
  return rows.length > 0;
}

// ── Internal seed helpers ──

async function seedDemoCoaAccounts(db: Awaited<ReturnType<typeof getCoopDb>>): Promise<void> {
  const existing = await db.select<Array<{ code: string }>>("SELECT code FROM coa_accounts LIMIT 1");
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
      `INSERT INTO coa_accounts (code, name, type, normal_balance, balance)
       VALUES (?, ?, ?, ?, ?)`,
      [acc.code, acc.name, acc.type, acc.normal_balance, acc.balance],
    );
  }
}

async function seedDemoCategoriesAtLevel(db: Awaited<ReturnType<typeof getCoopDb>>, level: DemoLevel): Promise<void> {
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
    await db.execute("INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)", [cat.id, cat.name, cat.icon]);
  }
}

async function seedDemoInventoryAtLevel(db: Awaited<ReturnType<typeof getCoopDb>>, level: DemoLevel): Promise<void> {
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
      `INSERT INTO inventory_items (id, name, category_id, stock_quantity, unit, cost_price, selling_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.category_id, item.stock_quantity, item.unit, item.cost_price, item.selling_price],
    );
  }
}

// ── Tier → seeded-data helpers ──────────────────────────────

const MEMBER_FIRST_NAMES = [
  "Budi",
  "Siti",
  "Agus",
  "Rina",
  "Joko",
  "Dewi",
  "Anto",
  "Maya",
  "Eko",
  "Nur",
  "Tono",
  "Wati",
  "Slamet",
  "Sri",
  "Hendra",
  "Yanti",
  "Bambang",
  "Susi",
  "Rudi",
  "Lina",
  "Fajar",
  "Indah",
  "Gunawan",
  "Sartika",
  "Purnomo",
  "Wulan",
  "Agung",
  "Tuti",
  "Bayu",
  "Sugeng",
  "Marni",
  "Hadi",
  "Yuni",
  "Ani",
  "Wahyu",
  "Sri",
  "Budi",
  "Siti",
  "Rina",
  "Joko",
  "Dewi",
  "Anto",
  "Maya",
  "Eko",
  "Nur",
  "Tono",
  "Wati",
  "Slamet",
  "Sri",
  "Rina",
];

/** Parse an Indonesian duration like "4 bulan" / "2 tahun" into days. */
function parseDurationToDays(value: string): number {
  const m = value.match(/(\d+)\s*(bulan|tahun)/i);
  if (!m) return 365;
  const n = parseInt(m[1], 10);
  return m[2].toLowerCase() === "tahun" ? n * 365 : n * 30;
}

/** Derive a plausible founded_date from the tier's "Berjalan" stat. */
function computeFoundedDate(tier: DemoTier): string {
  const berjalan = tier.stats.find((s) => s.label === "Berjalan")?.value ?? "1 tahun";
  const d = new Date();
  d.setDate(d.getDate() - parseDurationToDays(berjalan));
  return d.toISOString().slice(0, 10);
}

/** Seed enough members to match the tier's "Anggota" stat. */
async function seedDemoMembers(db: Awaited<ReturnType<typeof getCoopDb>>, tier: DemoTier): Promise<void> {
  const anggota = tier.stats.find((s) => s.label === "Anggota")?.value ?? "0";
  const count = parseInt(anggota, 10) || 0;
  for (let i = 0; i < count; i++) {
    const id = `mem-demo-${i}`;
    const nik = `3201${String(10000000 + i).slice(-8)}`;
    const name = `${MEMBER_FIRST_NAMES[i % MEMBER_FIRST_NAMES.length]} ${String.fromCharCode(65 + (i % 26))}.`;
    await db.execute(
      `INSERT INTO members (id, nik, name, status, registered_at)
       VALUES (?, ?, ?, 'aktif', datetime('now'))`,
      [id, nik, name],
    );
  }
}
