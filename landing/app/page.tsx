export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
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
    <nav className="fixed top-0 z-50 w-full border-b border-slate-800/50 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          PAKDE
        </span>
        <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Fitur
          </a>
          <a href="#modules" className="hover:text-white transition-colors">
            Modul
          </a>
          <a href="#download" className="hover:text-white transition-colors">
            Download
          </a>
          <a
            href="https://github.com/okihita/PAKDE-tauri"
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-white transition-colors"
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)]" />
      <div className="relative z-10 max-w-2xl">
        <span className="inline-block rounded-full border border-emerald-800/50 bg-emerald-950/30 px-3 py-1 text-xxs font-medium text-emerald-400 mb-6">
          Offline-first Desktop App
        </span>
        <h1 className="text-6xl font-black tracking-tight sm:text-7xl">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">PAKDE</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-emerald-500/70 tracking-widest uppercase">
          Pengelolaan dan Akselerasi Koperasi Desa Elektronik
        </p>
        <p className="mt-8 text-base leading-relaxed text-slate-400 max-w-lg mx-auto">
          Aplikasi desktop untuk mengelola koperasi secara offline. Anggota, akuntansi, inventaris, penjualan, dan
          analisis keuangan — semua di perangkat Anda, tanpa internet.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <a
            href="#download"
            className="w-full sm:w-1/2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
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
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: "🏢",
      title: "Multi-Koperasi",
      desc: "Kelola beberapa koperasi dalam satu aplikasi. Setiap koperasi punya data terpisah — anggota, akun, transaksi masing-masing.",
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
      icon: "📈",
      title: "Analisis Kelayakan",
      desc: "Hitung NPV, IRR, BCR untuk proyek unit usaha. Proyeksi arus kas multi-tahun dengan analisis sensitivitas.",
    },
    {
      icon: "🏪",
      title: "Tata Letak Toko",
      desc: "Desain layout toko secara visual — rak, zona, penempatan barang. Seret & lepas untuk atur ulang.",
    },
    {
      icon: "🎓",
      title: "Modul Edukasi",
      desc: "Materi pembelajaran perkoperasian. Panduan RAT, manajemen keuangan, dan pengembangan usaha.",
    },
    {
      icon: "🔔",
      title: "EWS Alert",
      desc: "Early Warning System — deteksi dini masalah keuangan. Indikator kesehatan koperasi real-time.",
    },
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Fitur Utama</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            Semua yang dibutuhkan untuk mengelola koperasi modern — tanpa koneksi internet.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-colors"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.desc}</p>
            </div>
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
    <section className="px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Mulai dalam 3 Langkah</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950/50 border border-emerald-800/50 text-sm font-bold text-emerald-400 mb-4">
                {s.step}
              </div>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </div>
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
    <section id="modules" className="px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Modul Lengkap</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            16 modul terintegrasi — semua yang dibutuhkan pengurus koperasi dalam satu aplikasi.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <div key={m.name} className="rounded-lg border border-slate-800/50 bg-slate-900/30 px-4 py-3">
              <h4 className="text-xs font-semibold text-slate-300">{m.name}</h4>
              <p className="mt-1 text-xxs leading-relaxed text-slate-600">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfflineFirst() {
  return (
    <section className="px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full border border-emerald-800/50 bg-emerald-950/30 px-3 py-1 text-xxs font-medium text-emerald-400 mb-6">
          Offline-First
        </span>
        <h2 className="text-3xl font-bold tracking-tight">Bekerja Tanpa Internet</h2>
        <p className="mt-6 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto">
          PAKDE menyimpan semua data di perangkat Anda menggunakan SQLite. Tidak ada server, tidak ada cloud, tidak ada
          langganan. Buka aplikasi kapan saja — di desa dengan sinyal lemah sekalipun.
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
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
              <h4 className="text-sm font-semibold">{item.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EngineeringPhilosophy() {
  return (
    <section className="px-6 py-24 border-t border-slate-800/50 bg-[#0c0c0c]/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.03),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.03),transparent_60%)]" />
      <div className="mx-auto max-w-3xl text-center relative z-10">
        <span className="inline-block rounded-full border border-red-950/50 bg-red-950/20 px-3 py-1 text-xxs font-medium text-red-400 mb-6">
          {"Pilihan Arsitektur vs. Kenyamanan Developer"}
        </span>
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
          {"Mengapa Kami Menolak Tren Web & Mobile?"}
        </h2>
        <p className="mt-2 text-sm font-semibold text-red-500/70 tracking-widest uppercase">
          {"Sengaja Offline-First & Desktop, Bukan Sekadar CRUD Template Hackathon"}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto">
          Banyak tim hackathon secara instan membangun aplikasi web cloud atau mobile app karena itu adalah satu-satunya
          template teknologi yang biasa/nyaman mereka gunakan. Mereka mendesain untuk kenyamanan pengembang, bukan
          kebutuhan nyata pengguna di lapangan.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xl mx-auto">
          Tetapi koperasi desa tidak peduli dengan apa yang nyaman bagi kami. Mereka butuh keandalan saat sinyal 3G
          mati, memori HP penuh, dan komputer yang tersedia adalah PC lama dengan layar lebar.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 text-left">
          <div className="rounded-xl border border-red-900/20 bg-red-950/5 p-6 hover:border-red-900/40 transition-colors">
            <div className="text-xl mb-3">🛠️</div>
            <h4 className="text-sm font-bold text-red-400">Arsitektur Mainstream (Default Developer)</h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Membuat web SaaS online / React Native instan karena gampang di-copy-paste. Hasilnya? Aplikasi macet total
              di loading spinner saat sinyal hilang, membebani memori HP pengurus, dan tidak memiliki audit trail yang
              terpercaya.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/5 p-6 hover:border-emerald-900/50 transition-colors">
            <div className="text-xl mb-3">⚡</div>
            <h4 className="text-sm font-bold text-emerald-400">{"Arsitektur PAKDE (User-First & Kokoh)"}</h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Menempuh jalur engineering yang lebih matang: desktop-first native berukuran ~10MB berbasis Rust/Tauri
              dengan SQLite lokal terenkripsi. Bisa dijalankan sepenuhnya dari Flashdisk tanpa perlu instalasi rumit,
              100% offline, dan sangat ringan.
            </p>
          </div>
        </div>
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
    <section className="px-6 py-24 border-t border-slate-800/50 bg-[#080808]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Pilar Pengalaman Gamifikasi
          </h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto">
            Menyederhanakan pengelolaan koperasi desa yang rumit menjadi petualangan produktivitas yang interaktif dan
            menyenangkan.
          </p>
        </div>

        <div className="space-y-32">
          {pillars.map((p, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={p.title}
                className={`flex flex-col gap-12 lg:items-center ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"}`}
              >
                {/* Text Content */}
                <div className="flex-1 space-y-4">
                  <span className="inline-block rounded-full border border-emerald-800/40 bg-emerald-950/20 px-3 py-1 text-xxs font-semibold text-emerald-400 uppercase tracking-wider">
                    {p.badge}
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{p.desc}</p>
                </div>

                {/* Image Container with premium glassmorphism / shadow / borders */}
                <div className="flex-1">
                  <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl transition-all duration-350 hover:border-slate-700 hover:shadow-emerald-950/20 hover:shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-auto rounded-lg object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Download() {
  return (
    <section id="download" className="px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Unduh Sekarang</h2>
        <p className="mt-3 text-sm text-slate-500">{"Versi Terbaru 1.0.0 — Gratis, Ringan, & Open Source"}</p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 text-left">
          {/* Windows Download Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-350">
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
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-500">
                  <li>
                    <span className="text-slate-400">Unduh installer</span> dengan mengklik tombol di bawah.
                  </li>
                  <li>
                    <span className="text-slate-400">Jalankan file `.exe`</span> hasil unduhan.
                  </li>
                  <li>
                    Jika muncul peringatan Windows SmartScreen (*"Windows protected your PC"*), klik{" "}
                    <span className="text-slate-300 font-medium">"More info"</span> lalu pilih{" "}
                    <span className="text-emerald-400 font-medium">"Run anyway"</span>.
                  </li>
                </ol>
              </div>
            </div>
            <div className="mt-8">
              <a
                href="https://github.com/okihita/PAKDE-tauri/releases/download/v1.0.0/PAKDE_1.0.0_x64-setup.exe"
                className="block text-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
              >
                Unduh untuk Windows (.exe)
              </a>
            </div>
          </div>

          {/* macOS Download Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-350">
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
                  <span className="text-emerald-500">✓</span> UI performa tinggi berbasis Tauri v2
                </li>
              </ul>

              {/* macOS Installation Steps */}
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Langkah Instalasi:</h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-500">
                  <li>
                    <span className="text-slate-400">Unduh file `.dmg`</span> dengan mengklik tombol di bawah.
                  </li>
                  <li>
                    Buka file `.dmg` dan <span className="text-slate-400">tarik ikon PAKDE</span> ke dalam folder{" "}
                    <span className="text-slate-300">Applications</span>.
                  </li>
                  <li>
                    Bypass Gatekeeper: <span className="text-slate-300 font-medium">Klik kanan</span> aplikasi di
                    Applications, pilih <span className="text-slate-300 font-medium">Open</span>, lalu konfirmasi{" "}
                    <span className="text-emerald-400 font-medium">Open</span>. (Atau jalankan{" "}
                    <code className="bg-slate-950 px-1 py-0.5 rounded text-red-400 text-xxs font-mono">
                      xattr -cr /Applications/PAKDE.app
                    </code>{" "}
                    di Terminal).
                  </li>
                </ol>
              </div>
            </div>
            <div className="mt-8">
              <a
                href="https://github.com/okihita/PAKDE-tauri/releases/download/v1.0.0/PAKDE_1.0.0_universal.dmg"
                className="block text-center rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              >
                Unduh untuk macOS (.dmg)
              </a>
            </div>
          </div>
        </div>
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
          <a href="https://github.com/okihita/PAKDE-tauri" className="hover:text-slate-400 transition-colors">
            GitHub
          </a>
          <a
            href="https://github.com/okihita/PAKDE-tauri/blob/main/LICENSE"
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
