import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSync } from "@/hooks/useSync";

export default function Sync() {
  const s = useSync();

  useEffect(() => {
    s.loadSyncHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-[#0b101c]/90 border-slate-900">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sinkronisasi & EWS Sync Dashboard
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-500">
            Hubungkan node desa Anda ke API kabupaten untuk upload data transaksi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={s.handleSyncNow}
            disabled={s.isSyncing}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
          >
            {s.isSyncing ? "Mensinkronisasi..." : "Sinkronisasi Data Sekarang"}
          </Button>
          {s.syncProgress && (
            <div className="mt-3 text-center">
              <span className="text-emerald-400 text-xs font-mono font-semibold">{s.syncProgress}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#0b101c]/90 border-slate-900">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Riwayat Sinkronisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-900 hover:bg-transparent">
                <TableHead className="text-[10px] font-mono text-slate-500">ID</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">Arah</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">Waktu Mulai</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">Status</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">Entri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.syncHistoryList.map((hist) => (
                <TableRow key={hist.id} className="border-slate-900 hover:bg-[#0e1326]">
                  <TableCell className="text-[10px] font-mono text-slate-400">{hist.id}</TableCell>
                  <TableCell className="text-[10px] font-mono text-slate-300 uppercase">{hist.direction}</TableCell>
                  <TableCell className="text-[10px] font-mono text-slate-400">{hist.started_at}</TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-xs font-bold ${hist.status === "success" ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {hist.status === "success" ? "BERHASIL" : "GAGAL"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{hist.entity_count} entri data</TableCell>
                </TableRow>
              ))}
              {s.syncHistoryList.length === 0 && (
                <TableRow className="border-slate-900">
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs font-mono">
                    Belum ada riwayat sinkronisasi terdaftar di database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
