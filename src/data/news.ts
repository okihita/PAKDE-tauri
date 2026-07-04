export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: "kabupaten" | "provinsi" | "kementerian";
  sourceName: string;
  timestamp: string;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "n1",
    title: "Target SHU Nasional Tahun Ini Naik 15%",
    content:
      "Kementerian Koperasi menetapkan target kenaikan SHU nasional sebesar 15% untuk tahun berjalan. Seluruh koperasi diharapkan meningkatkan efisiensi operasional dan memperluas jangkauan unit usaha.",
    source: "kementerian",
    sourceName: "Kementerian Koperasi",
    timestamp: "2026-07-03T08:00:00Z",
  },
  {
    id: "n2",
    title: "Pelatihan SAK EP Gratis untuk Koperasi Desa",
    content:
      "Dinas Koperasi Provinsi Jawa Timur membuka pendaftaran pelatihan SAK EP gratis bagi 100 koperasi desa. Pelatihan mencakup penyusunan laporan keuangan, neraca, dan laporan laba rugi sesuai standar.",
    source: "provinsi",
    sourceName: "Dinas Koperasi Jatim",
    timestamp: "2026-07-02T10:30:00Z",
  },
  {
    id: "n3",
    title: "Batas Akhir Laporan Semester I: 15 Juli 2026",
    content:
      "Seluruh koperasi di Kabupaten Mojokerto wajib menyampaikan laporan semester I paling lambat 15 Juli 2026. Keterlambatan akan mempengaruhi penilaian kesehatan koperasi.",
    source: "kabupaten",
    sourceName: "Dinas Koperasi Mojokerto",
    timestamp: "2026-07-01T07:00:00Z",
  },
  {
    id: "n4",
    title: "Program Digitalisasi Koperasi: Bantuan Perangkat untuk 50 Koperasi",
    content:
      "Kementerian Koperasi membuka program bantuan perangkat digital (laptop + software PAKDE) untuk 50 koperasi desa terpilih. Syarat: memiliki minimal 100 anggota aktif dan laporan keuangan lengkap.",
    source: "kementerian",
    sourceName: "Kementerian Koperasi",
    timestamp: "2026-06-28T09:00:00Z",
  },
  {
    id: "n5",
    title: "Peringatan Dini: Potensi Gagal Bayar Pinjaman Musim Panen",
    content:
      "Dinas Koperasi Kabupaten Mojokerto mengeluarkan peringatan dini terkait potensi gagal bayar pinjaman anggota pada musim panen tahun ini. Manajer diimbau melakukan rescheduling dan komunikasi intensif dengan anggota.",
    source: "kabupaten",
    sourceName: "Dinas Koperasi Mojokerto",
    timestamp: "2026-06-25T14:00:00Z",
  },
  {
    id: "n6",
    title: "Jadwal Verifikasi dan Validasi Data Koperasi Tahunan",
    content:
      "Tim verifikasi Dinas Koperasi Provinsi akan melakukan kunjungan ke koperasi desa untuk validasi data anggota dan keuangan mulai Agustus 2026. Pastikan database PAKDE Anda siap.",
    source: "provinsi",
    sourceName: "Dinas Koperasi Jatim",
    timestamp: "2026-06-20T11:00:00Z",
  },
];
