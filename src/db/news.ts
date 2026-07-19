// ── News / pengumuman (Berita & Info) data layer ─────────────
//
// News is coop-scoped: each cooperative owns its own `news` table inside its
// `coops/<id>.db` file. There is no `coop_id` column — the tenant is implied
// by the file. The `NewsItem` shape mirrors the UI contract in `@/data/news`.

import { getCoopDb } from "@/db";

/** UI-facing news item shape (kept in sync with `@/data/news`). */
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: "kabupaten" | "provinsi" | "kementerian" | "internal";
  sourceName: string;
  timestamp: string;
  pinned?: boolean;
}

/** Lightweight row coming straight out of the `news` table. */
interface NewsRow {
  id: string;
  title: string;
  content: string;
  source: NewsItem["source"];
  source_name: string;
  pinned?: number;
  created_at: string;
}

/** Default seed items for a freshly-created (real) cooperative. */
export const DEFAULT_NEWS_ITEMS: ReadonlyArray<Omit<NewsItem, "timestamp">> = [
  {
    id: "default-kab-bantuan-pupuk",
    title: "Bantuan Pupuk Subsidi Tahap II Telah Dibuka",
    content:
      "Dinas Pertanian Kabupaten membuka pendaftaran bantuan pupuk subsidi tahap II. Koperasi dapat mengajukan kuota melalui kios resmi paling lambat akhir bulan berjalan.",
    source: "kabupaten",
    sourceName: "Dinas Pertanian Kabupaten",
  },
  {
    id: "default-prov-program-umi",
    title: "Program UMi Siap Disalurkan Melalui Koperasi",
    content:
      "Pemerintah Provinsi menyalurkan dana Ultra Mikro (UMi) melalui koperasi mitra. Ajukan proposal unit usaha untuk mendapatkan pembiayaan bunga rendah.",
    source: "provinsi",
    sourceName: "Dinas Koperasi Provinsi",
  },
  {
    id: "default-kem-penyuluhan",
    title: "Penyuluhan Akuntansi Koperasi Gratis",
    content:
      "Kementerian Koperasi menyelenggarakan penyuluhan pembukuan digital gratis. Daftarkan pengelola koperasi untuk meningkatkan tata kelola keuangan.",
    source: "kementerian",
    sourceName: "Kementerian Koperasi",
  },
  {
    id: "default-kab-rapat-akhir-tahun",
    title: "Jadwal Rapat Anggota Tahunan (RAT) Mendekat",
    content:
      "Bupati mengimbau seluruh koperasi menyelenggarakan RAT sebelum tutup tahun. Siapkan laporan keuangan dan SHU untuk dibagikan kepada anggota.",
    source: "kabupaten",
    sourceName: "Diskoprindag Kabupaten",
  },
  {
    id: "default-prov-pelatihan-digital",
    title: "Pelatihan Digitalisasi Koperasi Desa",
    content:
      "Provinsi membuka pelatihan digitalisasi bagi koperasi desa. Kuota terbatas untuk 50 koperasi pertama yang mendaftar secara daring.",
    source: "provinsi",
    sourceName: "Diskominfo Provinsi",
  },
  {
    id: "default-kem-legalitas",
    title: "Kemudahan Perpanjangan Badan Hukum Koperasi",
    content:
      "Kementerian Koperasi menyederhanakan proses perpanjangan badan hukum. Ajukan secara elektronik tanpa perlu datang ke kantor pusat.",
    source: "kementerian",
    sourceName: "Kementerian Koperasi",
  },
];

