import { getRegistryDb, getCoopDb, initCoopDb } from "@/db";
import type { CooperativeProfile, EwsAlert } from "@/types";

export interface CreateCooperativeInput {
  name: string;
  legalId: string;
  address: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  chairman: string;
  secretary: string;
  treasurer: string;
  supervisor: string;
  unitPupuk: boolean;
  unitSimpanPinjam: boolean;
  unitToko: boolean;
  foundedDate: string;
  category: string;
}

export async function createCooperative(input: CreateCooperativeInput): Promise<CooperativeProfile> {
  const db = await getRegistryDb();
  const newId = crypto.randomUUID();

  const units: string[] = [];
  if (input.unitPupuk) units.push("unit_pupuk");
  if (input.unitSimpanPinjam) units.push("unit_simpan_pinjam");
  if (input.unitToko) units.push("unit_toko_desa");

  const officersJson = JSON.stringify({
    chairman: input.chairman.trim(),
    secretary: input.secretary.trim(),
    treasurer: input.treasurer.trim(),
    supervisor: input.supervisor.trim(),
  });

  await db.execute(
    `INSERT INTO cooperatives (
      id, name, legal_id, address, village, district, regency, province,
      postal_code, phone, email, business_units, officers, health_score, rag_status, xp, founded_date, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      input.name.trim(),
      input.legalId.trim() || null,
      input.address.trim() || null,
      input.village.trim() || null,
      input.district.trim() || null,
      input.regency.trim(),
      input.province.trim(),
      input.postalCode.trim() || null,
      input.phone.trim() || null,
      input.email.trim() || null,
      JSON.stringify(units),
      officersJson,
      10.0,
      "Merah",
      10,
      input.foundedDate.trim() || null,
      input.category,
    ],
  );

  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [newId]);
  if (rows.length === 0) throw new Error("Failed to verify cooperative creation.");

  // Provision this cooperative's own data file before any feature writes to it.
  await initCoopDb(newId);

  return rows[0];
}

export async function listCooperatives(): Promise<CooperativeProfile[]> {
  const db = await getRegistryDb();
  return db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE is_demo = 0 ORDER BY created_at DESC");
}

export async function getCooperativeById(id: string): Promise<CooperativeProfile | null> {
  const db = await getRegistryDb();
  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [id]);
  return rows.length > 0 ? rows[0] : null;
}

/** Returns the seeded demo cooperative, or null if not yet seeded. */
export async function getDemoCooperative(): Promise<CooperativeProfile | null> {
  const db = await getRegistryDb();
  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE is_demo = 1 LIMIT 1");
  return rows.length > 0 ? rows[0] : null;
}

/** Number of members registered under a cooperative. */
export async function getMemberCount(cooperativeId: string): Promise<number> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<Array<{ count: number }>>("SELECT COUNT(*) AS count FROM members");
  return rows[0]?.count ?? 0;
}

/** Active (unresolved) EWS alerts for a cooperative, used by the shell badge. */
export async function getActiveEwsAlerts(cooperativeId: string): Promise<EwsAlert[]> {
  const db = await getCoopDb(cooperativeId);
  return db.select<EwsAlert[]>("SELECT * FROM ews_alerts WHERE is_active = 1");
}

/** Cooperative net worth (Assets − Liabilities) from the chart of accounts. */
export async function getNetWorth(cooperativeId: string): Promise<number> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<Array<{ assets: number; liabilities: number }>>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'aset' THEN balance ELSE 0 END), 0) AS assets,
       COALESCE(SUM(CASE WHEN type = 'kewajiban' THEN balance ELSE 0 END), 0) AS liabilities
     FROM coa_accounts`,
  );
  const r = rows[0];
  if (!r) return 0;
  return r.assets - r.liabilities;
}
