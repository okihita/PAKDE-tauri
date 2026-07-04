import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSync } from "@/hooks/useSync";

export default function Sync() {
  const { t } = useTranslation();
  const s = useSync();

  useEffect(() => {
    s.loadSyncHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-[#0b101c]/90 border-slate-900">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("sync.title")}</CardTitle>
          <CardDescription className="text-[10px] text-slate-500">{t("sync.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={s.handleSyncNow}
            disabled={s.isSyncing}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
          >
            {s.isSyncing ? t("sync.syncing") : t("sync.syncButton")}
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
            {t("sync.historyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-900 hover:bg-transparent">
                <TableHead className="text-[10px] font-mono text-slate-500">{t("sync.tableHeaders.id")}</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">
                  {t("sync.tableHeaders.direction")}
                </TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">
                  {t("sync.tableHeaders.startedAt")}
                </TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">{t("sync.tableHeaders.status")}</TableHead>
                <TableHead className="text-[10px] font-mono text-slate-500">{t("sync.tableHeaders.entries")}</TableHead>
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
                      {hist.status === "success" ? t("sync.status.success") : t("sync.status.failed")}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {t("sync.entryLabel", { count: hist.entity_count })}
                  </TableCell>
                </TableRow>
              ))}
              {s.syncHistoryList.length === 0 && (
                <TableRow className="border-slate-900">
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs font-mono">
                    {t("sync.empty")}
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
