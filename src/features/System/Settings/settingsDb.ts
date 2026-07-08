import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";

export async function updateCooperative(
  id: string,
  data: Partial<CooperativeProfile>,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE cooperatives SET name=?, legal_id=?, address=?, village=?, district=?, regency=?, province=?, postal_code=?, phone=?, email=?, business_units=?, officers=?, updated_at=datetime('now') WHERE id=?`,
    [
      data.name || null,
      data.legal_id || null,
      data.address || null,
      data.village || null,
      data.district || null,
      data.regency || null,
      data.province || null,
      data.postal_code || null,
      data.phone || null,
      data.email || null,
      data.business_units || null,
      data.officers || null,
      id,
    ],
  );
}
