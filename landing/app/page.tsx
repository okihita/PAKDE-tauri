import Reveal from "./reveal";
import InstallGuide from "./install-guide";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070707] text-slate-200">
      {/* Ambient global backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute top-[-10%] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-[130px]" />
      </div>

      <Nav />
      <Hero />
      <Features />
      <VisualShowcase />
      <HowItWorks />
      <Modules />
      <OfflineFirst />
      <EngineeringPhilosophy />
      <Download />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-[#070707]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="flex items-center gap-2 text-lg font-black tracking-tight">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(16,185,129,0.7)]" />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">PAKDE</span>
        </span>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#features" className="hidden hover:text-white transition-colors sm:inline">
            Fitur
          </a>
          <a href="#modules" className="hidden hover:text-white transition-colors sm:inline">
            Modul
          </a>
          <a href="#download" className="hover:text-white transition-colors">
            Download
          </a>
          <a
            href="https://github.com/okihita/PAKDE"
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-emerald-500/60 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-14 text-center">
      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-[22%] h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl animate-float" />
        <div className="absolute right-[14%] top-[30%] h-56 w-56 rounded-full bg-teal-500/10 blur-3xl animate-float-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.10),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <span className="inline-block rounded-full border border-emerald-800/50 bg-emerald-950/30 px-3 py-1 text-xxs font-medium text-emerald-400 mb-6">
          Panduan Harian • 100% Offline
        </span>
        <h1 className="animate-gradient bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
          PAKDE
        </h1>
        <p className="mt-1 text-sm font-medium text-emerald-500/70 tracking-widest uppercase">
          Pengelolaan dan Akselerasi Koperasi Desa Elektronik
        </p>
        <p className="mt-8 text-base leading-relaxed text-slate-400 max-w-lg mx-auto text-balance">
          Koperasi desa sering kehilangan jejak karena sinyal buruk, PC tua, dan pengurus yang sibuk. PAKDE menjalankan
          100% offline, memandu pengurus tiap hari, dan menyimpan seluruh data ke Flashdisk — akuntansi, anggota, &amp;
          laporan RAT otomatis.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <a
            href="#download"
            className="group relative w-full overflow-hidden sm:w-1/2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
            <span className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20 blur-md group-hover:animate-shine" />
            <span>💻 Download Windows</span>
          </a>
          <a
            href="#download"
            className="w-full sm:w-1/2 rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <span>🍎 Download macOS</span>
          </a>
        </div>
        <p className="mt-4 text-xxs text-slate-500">
          {"Installer hanya ~10MB • File data <1MB • Bisa diinstal & dijalankan lewat Flashdisk"}
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600">
        <span className="text-xxs uppercase tracking-[0.3em]">Scroll</span>
        <span className="flex h-8 w-5 items-start justify-center rounded-full border border-slate-700 p-1">
          <span className="h-2 w-1 rounded-full bg-emerald-400 animate-scroll-cue" />
        </span>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: "💾",
      title: "Simpan & Muat (Flashdisk)",
      desc: "Bawa seluruh database koperasi ke Flashdisk. Backup, pindah antar PC, dan lanjutkan kerja di mana saja — 100% offline, tanpa server.",
    },
    {
      icon: "🧭",
      title: "Panduan Harian",
      desc: "Gamifikasi yang memandu pengurus tiap hari: tahu harus apa, ada progress, dan naik level kesehatan koperasi secara konsisten.",
    },
    {
      icon: "📊",
      title: "Akuntansi Ganda",
      desc: "Double-entry accounting dengan Chart of Accounts (COA) lengkap. Jurnal umum, buku besar, dan laporan keuangan otomatis.",
    },
    {
      icon: "👥",
      title: "Manajemen Anggota",
      desc: "Catat NIK, simpanan pokok/wajib/sukarela, pinjaman, dan status keanggotaan. Riwayat lengkap per anggota.",
    },
    {
      icon: "📦",
      title: "Inventaris & Penjualan",
      desc: "Unit usaha pupuk, apotek, pemasaran — kelola stok, harga pokok, harga jual, dan riwayat transaksi penjualan.",
    },
    {
      icon: "🎓",
      title: "Modul Edukasi",
      desc: "Materi pembelajaran perkoperasian. Panduan RAT, manajemen keuangan, dan pengembangan usaha.",
    },
    {
      icon: "📈",
      title: "Analisis Kelayakan",
      desc: "Hitung NPV, IRR, BCR untuk proyek unit usaha. Proyeksi arus kas multi-tahun dengan analisis sensitivitas.",
    },
    {
      icon: "🏢",
      title: "Multi-Koperasi",
      desc: "Kelola beberapa koperasi dalam satu aplikasi. Setiap koperasi punya data terpisah — anggota, akun, transaksi masing-masing.",
    },
  ];

  return (
    <section id="features" className="relative px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <span className="text-xxs font-semibold uppercase tracking-[0.3em] text-emerald-500/70">Fitur</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Fitur Utama</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            Semua yang dibutuhkan untuk mengelola koperasi modern — tanpa koneksi internet.
          </p>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f, idx) => (
            <Reveal key={f.title} delay={idx * 70}>
              <div className="group relative h-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900/80">
                <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-xl">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Download & Install",
      desc: "Unduh aplikasi untuk Windows atau macOS. Jalankan installer — tidak perlu setup database atau server.",
    },
    {
      step: "2",
      title: "Buat Profil Koperasi",
      desc: "Isi nama, alamat, pengurus. Pilih unit usaha. Akun COA dan data awal otomatis dibuat.",
    },
    {
      step: "3",
      title: "Mulai Kelola",
      desc: "Input anggota, catat transaksi, pantau keuangan. Semua data tersimpan lokal di perangkat Anda.",
    },
  ];

  return (
    <section className="relative px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <span className="text-xxs font-semibold uppercase tracking-[0.3em] text-emerald-500/70">Cara Kerja</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mulai dalam 3 Langkah</h2>
        </Reveal>
        <div className="relative grid gap-10 sm:grid-cols-3">
          {/* connecting line on desktop */}
          <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-emerald-700/50 to-transparent sm:block" />
          {steps.map((s, idx) => (
            <Reveal key={s.step} delay={idx * 120} className="relative text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-700/60 bg-[#070707] text-sm font-bold text-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.6)]">
                {s.step}
              </div>
              <h3 className="mt-5 text-sm font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Modules() {
  const modules = [
    { name: "Dashboard", desc: "Ringkasan kesehatan koperasi, alert, jumlah anggota, kalender kegiatan." },
    { name: "Statistik", desc: "Visualisasi data keuangan dan keanggotaan." },
    { name: "Ranking", desc: "Peringkat unit usaha berdasarkan performa." },
    { name: "Leveling", desc: "Level koperasi berdasarkan indikator kesehatan." },
    { name: "Unit Usaha", desc: "Kelola unit pupuk, simpan pinjam, apotek, penggilingan." },
    { name: "Peralatan", desc: "Aset dan alat produksi beserta penyusutan." },
    { name: "Penjualan", desc: "Transaksi harian unit toko dan inventaris." },
    { name: "Tata Letak", desc: "Desain visual layout toko/rak." },
    { name: "Pengembangan", desc: "Proyek investasi dan analisis kelayakan." },
    { name: "Akuntansi", desc: "Chart of Accounts, jurnal, buku besar, laporan." },
    { name: "Anggota", desc: "Data anggota, simpanan, pinjaman." },
    { name: "Acara", desc: "Perencanaan RAT dan acara koperasi." },
    { name: "Dampak", desc: "Pengukuran dampak sosial koperasi." },
    { name: "Partisipasi", desc: "Tingkat partisipasi anggota." },
    { name: "Sinkronisasi", desc: "Sinkronisasi data ke server pusat (coming soon)." },
    { name: "Pengaturan", desc: "Tema, font, reset, konfigurasi koperasi." },
  ];

  return (
    <section id="modules" className="relative px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-16">
          <span className="text-xxs font-semibold uppercase tracking-[0.3em] text-emerald-500/70">Ekosistem</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Modul Lengkap</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            16 modul terintegrasi — semua yang dibutuhkan pengurus koperasi dalam satu aplikasi.
          </p>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m, idx) => (
            <Reveal key={m.name} delay={(idx % 4) * 60}>
              <div className="group h-full rounded-lg border border-slate-800/50 bg-slate-900/30 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-950/10">
                <h4 className="text-xs font-semibold text-slate-200 transition-colors group-hover:text-emerald-300">
                  {m.name}
                </h4>
                <p className="mt-1 text-xxs leading-relaxed text-slate-600">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfflineFirst() {
  return (
    <section className="relative px-6 py-24 border-t border-slate-800/50">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/5 blur-[100px]" />
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="inline-block rounded-full border border-emerald-800/50 bg-emerald-950/30 px-3 py-1 text-xxs font-medium text-emerald-400 mb-6">
            Offline-First
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Bekerja Tanpa Internet</h2>
          <p className="mt-6 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto text-balance">
            PAKDE menyimpan semua data di perangkat Anda menggunakan SQLite. Tidak ada server, tidak ada cloud, tidak
            ada langganan. Buka aplikasi kapan saja — di desa dengan sinyal lemah sekalipun.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3 text-left">
            {[
              {
                title: "SQLite Lokal",
                desc: "Database ringan tersimpan di perangkat. Cepat, andal, tidak perlu koneksi.",
              },
              {
                title: "Privasi Penuh",
                desc: "Data koperasi hanya ada di komputer Anda. Tidak dikirim ke pihak manapun.",
              },
              {
                title: "Sync Opsional",
                desc: "Sinkronisasi ke server tersedia sebagai fitur tambahan — bukan keharusan.",
              },
            ].map((item, idx) => (
              <Reveal key={item.title} delay={idx * 100}>
                <div className="group h-full rounded-xl border border-slate-800 bg-slate-900/30 p-5 transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/60">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function EngineeringPhilosophy() {
  return (
    <section className="relative overflow-hidden border-t border-slate-800/50 bg-[#0c0c0c]/50 px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.05),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.05),transparent_60%)]" />
      <div className="mx-auto max-w-3xl text-center relative z-10">
        <Reveal>
          <span className="inline-block rounded-full border border-red-950/50 bg-red-950/20 px-3 py-1 text-xxs font-medium text-red-400 mb-6">
            {"Pilihan Arsitektur vs. Kenyamanan Developer"}
          </span>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
            {"Mengapa Kami Menolak Tren Web & Mobile?"}
          </h2>
          <p className="mt-2 text-sm font-semibold text-red-500/70 tracking-widest uppercase">
            {"Sengaja Offline-First & Desktop, Bukan Sekadar CRUD Template Hackathon"}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto text-balance">
            Banyak tim hackathon secara instan membangun aplikasi web cloud atau mobile app karena itu adalah
            satu-satunya template teknologi yang biasa/nyaman mereka gunakan. Mereka mendesain untuk kenyamanan
            pengembang, bukan kebutuhan nyata pengguna di lapangan.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto text-balance">
            Tetapi koperasi desa tidak peduli dengan apa yang nyaman bagi kami. Mereka butuh keandalan saat sinyal 3G
            mati, memori HP penuh, dan komputer yang tersedia adalah PC lama dengan layar lebar.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 text-left">
            <Reveal>
              <div className="h-full rounded-xl border border-red-900/20 bg-red-950/5 p-6 transition-colors duration-300 hover:border-red-900/40">
                <div className="text-xl mb-3">🛠️</div>
                <h4 className="text-sm font-bold text-red-400">Arsitektur Mainstream (Default Developer)</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Membuat web SaaS online / React Native instan karena gampang di-copy-paste. Hasilnya? Aplikasi macet
                  total di loading spinner saat sinyal hilang, membebani memori HP pengurus, dan tidak memiliki audit
                  trail yang terpercaya.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-xl border border-emerald-900/30 bg-emerald-950/5 p-6 transition-colors duration-300 hover:border-emerald-900/50">
                <div className="text-xl mb-3">⚡</div>
                <h4 className="text-sm font-bold text-emerald-400">{"Arsitektur PAKDE (User-First & Kokoh)"}</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Menempuh jalur engineering yang lebih matang: desktop-first native berukuran ~10MB berbasis Rust
                  dengan SQLite lokal terenkripsi. Bisa dijalankan sepenuhnya dari Flashdisk tanpa perlu instalasi
                  rumit, 100% offline, dan sangat ringan.
                </p>
              </div>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function VisualShowcase() {
  const pillars = [
    {
      title: "Demo Exploration",
      badge: "Onboarding Tanpa Hambatan",
      desc: "Merasakan seluruh fitur operasional secara langsung. Pengurus dapat memilih untuk memulai dari nol atau memuat akun demo simulasi dengan tingkat kesulitan berbeda untuk mempelajari fitur yang kaya data.",
      image: "/images/demo-exploration.png",
    },
    {
      title: "Sense of Direction",
      badge: "Hub Misi (Quest Hub)",
      desc: "Pengurus koperasi tidak butuh buku panduan yang tebal; mereka hanya perlu tahu apa yang harus dilakukan sekarang. Tugas harian dan kepatuhan hukum diterjemahkan menjadi Misi Harian, Mingguan, dan Utama. Setiap misi memiliki tautan satu klik langsung ke form pengisian terkait.",
      image: "/images/sense-of-direction.png",
    },
    {
      title: "Sense of Progress",
      badge: "Aspek Koperasi & XP",
      desc: "Pantau peningkatan kelas koperasi Anda secara real-time di 6 aspek operasional (Keuangan, Anggota, Ritel Waserda, dll.). Setiap penyelesaian misi memberikan XP yang menaikkan level kesehatan koperasi.",
      image: "/images/sense-of-progress.png",
    },
    {
      title: "Social Competition",
      badge: "Papan Peringkat & Podium Daerah",
      desc: "Memicu motivasi pengurus dengan membandingkan skor kesehatan koperasi dengan desa/kecamatan lain melalui papan peringkat interaktif dan sistem podium juara regional.",
      image: "/images/social-competition.png",
    },
  ];

  return (
    <section className="relative px-6 py-24 border-t border-slate-800/50 bg-[#080808]">
      <div className="pointer-events-none absolute right-[5%] top-[8%] h-64 w-64 rounded-full bg-emerald-600/8 blur-[110px]" />
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center mb-20">
          <span className="text-xxs font-semibold uppercase tracking-[0.3em] text-emerald-500/70">Gamifikasi</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Pilar Pengalaman Gamifikasi
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            Menyederhanakan pengelolaan koperasi desa yang rumit menjadi petualangan produktivitas yang interaktif dan
            menyenangkan.
          </p>
        </Reveal>

        <div className="space-y-28">
          {pillars.map((p, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <Reveal key={p.title}>
                <div
                  className={`relative flex flex-col gap-10 lg:items-center ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"}`}
                >
                  {/* Text Content */}
                  <div className="flex-1 space-y-4">
                    <span className="font-mono text-xs font-semibold text-emerald-500/60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="ml-3 inline-block rounded-full border border-emerald-800/40 bg-emerald-950/20 px-3 py-1 text-xxs font-semibold text-emerald-400 uppercase tracking-wider">
                      {p.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{p.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400 text-balance">{p.desc}</p>
                  </div>

                  {/* Image Container with premium glassmorphism / shadow / borders */}
                  <div className="flex-1">
                    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl transition-all duration-300 hover:border-emerald-700/60 hover:shadow-[0_25px_60px_-15px_rgba(16,185,129,0.25)]">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-auto rounded-lg object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section id="download" className="relative px-6 py-24 border-t border-slate-800/50">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-600/5 blur-[120px]" />
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Unduh Sekarang</h2>
          <p className="mt-3 text-sm text-slate-500">{"Versi Terbaru 1.0.3 — Gratis, Ringan, & Open Source"}</p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 text-left">
            {/* Windows Download Card */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/80">
              <div>
                <div className="text-4xl mb-4">💻</div>
                <h3 className="text-lg font-bold text-white">Windows</h3>
                <p className="mt-1 text-xs text-slate-500">{"Windows 7, 8, 10, 11 • 32-bit & 64-bit"}</p>
                <ul className="mt-6 space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Installer ringan (.exe)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> {"Bisa disalin & diinstal offline via USB"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Optimal untuk PC berspesifikasi rendah
                  </li>
                </ul>

                {/* Windows Installation Steps */}
                <div className="mt-8 border-t border-slate-800/80 pt-6">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Langkah Instalasi:</h4>
                  <InstallGuide className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                    Lihat panduan instalasi →
                  </InstallGuide>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="https://github.com/okihita/PAKDE/releases/download/v1.0.3/PAKDE_1.0.3_x64-setup.exe"
                  className="group/btn relative block overflow-hidden rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors"
                >
                  <span className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20 blur-md group-hover/btn:animate-shine" />
                  <span className="relative">Unduh untuk Windows (.exe)</span>
                </a>
              </div>
            </div>

            {/* macOS Download Card */}
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 flex flex-col justify-between transition-all duration-300 hover:border-emerald-500/40 hover:bg-slate-900/80">
              <div>
                <div className="text-4xl mb-4">🍎</div>
                <h3 className="text-lg font-bold text-white">macOS</h3>
                <p className="mt-1 text-xs text-slate-500">{"Apple Silicon & Intel • macOS 12+"}</p>
                <ul className="mt-6 space-y-2 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Universal Binary (.dmg)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Dukungan penuh untuk chip M1/M2/M3
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> UI performa tinggi berbasis desktop native
                  </li>
                </ul>

                {/* macOS Installation Steps */}
                <div className="mt-8 border-t border-slate-800/80 pt-6">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Langkah Instalasi:</h4>
                  <InstallGuide className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300">
                    Lihat panduan instalasi →
                  </InstallGuide>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="https://github.com/okihita/PAKDE/releases/download/v1.0.3/PAKDE_1.0.3_universal.dmg"
                  className="block text-center rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                >
                  Unduh untuk macOS (.dmg)
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-800/50 px-6 py-10">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            PAKDE
          </span>
          <span>— Pengelolaan dan Akselerasi Koperasi Desa Elektronik</span>
        </div>
        <div className="flex gap-6">
          <a href="https://github.com/okihita/PAKDE" className="hover:text-slate-400 transition-colors">
            GitHub
          </a>
          <a
            href="https://github.com/okihita/PAKDE/blob/main/LICENSE"
            className="hover:text-slate-400 transition-colors"
          >
            MIT License
          </a>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
