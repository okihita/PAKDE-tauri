import "./Planners.css";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer } from "lucide-react";

const PLANNERS = [
  {
    title: "Planner RAT Tahunan",
    desc: "Template lengkap persiapan Rapat Anggota Tahunan, dari agenda hingga notulensi.",
    pages: 12,
    category: "Rapat",
  },
  {
    title: "Planner Keuangan Bulanan",
    desc: "Lembar kerja pencatatan pemasukan, pengeluaran, dan rekonsiliasi bank bulanan.",
    pages: 8,
    category: "Keuangan",
  },
  {
    title: "Planner Monitoring Pinjaman",
    desc: "Track pinjaman anggota: jadwal angsuran, outstanding, dan status kolektibilitas.",
    pages: 6,
    category: "Pinjaman",
  },
  {
    title: "Planner Inventaris Alat",
    desc: "Daftar inventaris peralatan koperasi lengkap dengan kondisi dan jadwal perawatan.",
    pages: 4,
    category: "Inventaris",
  },
  {
    title: "Planner Kegiatan Tahunan",
    desc: "Kalender kegiatan koperasi selama satu tahun: rapat, pelatihan, dan event.",
    pages: 2,
    category: "Kalender",
  },
  {
    title: "Planner Evaluasi Kinerja",
    desc: "Form evaluasi kinerja pengurus dan karyawan koperasi per triwulan.",
    pages: 10,
    category: "SDM",
  },
  {
    title: "Planner SHU Anggota",
    desc: "Lembar kerja perhitungan pembagian SHU berdasarkan partisipasi anggota.",
    pages: 6,
    category: "Keuangan",
  },
  {
    title: "Planner Rapat Pengurus",
    desc: "Template agenda rapat, notulensi, dan tindak lanjut untuk rapat pengurus rutin.",
    pages: 4,
    category: "Rapat",
  },
  {
    title: "Planner Pengembangan Unit Usaha",
    desc: "Lembar kerja perencanaan dan evaluasi pengembangan unit usaha koperasi.",
    pages: 8,
    category: "Bisnis",
  },
];

export default function Planners() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-amber-400" /> {t("sidebar.nav.planners")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xxs text-muted-foreground mb-4">{t("planners.description")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLANNERS.map((p, i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border p-4 space-y-3 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-xxxs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                    {t("planners.pages", { n: p.pages })}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{p.title}</p>
                  <p className="text-xxxs text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xxxs font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                    {p.category}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xxs h-7"
                  >
                    <Download className="h-3 w-3 mr-1" /> {t("planners.pdf")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border text-muted-foreground hover:text-foreground text-xxs h-7"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
