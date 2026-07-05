import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Ranking.css";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import type { CooperativeProfile } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
}

interface MockRankedCoop {
  rank: number;
  name: string;
  village: string;
  healthScore: number;
  ragStatus: string;
  trend: "up" | "down" | "stable";
  isOurs: boolean;
}

const OUR_NAME = "Koperasi Maju Makmur";
const OUR_VILLAGE = "Desa Makmur Jaya";

function generateMockLeaderboard(
  ourRank: number,
  ourHealth: number,
  ourRag: string,
  extraCoops: Omit<MockRankedCoop, "isOurs" | "trend">[],
): MockRankedCoop[] {
  const list: MockRankedCoop[] = [];

  for (const c of extraCoops) {
    if (c.rank === ourRank) {
      list.push({ ...c, isOurs: true, trend: "up" });
    } else {
      list.push({ ...c, isOurs: false, trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable" });
    }
  }

  list.sort((a, b) => a.rank - b.rank);

  // Insert ours at correct position if not already there
  if (!list.some((c) => c.isOurs)) {
    list.push({
      rank: ourRank,
      name: OUR_NAME,
      village: OUR_VILLAGE,
      healthScore: ourHealth,
      ragStatus: ourRag,
      trend: "up",
      isOurs: true,
    });
    list.sort((a, b) => a.rank - b.rank);
  }

  return list;
}

// ── Mock data ──────────────────────────────────────────────────────

const KABUPATEN_MOCK: Omit<MockRankedCoop, "isOurs" | "trend">[] = [
  { rank: 1, name: "KSU Guyub Rukun", village: "Desa Sooko", healthScore: 94, ragStatus: "Hijau" },
  { rank: 2, name: "KUD Sumber Makmur", village: "Desa Gondang", healthScore: 91, ragStatus: "Hijau" },
  { rank: 3, name: "Koperasi Tani Jaya", village: "Desa Kemlagi", healthScore: 88, ragStatus: "Hijau" },
  { rank: 4, name: "KSP Mitra Usaha", village: "Desa Gedeg", healthScore: 85, ragStatus: "Hijau" },
  { rank: 5, name: "KUD Tani Subur", village: "Desa Dawarblandong", healthScore: 82, ragStatus: "Hijau" },
  { rank: 6, name: "KSU Bina Sejahtera", village: "Desa Jetis", healthScore: 79, ragStatus: "Hijau" },
  { rank: 7, name: "Koperasi Serba Usaha Mapan", village: "Desa Puri", healthScore: 76, ragStatus: "Kuning" },
  { rank: 8, name: "KSP Surya Mandiri", village: "Desa Trowulan", healthScore: 72, ragStatus: "Kuning" },
  { rank: 9, name: "KUD Harapan Tani", village: "Desa Bangsal", healthScore: 70, ragStatus: "Kuning" },
  { rank: 10, name: "KSU Sejahtera Abadi", village: "Desa Mojoanyar", healthScore: 68, ragStatus: "Kuning" },
  { rank: 11, name: "Koperasi Wanita Kartini", village: "Desa Pungging", healthScore: 65, ragStatus: "Kuning" },
  { rank: 12, name: "KSP Gotong Royong", village: "Desa Ngoro", healthScore: 63, ragStatus: "Kuning" },
  { rank: 13, name: "KUD Mekar Tani", village: "Desa Kutorejo", healthScore: 60, ragStatus: "Kuning" },
  { rank: 14, name: "KSU Mutiara Desa", village: "Desa Dlanggu", healthScore: 57, ragStatus: "Merah" },
  { rank: 15, name: "Koperasi Simpan Pinjam Rukun", village: "Desa Pacet", healthScore: 54, ragStatus: "Merah" },
  { rank: 16, name: "KUD Lestari Makmur", village: "Desa Trawas", healthScore: 51, ragStatus: "Merah" },
  { rank: 17, name: "KSP Barokah", village: "Desa Jatirejo", healthScore: 48, ragStatus: "Merah" },
  { rank: 18, name: "KSU Sido Makmur", village: "Desa Gondang", healthScore: 45, ragStatus: "Merah" },
  { rank: 19, name: "KUD Karya Tani", village: "Desa Kemlagi", healthScore: 42, ragStatus: "Merah" },
  { rank: 20, name: "KSP Sumber Rejeki", village: "Desa Mojoanyar", healthScore: 39, ragStatus: "Merah" },
];

const PROVINSI_MOCK: Omit<MockRankedCoop, "isOurs" | "trend">[] = [
  { rank: 1, name: "KUD Sumber Makmur", village: "Kab. Mojokerto", healthScore: 97, ragStatus: "Hijau" },
  { rank: 2, name: "KSU Guyub Rukun", village: "Kab. Mojokerto", healthScore: 95, ragStatus: "Hijau" },
  { rank: 3, name: "KSP Bhakti Utama", village: "Kab. Malang", healthScore: 93, ragStatus: "Hijau" },
  { rank: 4, name: "KUD Subur Tani", village: "Kab. Jombang", healthScore: 90, ragStatus: "Hijau" },
  { rank: 5, name: "Koperasi Tani Jaya", village: "Kab. Mojokerto", healthScore: 88, ragStatus: "Hijau" },
  { rank: 6, name: "KSP Mitra Usaha", village: "Kab. Mojokerto", healthScore: 85, ragStatus: "Hijau" },
  { rank: 7, name: "KUD Mulyo Rejo", village: "Kab. Kediri", healthScore: 83, ragStatus: "Hijau" },
  { rank: 8, name: "KSP Surya Cemerlang", village: "Kab. Sidoarjo", healthScore: 81, ragStatus: "Hijau" },
  { rank: 9, name: "KSU Taman Sari", village: "Kota Surabaya", healthScore: 78, ragStatus: "Kuning" },
  { rank: 10, name: "KUD Makmur Sentosa", village: "Kab. Gresik", healthScore: 76, ragStatus: "Kuning" },
  { rank: 11, name: "Koperasi Serba Usaha Mapan", village: "Kab. Mojokerto", healthScore: 74, ragStatus: "Kuning" },
  { rank: 12, name: "KSP Restu Bumi", village: "Kab. Pasuruan", healthScore: 72, ragStatus: "Kuning" },
  { rank: 13, name: "KSU Bina Sejahtera", village: "Kab. Mojokerto", healthScore: 70, ragStatus: "Kuning" },
  { rank: 14, name: "KUD Tani Subur", village: "Kab. Mojokerto", healthScore: 68, ragStatus: "Kuning" },
];

const NASIONAL_MOCK: Omit<MockRankedCoop, "isOurs" | "trend">[] = [
  { rank: 1, name: "KSP Bhakti Utama", village: "Jawa Timur", healthScore: 99, ragStatus: "Hijau" },
  { rank: 2, name: "KUD Sumber Makmur", village: "Jawa Timur", healthScore: 97, ragStatus: "Hijau" },
  { rank: 3, name: "Koperasi Serba Usaha Mandiri", village: "Jawa Barat", healthScore: 96, ragStatus: "Hijau" },
  { rank: 4, name: "KUD Subur Tani", village: "Jawa Timur", healthScore: 94, ragStatus: "Hijau" },
  { rank: 5, name: "KSU Guyub Rukun", village: "Jawa Timur", healthScore: 93, ragStatus: "Hijau" },
  { rank: 6, name: "KSP Makmur Sentosa", village: "Jawa Tengah", healthScore: 91, ragStatus: "Hijau" },
  { rank: 7, name: "KUD Mulyo Rejo", village: "Jawa Timur", healthScore: 89, ragStatus: "Hijau" },
  { rank: 8, name: "Koperasi Tani Jaya", village: "Jawa Timur", healthScore: 87, ragStatus: "Hijau" },
  { rank: 9, name: "KSU Taman Sari", village: "Jawa Timur", healthScore: 85, ragStatus: "Hijau" },
  { rank: 10, name: "KSP Mitra Usaha", village: "Jawa Timur", healthScore: 84, ragStatus: "Hijau" },
  { rank: 11, name: "KUD Sedyo Mukti", village: "DI Yogyakarta", healthScore: 82, ragStatus: "Hijau" },
  { rank: 12, name: "KSU Bina Sejahtera", village: "Jawa Timur", healthScore: 80, ragStatus: "Kuning" },
  { rank: 13, name: "KSP Surya Cemerlang", village: "Jawa Timur", healthScore: 78, ragStatus: "Kuning" },
  { rank: 14, name: "KUD Makmur Sentosa", village: "Jawa Timur", healthScore: 76, ragStatus: "Kuning" },
  { rank: 15, name: "Koperasi Serba Usaha Mapan", village: "Jawa Timur", healthScore: 74, ragStatus: "Kuning" },
  { rank: 16, name: "KUD Sumber Rejeki", village: "Bali", healthScore: 73, ragStatus: "Kuning" },
  { rank: 17, name: "KSP Karya Bersama", village: "Sumatera Utara", healthScore: 71, ragStatus: "Kuning" },
  { rank: 18, name: "KSU Harapan Jaya", village: "Sulawesi Selatan", healthScore: 69, ragStatus: "Kuning" },
  { rank: 19, name: "KUD Restu Bumi", village: "Jawa Timur", healthScore: 67, ragStatus: "Kuning" },
  { rank: 20, name: "KSP Tani Subur", village: "Jawa Timur", healthScore: 65, ragStatus: "Kuning" },
];

// ── Helpers ────────────────────────────────────────────────────────

function ragColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "hijau" || s === "green") return "text-emerald-400 bg-emerald-500/10";
  if (s === "kuning" || s === "yellow") return "text-amber-400 bg-amber-500/10";
  return "text-rose-400 bg-rose-500/10";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-rose-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function rankMedal(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-xxs font-mono text-muted-foreground w-4 text-center">{rank}</span>;
}

// ── Main ──────────────────────────────────────────────────────────

export default function Ranking({ coopProfile }: Props) {
  const { t } = useTranslation();
  const healthScore = coopProfile?.health_score ?? 65;
  const ragStatus = coopProfile?.rag_status ?? "Kuning";

  const kabupaten = generateMockLeaderboard(10, healthScore, ragStatus, KABUPATEN_MOCK);
  const provinsi = generateMockLeaderboard(12, healthScore, ragStatus, PROVINSI_MOCK);
  const nasional = generateMockLeaderboard(18, healthScore, ragStatus, NASIONAL_MOCK);

  const ourKab = kabupaten.find((c) => c.isOurs) ?? kabupaten[0];
  const ourProv = provinsi.find((c) => c.isOurs) ?? provinsi[0];
  const ourNas = nasional.find((c) => c.isOurs) ?? nasional[0];

  const levels = [
    { key: "kabupaten", label: t("ranking.scope.kabupaten"), rank: ourKab.rank, total: kabupaten.length },
    { key: "provinsi", label: t("ranking.scope.provinsi"), rank: ourProv.rank, total: provinsi.length },
    { key: "nasional", label: t("ranking.scope.nasional"), rank: ourNas.rank, total: nasional.length },
  ];

  function renderTable(data: MockRankedCoop[]) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xxs font-mono text-muted-foreground w-12">#</TableHead>
            <TableHead className="text-xxs font-mono text-muted-foreground">{t("ranking.table.coop")}</TableHead>
            <TableHead className="text-xxs font-mono text-muted-foreground w-20">{t("ranking.table.score")}</TableHead>
            <TableHead className="text-xxs font-mono text-muted-foreground w-16">{t("ranking.table.rag")}</TableHead>
            <TableHead className="text-xxs font-mono text-muted-foreground w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow
              key={c.rank}
              className={`border-border transition-colors ${
                c.isOurs ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-secondary"
              }`}
            >
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">{rankMedal(c.rank)}</div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  {c.isOurs && <Star className="h-3 w-3 text-emerald-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${c.isOurs ? "text-emerald-400" : "text-foreground"}`}>
                      {c.name}
                    </p>
                    <p className="text-xxxs font-mono text-muted-foreground">{c.village}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <span className="text-xs font-mono font-bold text-foreground">{c.healthScore}%</span>
              </TableCell>
              <TableCell className="py-2">
                <span className={`text-xxxs font-bold px-1.5 py-0.5 rounded ${ragColor(c.ragStatus)}`}>
                  {c.ragStatus}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <TrendIcon trend={c.trend} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <DevDocStripe content={readmeContent} />
      {/* ── Rank Summary Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {levels.map((lv) => (
          <Card key={lv.key} className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center gap-1">
              <p className="text-xxs font-mono text-muted-foreground uppercase tracking-wider">{lv.label}</p>
              <span className="text-2xl font-black text-emerald-400 font-mono">#{lv.rank}</span>
              <span className="text-xxxs font-mono text-muted-foreground">
                {t("ranking.summary.from", { total: lv.total })}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Leaderboard Tabs ── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-3 w-3 text-amber-400" />
            {t("ranking.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kabupaten">
            <TabsList className="w-full bg-muted">
              {levels.map((lv) => (
                <TabsTrigger key={lv.key} value={lv.key} className="flex-1 text-xs">
                  {lv.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="kabupaten">{renderTable(kabupaten)}</TabsContent>
            <TabsContent value="provinsi">{renderTable(provinsi)}</TabsContent>
            <TabsContent value="nasional">{renderTable(nasional)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
