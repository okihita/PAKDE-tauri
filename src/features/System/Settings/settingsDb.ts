import { getRegistryDb, invalidateCoopDb } from "@/db";
import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, remove } from "@tauri-apps/plugin-fs";
import type { CooperativeProfile } from "@/types";

export async function updateCooperative(id: string, data: Partial<CooperativeProfile>): Promise<void> {
  const db = await getRegistryDb();
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

export async function deleteCooperative(id: string): Promise<void> {
  const db = await getRegistryDb();
  // Operational data lives in its own file — delete it directly (children too).
  const dataDir = await appDataDir();
  const coopFile = await join(dataDir, "coops", `${id}.db`);
  if (await exists(coopFile)) await remove(coopFile);
  // Drop any cached connection so nothing writes to the deleted file.
  await invalidateCoopDb(id);
  // Coop-scoped event attachment files live under <dataDir>/<id>/events/...
  const coopFolder = await join(dataDir, id);
  if (await exists(coopFolder)) await remove(coopFolder, { recursive: true });

  // Finally drop the registry row.
  await db.execute("DELETE FROM cooperatives WHERE id = ?", [id]);
}
