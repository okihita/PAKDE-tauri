import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Sync.css";
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
      <DevDocStripe content={readmeContent} />
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("sync.title")}
          </CardTitle>
          <CardDescription className="text-xxs text-muted-foreground">{t("sync.description")}</CardDescription>
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("sync.historyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xxs font-mono text-muted-foreground">{t("sync.tableHeaders.id")}</TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sync.tableHeaders.direction")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sync.tableHeaders.startedAt")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sync.tableHeaders.status")}
                </TableHead>
                <TableHead className="text-xxs font-mono text-muted-foreground">
                  {t("sync.tableHeaders.entries")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.syncHistoryList.map((hist) => (
                <TableRow key={hist.id} className="border-border hover:bg-sidebar-ring">
                  <TableCell className="text-xxs font-mono text-muted-foreground">{hist.id}</TableCell>
                  <TableCell className="text-xxs font-mono text-foreground uppercase">{hist.direction}</TableCell>
                  <TableCell className="text-xxs font-mono text-muted-foreground">{hist.started_at}</TableCell>
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
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-mono">
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
