import { getWilayahDb } from "@/db/wilayah-init";
import type { WilayahRow } from "@/features/System/ProfileSelect/wilayahDb";

export interface WilayahResolved {
  province_code: string;
  province_name: string;
  regency_code: string;
  regency_name: string;
  district_code: string;
  district_name: string;
  village_code: string;
  village_name: string;
}

const cache = new Map<string, WilayahResolved | null>();

/**
 * Resolve a dotted level-4 village code (e.g. `35.01.01.2001`) into its full
 * hierarchy names. Uses the 8/5/2 substr-JOIN scheme that matches the bundled
 * `wilayah.sqlite` dotted codes. Results are cached per village code.
 */
export async function resolveWilayah(villageCode: string | null | undefined): Promise<WilayahResolved | null> {
  if (!villageCode) return null;
  if (cache.has(villageCode)) return cache.get(villageCode) ?? null;

  const db = await getWilayahDb();
  const rows = await db.select<
    { kode: string; nama: string; district_nama: string; regency_nama: string; province_nama: string }[]
  >(
    `SELECT v.kode AS kode,
            v.nama AS nama,
            d.nama AS district_nama,
            r.nama AS regency_nama,
            p.nama AS province_nama
     FROM wilayah v
     JOIN wilayah d ON d.kode = substr(v.kode, 1, 8)
     JOIN wilayah r ON r.kode = substr(v.kode, 1, 5)
     JOIN wilayah p ON p.kode = substr(v.kode, 1, 2)
     WHERE v.kode = ?`,
    [villageCode],
  );

  const result: WilayahResolved | null =
    rows.length > 0
      ? {
          village_code: rows[0].kode,
          village_name: rows[0].nama,
          district_code: villageCode.slice(0, 8),
          district_name: rows[0].district_nama,
          regency_code: villageCode.slice(0, 5),
          regency_name: rows[0].regency_nama,
          province_code: villageCode.slice(0, 2),
          province_name: rows[0].province_nama,
        }
      : null;

  cache.set(villageCode, result);
  return result;
}

/** "Desa X, Kec. Y" */
export function formatWilayahShort(res: WilayahResolved | null): string {
  if (!res) return "-";
  return `Desa ${res.village_name}, Kec. ${res.district_name}`;
}

/** "Desa X, Kec. Y, Kab. Z, Prov." */
export function formatWilayahFull(res: WilayahResolved | null): string {
  if (!res) return "-";
  const regencyLabel = res.regency_name.startsWith("Kota")
    ? res.regency_name
    : `Kab. ${res.regency_name.replace(/^Kabupaten\s+/i, "")}`;
  return `Desa ${res.village_name}, Kec. ${res.district_name}, ${regencyLabel}, ${res.province_name}`;
}

/** Direct lookup of a single village row by its exact code. */
export async function getVillageByCode(code: string): Promise<WilayahRow | null> {
  const db = await getWilayahDb();
  const rows = await db.select<WilayahRow[]>("SELECT kode, nama, level FROM wilayah WHERE level = 4 AND kode = ?", [
    code,
  ]);
  return rows[0] ?? null;
}

/** Pick a random village whose code starts with the given regency prefix. */
export async function pickRandomVillageInRegency(prefix: string): Promise<WilayahRow | null> {
  const db = await getWilayahDb();
  const rows = await db.select<WilayahRow[]>(
    `SELECT kode, nama, level FROM wilayah
     WHERE level = 4 AND kode LIKE ?
     ORDER BY RANDOM() LIMIT 1`,
    [`${prefix}.%`],
  );
  return rows[0] ?? null;
}

/** Invalidate the resolution cache (used by tests / DB resets). */
export function clearWilayahCache(): void {
  cache.clear();
}
