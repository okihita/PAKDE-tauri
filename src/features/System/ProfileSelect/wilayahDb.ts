import { getWilayahDb } from "@/db/wilayah-init";

export interface WilayahRow {
  kode: string;
  nama: string;
  level: number;
}

export async function searchProvinces(query: string): Promise<WilayahRow[]> {
  const db = await getWilayahDb();
  return db.select<WilayahRow[]>(
    "SELECT kode, nama FROM wilayah WHERE level = 1 AND nama LIKE ? ORDER BY nama LIMIT 50",
    [`%${query}%`],
  );
}

export async function searchRegencies(provinceCode: string, query: string): Promise<WilayahRow[]> {
  const db = await getWilayahDb();
  const prefix = provinceCode + ".%";
  return db.select<WilayahRow[]>(
    "SELECT kode, nama FROM wilayah WHERE level = 2 AND kode LIKE ? AND nama LIKE ? ORDER BY nama LIMIT 50",
    [prefix, `%${query}%`],
  );
}

export async function searchDistricts(regencyCode: string, query: string): Promise<WilayahRow[]> {
  const db = await getWilayahDb();
  const prefix = regencyCode + ".%";
  return db.select<WilayahRow[]>(
    "SELECT kode, nama FROM wilayah WHERE level = 3 AND kode LIKE ? AND nama LIKE ? ORDER BY nama LIMIT 50",
    [prefix, `%${query}%`],
  );
}

export async function searchVillages(
  districtCode: string | null,
  query: string,
): Promise<(WilayahRow & { district_nama: string; regency_nama: string })[]> {
  const db = await getWilayahDb();
  if (districtCode) {
    // Narrowed by district — faster, no collision
    const prefix = districtCode + ".%";
    const rows = await db.select<WilayahRow[]>(
      `SELECT w.kode, w.nama
       FROM wilayah w
       WHERE w.level = 4 AND w.kode LIKE ? AND w.nama LIKE ?
       ORDER BY w.nama LIMIT 30`,
      [prefix, `%${query}%`],
    );
    return rows.map((r) => ({ ...r, district_nama: "", regency_nama: "" }));
  }

  // Direct village search — disambiguate with district + regency context
  return db.select(
    `SELECT w.kode, w.nama,
            d.nama AS district_nama,
            r.nama AS regency_nama
     FROM wilayah w
     JOIN wilayah d ON d.kode = substr(w.kode, 1, 8)
     JOIN wilayah r ON r.kode = substr(w.kode, 1, 5)
     WHERE w.level = 4 AND w.nama LIKE ?
     ORDER BY w.nama, r.nama, d.nama
     LIMIT 50`,
    [`%${query}%`],
  );
}
