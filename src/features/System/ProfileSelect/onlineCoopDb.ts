// ── Mock Online Cooperative Database ──

export interface OnlineCooperative {
  id: string;
  name: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  category: string;
  memberCount: number;
  healthScore: number;
  level: string;
  businessUnits: string[];
  foundedYear: number;
  registrationCode: string;
}

const MOCK_ONLINE_COOPS: OnlineCooperative[] = [
  {
    id: "online-001",
    name: "KUD Makmur Sejahtera",
    province: "JAWA TENGAH",
    regency: "KABUPATEN KLATEN",
    district: "Kecamatan Jogonalan",
    village: "Desa Prawatan",
    category: "serba_usaha",
    memberCount: 245,
    healthScore: 78,
    level: "desa",
    businessUnits: ["unit_pupuk", "unit_simpan_pinjam", "unit_toko_desa"],
    foundedYear: 2015,
    registrationCode: "MKMR-2025",
  },
  {
    id: "online-002",
    name: "Kopontren Al-Ikhlas",
    province: "JAWA TIMUR",
    regency: "KABUPATEN MOJOKERTO",
    district: "Kecamatan Puri",
    village: "Desa Kenanten",
    category: "konsumsi",
    memberCount: 180,
    healthScore: 65,
    level: "desa",
    businessUnits: ["unit_toko_desa", "unit_simpan_pinjam"],
    foundedYear: 2018,
    registrationCode: "ALIK-2025",
  },
  {
    id: "online-003",
    name: "KSU Bina Usaha Mandiri",
    province: "JAWA BARAT",
    regency: "KABUPATEN BANDUNG",
    district: "Kecamatan Cileunyi",
    village: "Desa Cimekar",
    category: "jasa",
    memberCount: 320,
    healthScore: 82,
    level: "kecamatan",
    businessUnits: ["unit_simpan_pinjam", "unit_pemasaran", "unit_jasa"],
    foundedYear: 2012,
    registrationCode: "BUM-2025",
  },
  {
    id: "online-004",
    name: "Koperasi Nelayan Samudra",
    province: "SUMATERA UTARA",
    regency: "KABUPATEN TAPANULI TENGAH",
    district: "Kecamatan Sibolga Sambas",
    village: "Desa Aek Sijorni",
    category: "produksi",
    memberCount: 410,
    healthScore: 71,
    level: "kecamatan",
    businessUnits: ["unit_produksi", "unit_pemasaran", "unit_apotek"],
    foundedYear: 2010,
    registrationCode: "NDRA-2025",
  },
  {
    id: "online-005",
    name: "KUD Tani Subur",
    province: "DAERAH ISTIMEWA YOGYAKARTA",
    regency: "KABUPATEN SLEMAN",
    district: "Kecamatan Ngemplak",
    village: "Desa Wedomartani",
    category: "serba_usaha",
    memberCount: 195,
    healthScore: 88,
    level: "desa",
    businessUnits: ["unit_pupuk", "unit_toko_desa", "unit_simpan_pinjam", "unit_apotek"],
    foundedYear: 2008,
    registrationCode: "TSUB-2025",
  },
  {
    id: "online-006",
    name: "Kopwan Melati Indah",
    province: "BALI",
    regency: "KABUPATEN GIANYAR",
    district: "Kecamatan Ubud",
    village: "Desa Petulu",
    category: "konsumsi",
    memberCount: 150,
    healthScore: 74,
    level: "desa",
    businessUnits: ["unit_toko_desa", "unit_simpan_pinjam"],
    foundedYear: 2019,
    registrationCode: "MLTI-2025",
  },
  {
    id: "online-007",
    name: "Koperasi Sawit Lestari",
    province: "KALIMANTAN TENGAH",
    regency: "KABUPATEN KOTAWARINGIN TIMUR",
    district: "Kecamatan Mentaya Hilir Selatan",
    village: "Desa Basawang",
    category: "produksi",
    memberCount: 560,
    healthScore: 69,
    level: "kecamatan",
    businessUnits: ["unit_produksi", "unit_pemasaran", "unit_pupuk"],
    foundedYear: 2005,
    registrationCode: "SWLS-2025",
  },
  {
    id: "online-008",
    name: "KUD Harapan Jaya",
    province: "SULAWESI SELATAN",
    regency: "KABUPATEN BONE",
    district: "Kecamatan Patimpeng",
    village: "Desa Masago",
    category: "serba_usaha",
    memberCount: 280,
    healthScore: 76,
    level: "desa",
    businessUnits: ["unit_pupuk", "unit_simpan_pinjam", "unit_pemasaran"],
    foundedYear: 2014,
    registrationCode: "HJAY-2025",
  },
  {
    id: "online-009",
    name: "KSP Berkah Abadi",
    province: "NUSA TENGGARA BARAT",
    regency: "KABUPATEN LOMBOK BARAT",
    district: "Kecamatan Gunung Sari",
    village: "Desa Jatisela",
    category: "jasa",
    memberCount: 135,
    healthScore: 62,
    level: "desa",
    businessUnits: ["unit_simpan_pinjam", "unit_jasa"],
    foundedYear: 2020,
    registrationCode: "BABD-2025",
  },
  {
    id: "online-010",
    name: "Koperasi Damar Wulan",
    province: "BANTEN",
    regency: "KABUPATEN SERANG",
    district: "Kecamatan Kramatwatu",
    village: "Desa Pamengkang",
    category: "serba_usaha",
    memberCount: 390,
    healthScore: 84,
    level: "kecamatan",
    businessUnits: ["unit_toko_desa", "unit_simpan_pinjam", "unit_pupuk", "unit_apotek"],
    foundedYear: 2011,
    registrationCode: "DMRW-2025",
  },
  {
    id: "online-011",
    name: "KUD Mekar Sari",
    province: "JAWA TIMUR",
    regency: "KABUPATEN MALANG",
    district: "Kecamatan Kepanjen",
    village: "Desa Dilem",
    category: "pemasaran",
    memberCount: 220,
    healthScore: 73,
    level: "desa",
    businessUnits: ["unit_pemasaran", "unit_pupuk"],
    foundedYear: 2016,
    registrationCode: "MKSR-2025",
  },
  {
    id: "online-012",
    name: "Koperasi Gunung Emas",
    province: "PAPUA",
    regency: "KABUPATEN MIMIKA",
    district: "Distrik Kuala Kencana",
    village: "Desa Utikini Baru",
    category: "produksi",
    memberCount: 175,
    healthScore: 58,
    level: "desa",
    businessUnits: ["unit_produksi", "unit_pemasaran"],
    foundedYear: 2017,
    registrationCode: "GNEM-2025",
  },
  {
    id: "online-013",
    name: "Kopkar Maju Lancar",
    province: "JAWA BARAT",
    regency: "KABUPATEN BEKASI",
    district: "Kecamatan Tambun Selatan",
    village: "Desa Sumber Harapan",
    category: "konsumsi",
    memberCount: 510,
    healthScore: 91,
    level: "kabupaten",
    businessUnits: ["unit_toko_desa", "unit_simpan_pinjam", "unit_jasa", "unit_apotek"],
    foundedYear: 2003,
    registrationCode: "MJLN-2025",
  },
  {
    id: "online-014",
    name: "KUD Rimba Raya",
    province: "ACEH",
    regency: "KABUPATEN ACEH TENGAH",
    district: "Kecamatan Pegasing",
    village: "Desa Kayu Kul",
    category: "serba_usaha",
    memberCount: 260,
    healthScore: 67,
    level: "desa",
    businessUnits: ["unit_pupuk", "unit_produksi"],
    foundedYear: 2013,
    registrationCode: "RMBR-2025",
  },
  {
    id: "online-015",
    name: "Koperasi Mina Bahari",
    province: "MALUKU",
    regency: "KOTA AMBON",
    district: "Kecamatan Nusaniwe",
    village: "Desa Nusaniwe",
    category: "produksi",
    memberCount: 200,
    healthScore: 72,
    level: "desa",
    businessUnits: ["unit_produksi", "unit_pemasaran", "unit_simpan_pinjam"],
    foundedYear: 2021,
    registrationCode: "MNBH-2025",
  },
];

/** Simulate network delay (800–1500 ms) */
function simulateDelay(): Promise<void> {
  const ms = 800 + Math.random() * 700;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search online cooperatives by name query and optional region filter.
 */
export async function searchOnlineCoops(query: string, region?: string): Promise<OnlineCooperative[]> {
  await simulateDelay();

  let results = MOCK_ONLINE_COOPS;

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.regency.toLowerCase().includes(q) || c.village.toLowerCase().includes(q),
    );
  }

  if (region?.trim()) {
    const r = region.toLowerCase();
    results = results.filter((c) => c.province.toLowerCase().includes(r) || c.regency.toLowerCase().includes(r));
  }

  return results;
}
