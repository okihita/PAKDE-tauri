/* eslint-disable local/max-lines-per-file */
import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Learn.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, CheckCircle2, Circle, Lock, Star, Trophy, ArrowRight, ArrowLeft } from "lucide-react";

interface Question {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonDef {
  name: string;
  questions: Question[];
}

interface ModuleDef {
  id: string;
  title: string;
  desc: string;
  lessons: LessonDef[];
}

// ── Bank Soal ─────────────────────────────────────────────────────

const MODULES: ModuleDef[] = [
  {
    id: "mod1",
    title: "Dasar-Dasar Koperasi",
    desc: "Pahami prinsip, sejarah, dan struktur organisasi koperasi.",
    lessons: [
      {
        name: "Apa itu Koperasi",
        questions: [
          {
            question: "Apa kepanjangan dari SHU?",
            choices: ["Sisa Hasil Usaha", "Simpanan Harian Umum", "Sumber Hasil Utama", "Standar Hasil Unit"],
            correctIndex: 0,
            explanation:
              "SHU adalah Sisa Hasil Usaha, yaitu selisih antara pendapatan dan biaya koperasi dalam satu tahun buku.",
          },
          {
            question: "Koperasi berasal dari kata 'cooperation' yang berarti?",
            choices: ["Kerja sama", "Persaingan", "Keuntungan", "Perkumpulan"],
            correctIndex: 0,
            explanation:
              "Koperasi berasal dari kata cooperation yang berarti kerja sama. Prinsip utamanya adalah gotong royong.",
          },
          {
            question: "Siapa yang dianggap sebagai Bapak Koperasi Indonesia?",
            choices: ["Mohammad Hatta", "Soekarno", "Soeharto", "Ki Hajar Dewantara"],
            correctIndex: 0,
            explanation:
              "Mohammad Hatta, Wakil Presiden pertama RI, mendapat gelar Bapak Koperasi Indonesia atas jasanya mengembangkan gerakan koperasi.",
          },
          {
            question: "Landasan struktural koperasi Indonesia adalah?",
            choices: ["UUD 1945 Pasal 33", "UUD 1945 Pasal 28", "UU No. 25/1992", "Pancasila"],
            correctIndex: 0,
            explanation:
              "Pasal 33 UUD 1945 menyatakan bahwa perekonomian disusun sebagai usaha bersama berdasar atas asas kekeluargaan.",
          },
          {
            question: "Koperasi di Indonesia berasaskan?",
            choices: ["Kekeluargaan", "Individualisme", "Kapitalisme", "Liberalisme"],
            correctIndex: 0,
            explanation: "Koperasi Indonesia berasaskan kekeluargaan sesuai UUD 1945 Pasal 33 dan Pancasila.",
          },
        ],
      },
      {
        name: "Prinsip-Prinsip Koperasi",
        questions: [
          {
            question: "Berapa jumlah prinsip koperasi menurut ICA (International Cooperative Alliance)?",
            choices: ["7", "5", "10", "3"],
            correctIndex: 0,
            explanation:
              "ICA menetapkan 7 prinsip koperasi: keanggotaan sukarela dan terbuka, kontrol anggota demokratis, partisipasi ekonomi anggota, otonomi dan kemandirian, pendidikan-pelatihan-informasi, kerja sama antar koperasi, dan kepedulian terhadap komunitas.",
          },
          {
            question: "Prinsip 'satu anggota satu suara' termasuk dalam prinsip koperasi yang mana?",
            choices: [
              "Kontrol Anggota Demokratis",
              "Keanggotaan Sukarela dan Terbuka",
              "Partisipasi Ekonomi Anggota",
              "Otonomi dan Kemandirian",
            ],
            correctIndex: 0,
            explanation:
              "Prinsip kontrol anggota demokratis berarti setiap anggota memiliki hak suara yang sama dalam rapat anggota (one member one vote).",
          },
          {
            question: "Rapat Anggota Tahunan (RAT) merupakan implementasi dari prinsip?",
            choices: [
              "Kontrol Anggota Demokratis",
              "Partisipasi Ekonomi Anggota",
              "Pendidikan dan Informasi",
              "Otonomi dan Kemandirian",
            ],
            correctIndex: 0,
            explanation:
              "RAT adalah forum tertinggi pengambilan keputusan koperasi, mewujudkan prinsip kontrol demokratis oleh anggota.",
          },
          {
            question: "Prinsip yang mendorong koperasi untuk menyisihkan dana pendidikan anggota adalah?",
            choices: [
              "Pendidikan, Pelatihan, dan Informasi",
              "Partisipasi Ekonomi Anggota",
              "Kepedulian terhadap Komunitas",
              "Kerja Sama antar Koperasi",
            ],
            correctIndex: 0,
            explanation:
              "Prinsip ke-5 ICA: koperasi menyelenggarakan pendidikan dan pelatihan bagi anggota, pengurus, dan karyawan.",
          },
          {
            question: "Prinsip koperasi manakah yang mendorong kolaborasi antar koperasi?",
            choices: [
              "Kerja Sama antar Koperasi",
              "Otonomi dan Kemandirian",
              "Kontrol Anggota Demokratis",
              "Kepedulian terhadap Komunitas",
            ],
            correctIndex: 0,
            explanation:
              "Prinsip ke-6 ICA: koperasi melayani anggotanya paling efektif dengan bekerja sama melalui struktur lokal, nasional, regional, dan internasional.",
          },
        ],
      },
      {
        name: "Struktur Organisasi",
        questions: [
          {
            question: "Kekuasaan tertinggi dalam koperasi berada pada?",
            choices: ["Rapat Anggota", "Pengurus", "Pengawas", "Manajer"],
            correctIndex: 0,
            explanation:
              "Rapat Anggota adalah pemegang kekuasaan tertinggi dalam koperasi. Pengurus dan Pengawas dipilih dan bertanggung jawab kepada Rapat Anggota.",
          },
          {
            question: "Siapa yang bertugas mengawasi jalannya koperasi?",
            choices: ["Pengawas", "Pengurus", "Manajer", "Ketua"],
            correctIndex: 0,
            explanation:
              "Pengawas dipilih oleh Rapat Anggota untuk mengawasi pelaksanaan kebijakan oleh Pengurus. Pengawas tidak boleh merangkap sebagai Pengurus.",
          },
          {
            question: "Pengurus koperasi minimal terdiri dari berapa orang?",
            choices: ["3 orang", "1 orang", "5 orang", "7 orang"],
            correctIndex: 0,
            explanation:
              "Sesuai UU Perkoperasian, pengurus minimal terdiri dari 3 orang: Ketua, Sekretaris, dan Bendahara.",
          },
          {
            question: "RAT wajib diselenggarakan paling lambat?",
            choices: [
              "6 bulan setelah tutup buku",
              "3 bulan setelah tutup buku",
              "1 tahun setelah tutup buku",
              "Setiap akhir tahun",
            ],
            correctIndex: 0,
            explanation: "Rapat Anggota Tahunan wajib diadakan paling lambat 6 bulan setelah tahun buku berakhir.",
          },
          {
            question: "Siapa yang berwenang mengangkat dan memberhentikan Manajer Koperasi?",
            choices: ["Pengurus", "Anggota", "Pengawas", "Dinas Koperasi"],
            correctIndex: 0,
            explanation:
              "Pengurus berwenang mengangkat dan memberhentikan Manajer sebagai pelaksana harian operasional koperasi.",
          },
        ],
      },
      {
        name: "Hak dan Kewajiban Anggota",
        questions: [
          {
            question: "Apa hak utama anggota koperasi dalam Rapat Anggota?",
            choices: [
              "Satu suara per anggota",
              "Suara berdasarkan modal",
              "Suara berdasarkan jabatan",
              "Diwakilkan oleh pengurus",
            ],
            correctIndex: 0,
            explanation:
              "Setiap anggota memiliki satu suara (one member one vote), tidak dipengaruhi oleh besar modal yang disetorkan.",
          },
          {
            question: "Kewajiban anggota koperasi yang paling mendasar adalah?",
            choices: [
              "Membayar simpanan pokok dan wajib",
              "Menjadi pengurus",
              "Mengajukan pinjaman",
              "Menghadiri setiap rapat harian",
            ],
            correctIndex: 0,
            explanation:
              "Kewajiban dasar anggota adalah membayar simpanan pokok (sekali saat masuk) dan simpanan wajib (berkala) sesuai ketentuan.",
          },
          {
            question: "Anggota yang tidak aktif selama jangka waktu tertentu dapat?",
            choices: ["Diberhentikan", "Diberi sanksi denda saja", "Tetap menjadi anggota selamanya", "Naik pangkat"],
            correctIndex: 0,
            explanation:
              "Anggota yang tidak memenuhi kewajibannya dalam jangka waktu yang ditentukan AD/ART dapat diberhentikan melalui keputusan Rapat Anggota.",
          },
          {
            question: "Apakah anggota koperasi berhak mendapatkan SHU?",
            choices: ["Ya, sesuai partisipasi", "Tidak pernah", "Hanya pengurus yang dapat", "Hanya anggota lama"],
            correctIndex: 0,
            explanation:
              "Setiap anggota berhak atas pembagian SHU yang besarnya proporsional terhadap partisipasi dan transaksi anggota dengan koperasi.",
          },
          {
            question: "Keanggotaan koperasi bersifat?",
            choices: ["Sukarela dan terbuka", "Dipaksa dan tertutup", "Turun-temurun", "Berdasarkan rekomendasi"],
            correctIndex: 0,
            explanation:
              "Sesuai prinsip ICA pertama: keanggotaan koperasi bersifat sukarela dan terbuka, tanpa diskriminasi.",
          },
        ],
      },
    ],
  },
  {
    id: "mod2",
    title: "Manajemen Keuangan",
    desc: "Kelola keuangan koperasi dengan baik dan benar.",
    lessons: [
      {
        name: "Pembukuan Dasar",
        questions: [
          {
            question: "Buku yang mencatat transaksi harian secara kronologis adalah?",
            choices: ["Jurnal Umum", "Buku Besar", "Neraca", "Laba Rugi"],
            correctIndex: 0,
            explanation:
              "Jurnal umum mencatat setiap transaksi secara kronologis (berurutan berdasarkan tanggal) sebelum dipindahkan ke buku besar.",
          },
          {
            question: "Debit bertambah di sisi kiri. Kredit bertambah di sisi?",
            choices: ["Kanan", "Kiri", "Atas", "Bawah"],
            correctIndex: 0,
            explanation:
              "Dalam akuntansi, debit dicatat di sisi kiri dan kredit di sisi kanan. Debit menambah aset, kredit menambah kewajiban dan ekuitas.",
          },
          {
            question: "Manakah yang termasuk aset koperasi?",
            choices: ["Kas dan inventaris", "Simpanan anggota", "SHU", "Hutang bank"],
            correctIndex: 0,
            explanation:
              "Aset adalah sumber daya yang dimiliki koperasi, seperti kas, inventaris, piutang, dan properti.",
          },
          {
            question: "Simpanan pokok anggota dicatat sebagai?",
            choices: ["Modal / Ekuitas", "Pendapatan", "Beban", "Aset Lancar"],
            correctIndex: 0,
            explanation:
              "Simpanan pokok adalah setoran awal anggota yang menjadi bagian dari modal sendiri (ekuitas) koperasi.",
          },
        ],
      },
      {
        name: "Neraca dan Laba Rugi",
        questions: [
          {
            question: "Persamaan dasar akuntansi adalah?",
            choices: [
              "Aset = Kewajiban + Ekuitas",
              "Aset = Pendapatan - Beban",
              "Modal = Kas + Bank",
              "SHU = Pendapatan - Simpanan",
            ],
            correctIndex: 0,
            explanation:
              "Aset selalu sama dengan jumlah kewajiban (hutang) ditambah ekuitas (modal sendiri). Ini adalah persamaan dasar akuntansi.",
          },
          {
            question: "Laporan Laba Rugi menunjukkan?",
            choices: ["Pendapatan dan Beban", "Aset dan Kewajiban", "Arus Kas", "Perubahan Modal"],
            correctIndex: 0,
            explanation:
              "Laporan laba rugi menyajikan pendapatan dan beban selama periode tertentu untuk menghitung SHU (laba bersih).",
          },
          {
            question: "Neraca terdiri dari tiga komponen utama:",
            choices: [
              "Aset, Kewajiban, Ekuitas",
              "Pendapatan, Beban, SHU",
              "Kas, Bank, Piutang",
              "Simpanan, Pinjaman, Usaha",
            ],
            correctIndex: 0,
            explanation:
              "Neraca (statement of financial position) terdiri dari aset, kewajiban, dan ekuitas pada tanggal tertentu.",
          },
        ],
      },
      {
        name: "Analisis Rasio Keuangan",
        questions: [
          {
            question: "Rasio likuiditas mengukur?",
            choices: [
              "Kemampuan membayar utang jangka pendek",
              "Kemampuan menghasilkan laba",
              "Efisiensi operasional",
              "Pertumbuhan anggota",
            ],
            correctIndex: 0,
            explanation:
              "Rasio likuiditas mengukur kemampuan koperasi memenuhi kewajiban jangka pendeknya dengan aset lancar yang dimiliki.",
          },
          {
            question: "Current Ratio dihitung dengan rumus?",
            choices: [
              "Aset Lancar / Kewajiban Lancar",
              "Total Aset / Total Kewajiban",
              "SHU / Modal",
              "Kas / Pinjaman",
            ],
            correctIndex: 0,
            explanation: "Current Ratio = Aset Lancar ÷ Kewajiban Lancar. Rasio yang sehat umumnya > 1,5.",
          },
        ],
      },
      {
        name: "Pengelolaan SHU",
        questions: [
          {
            question: "SHU dibagikan berdasarkan?",
            choices: [
              "Partisipasi dan transaksi anggota",
              "Jabatan anggota",
              "Senioritas",
              "Kedekatan dengan pengurus",
            ],
            correctIndex: 0,
            explanation:
              "SHU dibagikan secara adil berdasarkan partisipasi dan transaksi masing-masing anggota, bukan berdasarkan jabatan.",
          },
          {
            question: "Berapa persen maksimal SHU untuk dana pendidikan?",
            choices: ["5% dari SHU", "10% dari SHU", "50% dari SHU", "100% dari SHU"],
            correctIndex: 0,
            explanation:
              "Berdasarkan prinsip koperasi, sebagian SHU (umumnya 5%) dialokasikan untuk dana pendidikan anggota.",
          },
        ],
      },
    ],
  },
  {
    id: "mod3",
    title: "Tata Kelola & Kepatuhan",
    desc: "Pastikan koperasi berjalan sesuai regulasi yang berlaku.",
    lessons: [
      {
        name: "AD/ART & Legalitas",
        questions: [
          {
            question: "AD/ART koperasi disahkan oleh?",
            choices: ["Rapat Anggota", "Dinas Koperasi", "Notaris", "Pengurus"],
            correctIndex: 0,
            explanation:
              "Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) disahkan oleh Rapat Anggota sebagai pemegang kekuasaan tertinggi.",
          },
          {
            question: "Koperasi memperoleh status badan hukum setelah?",
            choices: ["Akta pendirian disahkan", "Mendapatkan NIK", "Memiliki anggota", "Membayar pajak"],
            correctIndex: 0,
            explanation:
              "Status badan hukum diperoleh setelah akta pendirian koperasi disahkan oleh pejabat yang berwenang (Kemenkumham).",
          },
        ],
      },
      {
        name: "RAT dan Pelaporan",
        questions: [
          {
            question: "Laporan keuangan koperasi harus disampaikan kepada?",
            choices: ["Rapat Anggota", "Hanya pengawas", "Hanya pengurus", "Bank saja"],
            correctIndex: 0,
            explanation: "Laporan keuangan adalah pertanggungjawaban pengurus kepada anggota melalui RAT.",
          },
        ],
      },
      {
        name: "Kepatuhan Pajak",
        questions: [
          {
            question: "Apakah koperasi wajib membayar pajak?",
            choices: ["Ya, atas SHU dan transaksi tertentu", "Tidak pernah", "Hanya yang besar", "Hanya di kota"],
            correctIndex: 0,
            explanation:
              "Koperasi tetap wajib membayar pajak penghasilan (PPh) atas SHU dan PPN atas transaksi tertentu sesuai UU Perpajakan.",
          },
        ],
      },
      {
        name: "Sanksi dan Risiko",
        questions: [
          {
            question: "Sanksi terberat bagi koperasi yang melanggar UU adalah?",
            choices: ["Pembubaran", "Denda ringan", "Teguran tertulis", "Penurunan level"],
            correctIndex: 0,
            explanation: "Koperasi yang melanggar ketentuan dapat dikenakan sanksi hingga pembubaran oleh pemerintah.",
          },
        ],
      },
    ],
  },
  {
    id: "mod4",
    title: "Pengembangan Usaha",
    desc: "Ekspansi dan inovasi unit usaha koperasi.",
    lessons: [
      {
        name: "Identifikasi Peluang Usaha",
        questions: [
          {
            question: "Langkah pertama dalam pengembangan unit usaha adalah?",
            choices: ["Analisis kebutuhan anggota", "Mencari investor", "Membeli alat", "Membuat brosur"],
            correctIndex: 0,
            explanation: "Unit usaha koperasi harus dimulai dari analisis kebutuhan anggota dan potensi pasar lokal.",
          },
        ],
      },
      {
        name: "Business Plan Koperasi",
        questions: [
          {
            question: "Komponen utama business plan adalah?",
            choices: [
              "Analisis pasar, rencana operasional, proyeksi keuangan",
              "Hanya daftar harga",
              "Hanya visi misi",
              "Hanya struktur organisasi",
            ],
            correctIndex: 0,
            explanation:
              "Business plan yang baik mencakup analisis pasar, rencana operasional, strategi pemasaran, dan proyeksi keuangan.",
          },
        ],
      },
      { name: "Strategi Pemasaran", questions: [] },
      { name: "Digitalisasi Layanan", questions: [] },
    ],
  },
  {
    id: "mod5",
    title: "Kepemimpinan & Organisasi",
    desc: "Jadilah pemimpin koperasi yang efektif dan inspiratif.",
    lessons: [
      {
        name: "Gaya Kepemimpinan",
        questions: [
          {
            question: "Gaya kepemimpinan yang paling cocok untuk koperasi adalah?",
            choices: ["Demokratis / partisipatif", "Otoriter", "Laissez-faire (bebas)", "Militeristik"],
            correctIndex: 0,
            explanation:
              "Koperasi yang berasaskan kekeluargaan paling cocok dengan gaya kepemimpinan demokratis yang melibatkan anggota dalam pengambilan keputusan.",
          },
        ],
      },
      { name: "Manajemen Konflik", questions: [] },
      { name: "Pengambilan Keputusan", questions: [] },
      { name: "Membangun Tim Solid", questions: [] },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────

export default function Learn() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>("mod1");
  const [activeLesson, setActiveLesson] = useState<{ modIdx: number; lesIdx: number } | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lessonDone, setLessonDone] = useState<Set<string>>(new Set(["mod1-0", "mod1-1", "mod1-2"]));

  const allDone = Array.from(lessonDone);
  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);

  const handleSelectLesson = (modIdx: number, lesIdx: number) => {
    setActiveLesson({ modIdx, lesIdx });
    setQuestionIdx(0);
    setSelected(null);
  };

  const handleAnswer = (idx: number) => {
    setSelected(idx);
  };

  const handleNext = () => {
    const lesson = activeLesson ? MODULES[activeLesson.modIdx].lessons[activeLesson.lesIdx] : null;
    if (!lesson) return;
    if (questionIdx < lesson.questions.length - 1) {
      setQuestionIdx((q) => q + 1);
      setSelected(null);
    } else {
      // Mark lesson done
      const key = `${activeLesson!.modIdx}-${activeLesson!.lesIdx}`;
      setLessonDone((prev) => new Set(prev).add(key));
    }
  };

  const handlePrev = () => {
    if (questionIdx > 0) {
      setQuestionIdx((q) => q - 1);
      setSelected(null);
    }
  };

  const activeLessonDef = activeLesson ? MODULES[activeLesson.modIdx].lessons[activeLesson.lesIdx] : null;
  const currentQuestion = activeLessonDef?.questions[questionIdx] ?? null;
  const isCorrect = selected !== null && currentQuestion !== null && selected === currentQuestion.correctIndex;
  const isLessonComplete = activeLesson ? lessonDone.has(`${activeLesson.modIdx}-${activeLesson.lesIdx}`) : false;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      <DevDocStripe content={readmeContent} />
      {/* Header */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t("sidebar.nav.learn")}</p>
              <p className="text-xxs text-muted-foreground">
                {t("learn.lessonsDone", { done: allDone.length, total: totalLessons })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-foreground font-mono">{allDone.length * 10}</span>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Module Tree */}
        <div className="lg:col-span-4 space-y-2">
          {MODULES.map((mod, i) => {
            const isOpen = expanded === mod.id;
            const modDone = mod.lessons.filter((ls) => lessonDone.has(`${i}-${mod.lessons.indexOf(ls)}`)).length;
            const unlocked =
              i === 0 ||
              [...Array(i)].every((_, pi) => {
                const prevMod = MODULES[pi];
                return prevMod.lessons.every((_, li) => lessonDone.has(`${pi}-${li}`));
              });
            return (
              <Card key={mod.id} className={`bg-card border-border overflow-hidden ${!unlocked ? "opacity-50" : ""}`}>
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors"
                  onClick={() => unlocked && setExpanded(isOpen ? null : mod.id)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${unlocked ? "bg-emerald-500/20" : "bg-secondary"}`}
                  >
                    {!unlocked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : modDone === mod.lessons.length ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{mod.title}</p>
                    <p className="text-xxxs text-muted-foreground">{mod.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xxs font-mono text-muted-foreground">
                      {modDone}/{mod.lessons.length}
                    </p>
                    <ChevronRight
                      className={`h-3 w-3 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                </div>
                {isOpen && unlocked && (
                  <div className="border-t border-border px-3 py-1.5 space-y-0.5">
                    {mod.lessons.map((ls, j) => {
                      const key = `${i}-${j}`;
                      const done = lessonDone.has(key);
                      const isAct = activeLesson?.modIdx === i && activeLesson?.lesIdx === j;
                      return (
                        <div
                          key={j}
                          onClick={() => handleSelectLesson(i, j)}
                          className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-xs
                            ${isAct ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-secondary text-muted-foreground"}`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className={done ? "line-through" : ""}>{ls.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Right: Quiz Area */}
        <div className="lg:col-span-8">
          {!activeLesson ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">{t("learn.pickLesson")}</p>
              </CardContent>
            </Card>
          ) : isLessonComplete ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-foreground">{t("learn.lessonComplete")}</p>
                <p className="text-xxs text-muted-foreground">
                  {t("learn.lessonCompleteDesc", { name: activeLessonDef?.name ?? "" })}
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveLesson(null)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs"
                >
                  {t("learn.backToModules")}
                </Button>
              </CardContent>
            </Card>
          ) : !activeLessonDef || activeLessonDef.questions.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <p className="text-xs text-muted-foreground">{t("learn.questionsSoon")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-5">
                {/* Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-xxs font-mono text-muted-foreground">
                    {t("learn.questionOf", {
                      name: activeLessonDef.name,
                      current: questionIdx + 1,
                      total: activeLessonDef.questions.length,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    {activeLessonDef.questions.map((_, qi) => (
                      <div
                        key={qi}
                        className={`h-1.5 w-5 rounded-full ${qi <= questionIdx ? "bg-emerald-500" : "bg-secondary"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Question */}
                <div>
                  <p className="text-sm font-bold text-foreground mb-4">{currentQuestion?.question}</p>
                  <div className="space-y-2">
                    {currentQuestion?.choices.map((c, ci) => {
                      const isSelected = selected === ci;
                      const isRight = selected !== null && ci === currentQuestion.correctIndex;
                      const isWrong = selected === ci && selected !== currentQuestion.correctIndex;
                      return (
                        <div
                          key={ci}
                          onClick={() => selected === null && handleAnswer(ci)}
                          className={`p-3 rounded-lg border cursor-pointer text-xs transition-colors ${
                            selected === null
                              ? "border-border hover:bg-secondary hover:border-muted-foreground"
                              : isRight
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold"
                                : isWrong
                                  ? "border-rose-500 bg-rose-500/10 text-rose-400"
                                  : isSelected && selected === ci
                                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                    : "border-border text-muted-foreground"
                          }`}
                        >
                          <span className="text-xxxs font-mono text-muted-foreground mr-2">
                            {["A", "B", "C", "D"][ci]}.
                          </span>
                          {c}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation after answer */}
                {selected !== null && (
                  <div
                    className={`p-3 rounded-lg text-xs ${isCorrect ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
                  >
                    <p className="font-bold mb-0.5">{isCorrect ? t("learn.correct") : t("learn.tryAgain")}</p>
                    <p className="text-xxs opacity-80">{currentQuestion?.explanation}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrev}
                    disabled={questionIdx === 0}
                    className="border-border text-muted-foreground hover:text-foreground text-xxs h-7"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> {t("learn.previous")}
                  </Button>
                  {selected !== null && (
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xxs h-7"
                    >
                      {questionIdx < activeLessonDef.questions.length - 1 ? (
                        <>
                          {t("learn.next")} <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        t("learn.finishLesson")
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