/** Richer mock feed seeded into the demo cooperative so Beranda shows content. */
export const DEMO_NEWS_ITEMS: ReadonlyArray<Omit<NewsItem, "timestamp">> = [
  {
    id: "demo-selamat-datang",
    title: "Selamat Datang di Koperasi Desa Makmur",
    content:
      "Ini adalah mode demo PAKDE. Jelajahi fitur pembukuan, manajemen anggota, dan panduan EWS tanpa risiko. Data yang ditampilkan adalah contoh tiruan.",
    source: "internal",
    sourceName: "PAKDE",
  },
  {
    id: "demo-bantuan-pupuk",
    title: "Bantuan Pupuk Subsidi Tahap II Telah Dibuka",
    content:
      "Dinas Pertanian Kabupaten membuka pendaftaran bantuan pupuk subsidi tahap II. Koperasi dapat mengajukan kuota melalui kios resmi paling lambat akhir bulan berjalan.",
    source: "kabupaten",
    sourceName: "Dinas Pertanian Kabupaten",
  },
  {
    id: "demo-program-umi",
    title: "Program UMi Siap Disalurkan Melalui Koperasi",
    content:
      "Pemerintah Provinsi menyalurkan dana Ultra Mikro (UMi) melalui koperasi mitra. Ajukan proposal unit usaha untuk mendapatkan pembiayaan bunga rendah.",
    source: "provinsi",
    sourceName: "Dinas Koperasi Provinsi",
  },
  {
    id: "demo-penyuluhan",
    title: "Penyuluhan Akuntansi Koperasi Gratis",
    content:
      "Kementerian Koperasi menyelenggarakan penyuluhan pembukuan digital gratis. Daftarkan pengelola koperasi untuk meningkatkan tata kelola keuangan.",
    source: "kementerian",
    sourceName: "Kementerian Koperasi",
  },
  {
    id: "demo-rat",
    title: "Jadwal Rapat Anggota Tahunan (RAT) Mendekat",
    content:
      "Bupati mengimbau seluruh koperasi menyelenggarakan RAT sebelum tutup tahun. Siapkan laporan keuangan dan SHU untuk dibagikan kepada anggota.",
    source: "kabupaten",
    sourceName: "Diskoprindag Kabupaten",
  },
];

/**
 * Insert seed news items only if the table is currently empty (idempotent).
 * Safe to call on every coop (re)provisioning pass.
 */
export async function seedNews(
  db: Awaited<ReturnType<typeof getCoopDb>>,
  items: ReadonlyArray<Omit<NewsItem, "timestamp">>,
): Promise<void> {
  const existing = await db.select<Array<{ id: string }>>("SELECT id FROM news LIMIT 1");
  if (existing.length > 0) return;

  for (const item of items) {
    await db.execute(
      `INSERT INTO news (id, title, content, source, source_name, audience, created_by, pinned)
       VALUES (?, ?, ?, ?, ?, 'all', NULL, 0)`,
      [item.id, item.title, item.content, item.source, item.sourceName],
    );
  }
}

/** Default six items for a real (non-demo) cooperative. */
export const seedDefaultNews = (db: Awaited<ReturnType<typeof getCoopDb>>): Promise<void> =>
  seedNews(db, DEFAULT_NEWS_ITEMS);

/** Mock feed for the demo cooperative (used on fresh seed). */
export const seedDemoNews = (db: Awaited<ReturnType<typeof getCoopDb>>): Promise<void> => seedNews(db, DEMO_NEWS_ITEMS);

/**
 * Ensure the demo cooperative's mock feed is present. Unlike `seedDemoNews`
 * (which bails when the table already has rows), this UPSERTs each demo item by
 * id — so an existing account whose `news` table predates the multi-item feed
 * still gets the full set on launch/resume, without wiping user data.
 */
export async function ensureDemoNews(db: Awaited<ReturnType<typeof getCoopDb>>): Promise<void> {
  for (const item of DEMO_NEWS_ITEMS) {
    await db.execute(
      `INSERT OR REPLACE INTO news (id, title, content, source, source_name, audience, created_by, pinned)
       VALUES (?, ?, ?, ?, ?, COALESCE((SELECT audience FROM news WHERE id = ?), 'all'), NULL, 0)`,
      [item.id, item.title, item.content, item.source, item.sourceName, item.id],
    );
  }
}

/** Load the coop's news, newest first (pinned items float to the top). */
export async function getNewsItems(coopId: string): Promise<NewsItem[]> {
  const db = await getCoopDb(coopId);
  const rows = await db.select<NewsRow[]>(
    `SELECT id, title, content, source, source_name, pinned, created_at
       FROM news
      ORDER BY pinned DESC, datetime(created_at) DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    source: r.source,
    sourceName: r.source_name,
    timestamp: r.created_at,
    pinned: Boolean(r.pinned),
  }));
}
