import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Info } from "lucide-react";
import type { CooperativeProfile, EwsAlert } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
  ewsAlerts: EwsAlert[];
  currentUser: { name: string; role: string } | null;
}

const LEVEL_STYLE: Record<string, string> = {
  info: "text-blue-400 bg-blue-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  critical: "text-rose-400 bg-rose-500/10",
};

const LEVEL_ICON: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

const PEND_ITEMS = [
  { label: "Simpanan", value: 320 },
  { label: "Pinjaman", value: 580 },
  { label: "Unit Usaha", value: 210 },
  { label: "Lain-lain", value: 165 },
];

const BEBAN_ITEMS = [
  { label: "Operasional", value: 180 },
  { label: "Bunga", value: 95 },
  { label: "Penyusutan", value: 45 },
  { label: "Lain-lain", value: 60 },
];

export default function Dashboard({ coopProfile, ewsAlerts, currentUser }: Props) {
  const activeAlerts = ewsAlerts.filter((a) => a.is_active === 1);
  const ragScore = coopProfile?.health_score ?? 0;

  const maxBar = Math.max(...PEND_ITEMS.map((d) => d.value), ...BEBAN_ITEMS.map((d) => d.value));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── COLUMN 1 ──────────────────────────────────────────── */}

        <div className="space-y-6">
          <Card className="bg-[#0b101c]/90 border-slate-900 text-slate-300">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                Selamat Datang
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser && (
                <div>
                  <p className="text-sm font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500">{currentUser.role}</p>
                </div>
              )}
              {coopProfile && (
                <div className="space-y-1 pt-2 border-t border-slate-900">
                  <p className="text-sm font-semibold text-emerald-400">{coopProfile.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">BADAN HUKUM: {coopProfile.legal_id}</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    {coopProfile.regency}, {coopProfile.province}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0b101c]/90 border-slate-900 text-slate-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                EWS Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-900 hover:bg-transparent">
                    <TableHead className="text-[10px] font-mono text-slate-500 py-2 pl-4">Level</TableHead>
                    <TableHead className="text-[10px] font-mono text-slate-500 py-2">Indikator</TableHead>
                    <TableHead className="text-[10px] font-mono text-slate-500 py-2">Pesan</TableHead>
                    <TableHead className="text-[10px] font-mono text-slate-500 py-2 pr-4 text-right">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.length === 0 && (
                    <TableRow className="border-slate-900 hover:bg-transparent">
                      <TableCell colSpan={4} className="text-[10px] text-slate-600 py-4 text-center">
                        Tidak ada alert aktif
                      </TableCell>
                    </TableRow>
                  )}
                  {activeAlerts.map((a) => {
                    const Icon = LEVEL_ICON[a.level] ?? Info;
                    return (
                      <TableRow key={a.id} className="border-slate-900 hover:bg-[#0e1326]">
                        <TableCell className="py-2 pl-4">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${LEVEL_STYLE[a.level]}`}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {a.level.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-slate-300 py-2">{a.indicator}</TableCell>
                        <TableCell className="text-[10px] font-mono text-slate-400 py-2">{a.message}</TableCell>
                        <TableCell className="text-[10px] font-mono text-slate-500 py-2 pr-4 text-right">
                          {a.triggered_at}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── COLUMN 2 ──────────────────────────────────────────── */}

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Anggota", value: "328", accent: "text-white" },
              { label: "Total Aset", value: "Rp 1,275M", accent: "text-emerald-400" },
              { label: "SHU Tahunan", value: "Rp 178M", accent: "text-emerald-400" },
              {
                label: "Kesehatan RAG",
                value: ragScore > 0 ? `${ragScore}%` : "--",
                accent: ragScore >= 70 ? "text-emerald-400" : "text-amber-400",
              },
            ].map(({ label, value, accent }) => (
              <Card key={label} className="bg-[#0b101c]/90 border-slate-900 text-slate-300">
                <CardContent className="p-4">
                  <p className="text-[10px] font-mono text-slate-500 mb-1">{label}</p>
                  <p className={`text-lg font-black font-mono ${accent}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#0b101c]/90 border-slate-900 text-slate-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                Pendapatan &amp; Beban
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-mono text-emerald-400 mb-2">PENDAPATAN</p>
                  <div className="space-y-1.5">
                    {PEND_ITEMS.map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 w-20 text-right">{d.label}</span>
                        <div className="flex-1 h-3 bg-slate-900 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/70 rounded-sm"
                            style={{ width: `${(d.value / maxBar) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-emerald-300 w-12 text-right">{d.value}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-rose-400 mb-2">BEBAN</p>
                  <div className="space-y-1.5">
                    {BEBAN_ITEMS.map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500 w-20 text-right">{d.label}</span>
                        <div className="flex-1 h-3 bg-slate-900 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-rose-500/70 rounded-sm"
                            style={{ width: `${(d.value / maxBar) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-rose-300 w-12 text-right">{d.value}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
