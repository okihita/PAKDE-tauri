import type { DemoLevel } from "@/db/seed-demo";

export interface DemoTier {
  level: DemoLevel;
  title: string;
  coopName: string;
  narrative: string;
  features: string[];
  stats: { label: string; value: string }[];
  village: string;
  regency: string;
  province: string;
  /** Real level-4 village code from wilayah.sqlite (source of truth for names). */
  villageCode: string;
  units: string[];
  border: string;
  bg: string;
  text: string;
}

export const DEMO_TIERS: DemoTier[] = [
  {
    level: "pemula",
    title: "Pemula",
    coopName: "Koperasi Tani Sejahtera",
    narrative:
      "Pak Karto baru saja merintis koperasi ini bersama 19 tetangganya di Lampung. Mereka mulai dengan mengumpulkan pupuk untuk musim tanam berikutnya — gotong royong, langkah demi langkah.",
    features: ["Dashboard", "Anggota", "Unit Usaha", "Penjualan", "Inventaris", "Akuntansi Dasar", "Profil Koperasi"],
    stats: [
      { label: "Berjalan", value: "4 bulan" },
      { label: "Anggota", value: "20" },
      { label: "Unit Usaha", value: "1" },
    ],
    village: "Sri Way Langsep",
    regency: "Kabupaten Lampung Tengah",
    province: "Lampung",
    villageCode: "18.02.01.2001",
    units: ["unit_pupuk"],
    border: "border-amber-900/40",
    bg: "bg-amber-950/20",
    text: "text-amber-300",
  },
  {
    level: "menengah",
    title: "Menengah",
    coopName: "Koperasi Usaha Bersama",
    narrative:
      "Berawal dari pupuk, koperasi di Bontang ini berkembang dengan unit simpan pinjam. Ibu Siti Rahmawati memimpin pencatatan keuangan yang rapi — koperasi mulai tumbuh dan dipercaya warga.",
    features: [
      "Dashboard",
      "Anggota",
      "Unit Usaha",
      "Penjualan",
      "Inventaris",
      "Akuntansi",
      "Simpan Pinjam",
      "Statistik",
      "Profil Koperasi",
      "EWS Alert",
    ],
    stats: [
      { label: "Berjalan", value: "2 tahun" },
      { label: "Anggota", value: "30" },
      { label: "Unit Usaha", value: "2" },
    ],
    village: "Bontang Baru",
    regency: "Kota Bontang",
    province: "Kalimantan Timur",
    villageCode: "64.74.01.1002",
    units: ["unit_pupuk", "unit_simpan_pinjam"],
    border: "border-amber-800/50",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
  },
  {
    level: "lanjutan",
    title: "Lanjutan",
    coopName: "Koperasi Maju Bersama",
    narrative:
      "Koperasi Maju Bersama telah menjadi tulang punggung ekonomi di Makassar. Dari pupuk hingga apotek, semua dikelola secara profesional — koperasi mandiri dan menjadi rujukan daerah.",
    features: [
      "Semua 16 Modul",
      "Dashboard",
      "Anggota",
      "Unit Usaha",
      "Penjualan",
      "Inventaris",
      "Akuntansi Lengkap",
      "Simpan Pinjam",
      "Statistik",
      "Ranking",
      "Leveling",
      "Tata Letak Toko",
      "Analisis Kelayakan",
      "EWS Alert",
      "Sinkronisasi",
      "Profil Koperasi",
    ],
    stats: [
      { label: "Berjalan", value: "5 tahun" },
      { label: "Anggota", value: "50" },
      { label: "Unit Usaha", value: "4" },
    ],
    village: "Bontorannu",
    regency: "Kota Makassar",
    province: "Sulawesi Selatan",
    villageCode: "73.71.01.1001",
    units: ["unit_pupuk", "unit_simpan_pinjam", "unit_apotek", "unit_pemasaran"],
    border: "border-amber-600/50",
    bg: "bg-amber-950/60",
    text: "text-amber-500",
  },
];
