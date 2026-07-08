import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

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
  const db = await getDb();
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
      postal_code, phone, email, business_units, officers, health_score, rag_status, founded_date, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      100.0,
      "green",
      input.foundedDate.trim() || null,
      input.category,
    ],
  );

  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [newId]);
  if (rows.length === 0) throw new Error("Failed to verify cooperative creation.");
  return rows[0];
}

export async function listCooperatives(): Promise<CooperativeProfile[]> {
  const db = await getDb();
  return db.select<CooperativeProfile[]>("SELECT * FROM cooperatives ORDER BY created_at DESC");
}

export async function getCooperativeById(id: string): Promise<CooperativeProfile | null> {
  const db = await getDb();
  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [id]);
  return rows.length > 0 ? rows[0] : null;
}
