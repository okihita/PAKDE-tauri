// ── Context-aware task seeding based on cooperative level ──

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

/**
 * Generate initial main quests and weekly tasks based on the cooperative's
 * health score (level) and any missing profile fields.
 */
export function getInitialTasksForCoop(
  healthScore: number,
  missingProfileFields: string[],
): { mainQuests: Todo[]; weeklyQuests: Todo[] } {
  const mainQuests: Todo[] = [];
  const weeklyQuests: Todo[] = [];

  // ── Rintisan (Level 1: healthScore < 10) ──
  if (healthScore < 10) {
    mainQuests.push(
      { id: "q1", text: "Tambahkan minimal 5 anggota koperasi", done: false },
      { id: "q2", text: "Daftarkan unit usaha koperasi Anda", done: false },
      { id: "q3", text: "Siapkan struktur pengurus (ketua, sekretaris, bendahara)", done: false },
      { id: "q4", text: "Pelajari dashboard dan fitur-fitur PAKDE", done: false },
    );
    if (missingProfileFields.includes("address")) {
      mainQuests.push({ id: "q5", text: "Lengkapi alamat koperasi di Pengaturan", done: false });
    }
    weeklyQuests.push(
      { id: "w1", text: "Catat transaksi kas harian pertama", done: false },
      { id: "w2", text: "Perbarui data anggota (status aktif/nonaktif)", done: false },
      { id: "w3", text: "Tinjau saldo simpanan anggota", done: false },
      { id: "w4", text: "Hadiri sesi pembelajaran di modul Belajar", done: false },
    );
  }
  // ── Pemula (Level 2: healthScore 10-19) ──
  else if (healthScore < 20) {
    mainQuests.push(
      { id: "q1", text: "Tambahkan minimal 10 anggota koperasi", done: false },
      { id: "q2", text: "Aktifkan unit simpan pinjam", done: false },
      { id: "q3", text: "Catat jurnal akuntansi bulan ini", done: false },
    );
    weeklyQuests.push(
      { id: "w1", text: "Lakukan pencatatan transaksi minimal 5 kali", done: false },
      { id: "w2", text: "Cek laporan keuangan di modul Akuntansi", done: false },
      { id: "w3", text: "Perbarui profil koperasi di Pengaturan", done: false },
      { id: "w4", text: "Tambahkan 3 anggota baru ke database", done: false },
    );
  }
  // ── Bertumbuh (Level 3: healthScore 20-29) ──
  else if (healthScore < 30) {
    mainQuests.push(
      { id: "q1", text: "Gambarkan tata letak toko Waserda pertama", done: false },
      { id: "q2", text: "Buat unit usaha kedua", done: false },
      { id: "q3", text: "Buat laporan keuangan bulanan", done: false },
    );
    weeklyQuests.push(
      { id: "w1", text: "Rekonsiliasi saldo kas mingguan", done: false },
      { id: "w2", text: "Tinjau partisipasi anggota dalam kegiatan", done: false },
      { id: "w3", text: "Lakukan sinkronisasi data dengan kabupaten", done: false },
      { id: "w4", text: "Evaluasi unit usaha yang sudah berjalan", done: false },
    );
  }
  // ── Produktif (Level 4: healthScore 30-39) ──
  else if (healthScore < 40) {
    mainQuests.push(
      { id: "q1", text: "Buat laporan SHU tahunan", done: false },
      { id: "q2", text: "Lakukan studi kelayakan untuk unit usaha baru", done: false },
      { id: "q3", text: "Analisis rasio keuangan koperasi", done: false },
    );
    weeklyQuests.push(
      { id: "w1", text: "Tinjau peringkat koperasi di modul Peringkat", done: false },
      { id: "w2", text: "Catat transaksi penjualan di modul Penjualan", done: false },
      { id: "w3", text: "Perbarui tata letak toko berdasarkan penjualan", done: false },
      { id: "w4", text: "Cek alert EWS dan ambil tindakan", done: false },
    );
  }
  // ── Mapan (Level 5: healthScore 40-49) ──
  else if (healthScore < 50) {
    mainQuests.push(
      { id: "q1", text: "Buat Rapat Anggota Tahunan: persiapkan agenda", done: false },
      { id: "q2", text: "Evaluasi kelayakan proyek baru", done: false },
      { id: "q3", text: "Optimalkan portofolio pinjaman anggota", done: false },
    );
    weeklyQuests.push(
      { id: "w1", text: "Audit internal laporan keuangan minggu ini", done: false },
      { id: "w2", text: "Lakukan analisis sensitivitas unit usaha", done: false },
      { id: "w3", text: "Periksa outstanding pinjaman anggota aktif", done: false },
    );
  }
  // ── Tangguh–Teladan (Level 6+): Advanced ──
  else {
    mainQuests.push(
      { id: "q1", text: "Laporan SHU bulan ini harus disetor sebelum tanggal 10", done: false },
      { id: "q2", text: "Rapat Anggota Tahunan: persiapkan agenda", done: false },
      { id: "q3", text: "Cek outstanding pinjaman anggota aktif", done: false },
      { id: "q4", text: "Sinkronkan data ke dashboard nasional", done: false },
    );
    weeklyQuests.push(
      { id: "w1", text: "Lakukan pencatatan transaksi minimal 5 kali", done: false },
      { id: "w2", text: "Tambahkan 3 anggota baru ke database", done: false },
      { id: "w3", text: "Perbarui profil koperasi di Pengaturan", done: false },
      { id: "w4", text: "Lakukan sinkronisasi data dengan kabupaten", done: false },
      { id: "w5", text: "Cek laporan keuangan di modul Akuntansi", done: false },
      { id: "w6", text: "Tinjau alert EWS dan ambil tindakan", done: false },
      { id: "w7", text: "Evaluasi kelayakan finansial koperasi", done: false },
    );
  }

  return { mainQuests, weeklyQuests };
}
