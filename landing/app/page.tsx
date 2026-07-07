export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Modules />
      <OfflineFirst />
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
          Pengelola Administrasi Koperasi Desa
        </p>
        <p className="mt-8 text-base leading-relaxed text-slate-400 max-w-lg mx-auto">
          Aplikasi desktop untuk mengelola koperasi secara offline. Anggota, akuntansi, inventaris, penjualan, dan
          analisis keuangan — semua di perangkat Anda, tanpa internet.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#download"
            className="w-full sm:w-auto rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            Download untuk macOS
          </a>
          <a
            href="https://github.com/okihita/PAKDE-tauri"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto rounded-lg border border-slate-700 px-8 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Source Code
          </a>
        </div>
        <p className="mt-4 text-xxs text-slate-600">Windows & Linux coming soon</p>
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
      desc: "Unduh aplikasi untuk macOS. Jalankan installer — tidak perlu setup database atau server.",
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

function Download() {
  return (
    <section id="download" className="px-6 py-24 border-t border-slate-800/50">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Unduh Sekarang</h2>
        <p className="mt-3 text-sm text-slate-500">Tersedia untuk macOS. Windows dan Linux segera hadir.</p>
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <div className="flex items-center justify-center gap-3 text-4xl mb-4">🍎</div>
          <h3 className="text-lg font-semibold">macOS</h3>
          <p className="mt-1 text-xs text-slate-500">Apple Silicon & Intel • macOS 12+</p>
          <a
            href="https://github.com/okihita/PAKDE-tauri/releases/latest"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-colors"
          >
            Download .dmg
          </a>
          <p className="mt-3 text-xxs text-slate-600">Versi 0.5.0 — Gratis, open source</p>
        </div>
        <div className="mt-8 flex justify-center gap-8 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            Windows (coming soon)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            Linux (coming soon)
          </span>
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
          <span>— Pengelola Administrasi Koperasi Desa</span>
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
