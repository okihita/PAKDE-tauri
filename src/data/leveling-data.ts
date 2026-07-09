import type { LevelDef } from "./leveling";

export const LEVELS: LevelDef[] = [
  // ── Level 1 ─────────────────────────────────────────────────────
  {
    id: "rintisan",
    tier: 1,
    labelEn: "Pioneer",
    labelId: "Rintisan",
    descEn: "The cooperative is legally established and has its first members.",
    descId: "Koperasi sudah berdiri secara legal dan memiliki anggota pertama.",
    color: "#6b7280",
    bgClass: "bg-gray-500/10",
    textClass: "text-gray-400",
    minXp: 0,
    maxXp: 9,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Memiliki minimal 20 anggota aktif", en: "At least 20 active members" },
          { id: "Data anggota tercatat di PAKDE", en: "Member data recorded in PAKDE" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 50 Juta", en: "Total assets ≥ Rp 50 Million" },
          { id: "Memiliki pembukuan sederhana", en: "Basic bookkeeping in place" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Memiliki AD/ART (Anggaran Dasar)", en: "Have bylaws (AD/ART)" },
          { id: "Struktur pengurus minimal 3 orang", en: "Management of at least 3 people" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Terdaftar di Dinas Koperasi", en: "Registered with the Cooperative Office" },
          { id: "Memiliki Nomor Induk Koperasi", en: "Have a Cooperative Registration Number" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [{ id: "Menjalankan minimal 1 unit usaha", en: "Operate at least 1 business unit" }],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [{ id: "Menggunakan PAKDE untuk pencatatan anggota", en: "Use PAKDE for member records" }],
      },
    ],
  },

  // ── Level 2 ─────────────────────────────────────────────────────
  {
    id: "pemula",
    tier: 2,
    labelEn: "Beginner",
    labelId: "Pemula",
    descEn: "Basic operations running. Active savings and loan activity.",
    descId: "Operasi dasar berjalan. Aktivitas simpan pinjam aktif.",
    color: "#6366f1",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-400",
    minXp: 10,
    maxXp: 19,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 30 anggota aktif", en: "At least 30 active members" },
          { id: "Simpanan pokok terkumpul 100%", en: "100% principal savings collected" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 100 Juta", en: "Total assets ≥ Rp 100 Million" },
          { id: "Pembukuan simpan pinjam teratur", en: "Regular savings & loan bookkeeping" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "RAT pertama dilaksanakan", en: "First Annual Member Meeting held" },
          { id: "Buku daftar anggota tersedia", en: "Member register book available" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Laporan tahunan pertama disusun", en: "First annual report compiled" },
          { id: "NPWP koperasi terdaftar", en: "Cooperative NPWP registered" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [{ id: "Unit simpan pinjam berjalan", en: "Savings & loan unit operating" }],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [{ id: "Data anggota tersimpan digital", en: "Member data stored digitally" }],
      },
    ],
  },

  // ── Level 3 ─────────────────────────────────────────────────────
  {
    id: "bertumbuh",
    tier: 3,
    labelEn: "Growing",
    labelId: "Bertumbuh",
    descEn: "Membership is growing and financial activity is increasing.",
    descId: "Keanggotaan bertumbuh dan aktivitas keuangan meningkat.",
    color: "#3b82f6",
    bgClass: "bg-info/10",
    textClass: "text-info",
    minXp: 20,
    maxXp: 29,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 50 anggota aktif", en: "At least 50 active members" },
          { id: "Tingkat partisipasi ≥ 60%", en: "Participation rate ≥ 60%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 200 Juta", en: "Total assets ≥ Rp 200 Million" },
          { id: "SHU tahunan positif", en: "Positive annual SHU" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "RAT 2 tahun berturut-turut tepat waktu", en: "On-time RAT for 2 consecutive years" },
          { id: "Notulen RAT didokumentasikan", en: "Meeting minutes documented" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Laporan tahunan disampaikan ke Dinas", en: "Annual report submitted to the Office" },
          { id: "Pembayaran PSH terpenuhi", en: "PSH payments fulfilled" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "2 unit usaha berjalan", en: "2 business units operating" },
          { id: "1 unit usaha mencetak laba", en: "1 unit is profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [
          { id: "Menggunakan PAKDE untuk jurnal akuntansi", en: "Use PAKDE for accounting journal" },
          { id: "Pencatatan simpan pinjam via PAKDE", en: "Savings & loan recorded in PAKDE" },
        ],
      },
    ],
  },

  // ── Level 4 ─────────────────────────────────────────────────────
  {
    id: "produktif",
    tier: 4,
    labelEn: "Productive",
    labelId: "Produktif",
    descEn: "Business units are running and generating income.",
    descId: "Unit usaha berjalan dan menghasilkan pendapatan.",
    color: "#06b6d4",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-400",
    minXp: 30,
    maxXp: 39,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 75 anggota aktif", en: "At least 75 active members" },
          { id: "Tingkat partisipasi ≥ 65%", en: "Participation rate ≥ 65%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 350 Juta", en: "Total assets ≥ Rp 350 Million" },
          { id: "Rasio likuiditas ≥ 1.2", en: "Liquidity ratio ≥ 1.2" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Pembagian tugas pengurus jelas", en: "Clear division of management duties" },
          { id: "Rapat pengurus rutin bulanan", en: "Monthly management meetings" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Akta notaris lengkap dan perubahannya", en: "Complete notarial deeds & amendments" },
          { id: "Laporan semesteran ke Dinas", en: "Semi-annual reports to the Office" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "3 unit usaha berjalan", en: "3 business units operating" },
          { id: "2 unit usaha mencetak laba", en: "2 units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [{ id: "Laporan keuangan dari PAKDE", en: "Financial reports from PAKDE" }],
      },
    ],
  },

  // ── Level 5 ─────────────────────────────────────────────────────
  {
    id: "mapan",
    tier: 5,
    labelEn: "Established",
    labelId: "Mapan",
    descEn: "Stable operations with healthy financial ratios.",
    descId: "Operasional stabil dengan rasio keuangan yang sehat.",
    color: "#10b981",
    bgClass: "bg-success/10",
    textClass: "text-success",
    minXp: 40,
    maxXp: 49,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 100 anggota aktif", en: "At least 100 active members" },
          { id: "Tingkat partisipasi ≥ 75%", en: "Participation rate ≥ 75%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 500 Juta", en: "Total assets ≥ Rp 500 Million" },
          { id: "Non-performing loan < 5%", en: "NPL < 5%" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "RAT 3 tahun berturut-turut tepat waktu", en: "On-time RAT for 3 consecutive years" },
          { id: "Laporan keuangan diaudit internal", en: "Financial statements internally audited" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Sertifikat NIK terverifikasi", en: "NIK certificate verified" },
          { id: "Pajak koperasi terpenuhi", en: "Cooperative tax obligations met" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "3 unit usaha berjalan", en: "3 business units operating" },
          { id: "2 unit usaha mencetak laba", en: "2 units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [
          { id: "Sinkronisasi data via PAKDE", en: "Data sync via PAKDE" },
          { id: "Database anggota terpusat", en: "Centralized member database" },
        ],
      },
    ],
  },

  // ── Level 6 ─────────────────────────────────────────────────────
  {
    id: "tangguh",
    tier: 6,
    labelEn: "Resilient",
    labelId: "Tangguh",
    descEn: "Resilient operations with strong risk management.",
    descId: "Operasi tangguh dengan manajemen risiko yang kuat.",
    color: "#14b8a6",
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-400",
    minXp: 50,
    maxXp: 59,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 150 anggota aktif", en: "At least 150 active members" },
          { id: "Tingkat partisipasi ≥ 80%", en: "Participation rate ≥ 80%" },
          { id: "Kepuasan anggota terukur", en: "Measurable member satisfaction" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 750 Juta", en: "Total assets ≥ Rp 750 Million" },
          { id: "Rasio kecukupan modal ≥ 10%", en: "Capital adequacy ratio ≥ 10%" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Pengawas aktif melakukan pemeriksaan", en: "Active supervisory inspections" },
          { id: "Kebijakan perkreditan tertulis", en: "Written lending policy" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Seluruh laporan tepat waktu 1 tahun", en: "All reports on time for 1 year" },
          { id: "Tidak ada teguran dari Dinas", en: "No warnings from the Office" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "4 unit usaha berjalan", en: "4 business units operating" },
          { id: "3 unit usaha mencetak laba", en: "3 units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [{ id: "Laporan keuangan otomatis via PAKDE", en: "Auto financial reports via PAKDE" }],
      },
    ],
  },

  // ── Level 7 ─────────────────────────────────────────────────────
  {
    id: "maju",
    tier: 7,
    labelEn: "Advanced",
    labelId: "Maju",
    descEn: "Multiple profitable business units and strong governance.",
    descId: "Banyak unit usaha menguntungkan dan tata kelola kuat.",
    color: "#a855f7",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    minXp: 60,
    maxXp: 69,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 200 anggota aktif", en: "At least 200 active members" },
          { id: "Tingkat partisipasi ≥ 85%", en: "Participation rate ≥ 85%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 1 Miliar", en: "Total assets ≥ Rp 1 Billion" },
          { id: "Rasio kecukupan modal ≥ 12%", en: "Capital adequacy ratio ≥ 12%" },
          { id: "SHU meningkat 3 tahun berturut", en: "SHU increasing 3 consecutive years" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Pengurus bersertifikat pelatihan", en: "Management certified in training" },
          { id: "Kode etik dan kebijakan tertulis", en: "Written code of ethics & policies" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Laporan keuangan tepat waktu setiap bulan", en: "Monthly financial reports on time" },
          { id: "Tidak ada sanksi dari Dinas", en: "No sanctions from the Office" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "4+ unit usaha berjalan", en: "4+ business units operating" },
          { id: "3 unit usaha mencetak laba", en: "3 units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [{ id: "Analisis finansial via PAKDE", en: "Financial analysis via PAKDE" }],
      },
    ],
  },

  // ── Level 8 ─────────────────────────────────────────────────────
  {
    id: "inovatif",
    tier: 8,
    labelEn: "Innovative",
    labelId: "Inovatif",
    descEn: "Embracing technology and innovative business models.",
    descId: "Mengadopsi teknologi dan model bisnis inovatif.",
    color: "#ec4899",
    bgClass: "bg-pink-500/10",
    textClass: "text-pink-400",
    minXp: 70,
    maxXp: 79,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 300 anggota aktif", en: "At least 300 active members" },
          { id: "Tingkat partisipasi ≥ 90%", en: "Participation rate ≥ 90%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 2 Miliar", en: "Total assets ≥ Rp 2 Billion" },
          { id: "Diversifikasi portofolio", en: "Portfolio diversification" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Manajemen berbasis risiko", en: "Risk-based management" },
          { id: "Sistem pengendalian internal", en: "Internal control system" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Peringkat kesehatan dari Dinas: Cukup Sehat", en: "Office health rating: Fairly Healthy" },
          { id: "Kepatuhan pajak sempurna", en: "Perfect tax compliance" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "5 unit usaha berjalan", en: "5 business units operating" },
          { id: "4 unit usaha mencetak laba", en: "4 units profitable" },
          { id: "Satu unit usaha unggulan", en: "One flagship business unit" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [
          { id: "EWS monitoring aktif via PAKDE", en: "Active EWS monitoring via PAKDE" },
          { id: "Digitalisasi layanan anggota", en: "Digital member services" },
        ],
      },
    ],
  },

  // ── Level 9 ─────────────────────────────────────────────────────
  {
    id: "modern",
    tier: 9,
    labelEn: "Modern",
    labelId: "Modern",
    descEn: "Fully digital operations with advanced analytics.",
    descId: "Operasi digital penuh dengan analitik tingkat lanjut.",
    color: "#f97316",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    minXp: 80,
    maxXp: 89,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 400 anggota aktif", en: "At least 400 active members" },
          { id: "Tingkat partisipasi ≥ 92%", en: "Participation rate ≥ 92%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 3.5 Miliar", en: "Total assets ≥ Rp 3.5 Billion" },
          { id: "Seluruh rasio keuangan sehat", en: "All financial ratios healthy" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Sertifikasi pengurus tingkat provinsi", en: "Provincial-level management certification" },
          { id: "Transparansi laporan ke anggota", en: "Financial transparency to members" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Peringkat kesehatan dari Dinas: Sehat", en: "Office health rating: Healthy" },
          { id: "Koperasi berstatus aktif di SISKOP", en: "Active status in SISKOP" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "5+ unit usaha berjalan", en: "5+ business units operating" },
          { id: "Semua unit usaha mencetak laba", en: "All business units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [
          { id: "Analisis kelayakan via PAKDE", en: "Feasibility analysis via PAKDE" },
          { id: "Seluruh operasi via PAKDE", en: "Full operations via PAKDE" },
        ],
      },
    ],
  },

  // ── Level 10 ────────────────────────────────────────────────────
  {
    id: "teladan",
    tier: 10,
    labelEn: "Exemplary",
    labelId: "Teladan",
    descEn: "A model cooperative — top health score, an inspiration for others.",
    descId: "Koperasi teladan — skor kesehatan tertinggi, inspirasi bagi yang lain.",
    color: "#f59e0b",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    minXp: 90,
    maxXp: 100,
    aspects: [
      {
        aspectId: "membership",
        icon: "Users",
        labelEn: "Membership",
        labelId: "Keanggotaan",
        quests: [
          { id: "Minimal 500 anggota aktif", en: "At least 500 active members" },
          { id: "Tingkat partisipasi ≥ 95%", en: "Participation rate ≥ 95%" },
        ],
      },
      {
        aspectId: "financial",
        icon: "TrendingUp",
        labelEn: "Financial",
        labelId: "Keuangan",
        quests: [
          { id: "Total aset ≥ Rp 5 Miliar", en: "Total assets ≥ Rp 5 Billion" },
          { id: "SHU dibagikan tepat waktu", en: "SHU distributed on time" },
          { id: "Rasio kesehatan ≥ 90%", en: "Health score ≥ 90%" },
        ],
      },
      {
        aspectId: "governance",
        icon: "ShieldCheck",
        labelEn: "Governance",
        labelId: "Tata Kelola",
        quests: [
          { id: "Pengawas aktif dan independen", en: "Active & independent supervisors" },
          { id: "Anti-fraud policy diterapkan", en: "Anti-fraud policy enforced" },
        ],
      },
      {
        aspectId: "compliance",
        icon: "ClipboardCheck",
        labelEn: "Compliance",
        labelId: "Kepatuhan",
        quests: [
          { id: "Peringkat kesehatan dari Dinas: Sehat", en: "Office health rating: Healthy" },
          { id: "Sertifikasi koperasi modern", en: "Modern cooperative certification" },
        ],
      },
      {
        aspectId: "business",
        icon: "Building2",
        labelEn: "Business Units",
        labelId: "Unit Usaha",
        quests: [
          { id: "5+ unit usaha berjalan", en: "5+ business units operating" },
          { id: "Semua unit usaha mencetak laba", en: "All business units profitable" },
        ],
      },
      {
        aspectId: "technology",
        icon: "Monitor",
        labelEn: "Technology",
        labelId: "Teknologi",
        quests: [
          { id: "Feasibility & sensitivity via PAKDE", en: "Full feasibility & sensitivity via PAKDE" },
          { id: "Inovasi teknologi berkelanjutan", en: "Sustainable tech innovation" },
        ],
      },
    ],
  },
];
