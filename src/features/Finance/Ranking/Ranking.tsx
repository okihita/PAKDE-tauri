import "./Ranking.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import {
  TrophyIcon,
  MedalIcon,
  TrendUpIcon,
  TrendDownIcon,
  MinusIcon,
  StarIcon,
  ArrowsClockwise,
  CloudArrowUp,
  WifiSlash,
  CircleNotch,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { RankedCoop, RankingMetric, RankingScope } from "./rankingService";
import type { RankingState } from "./useRanking";

interface Props {
  ranking: RankingState;
  onGoSync: () => void;
}

const SCOPES: RankingScope[] = ["kabupaten", "provinsi", "nasional"];
const METRICS: RankingMetric[] = ["health", "growth", "membership", "impact"];

function ragColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "hijau" || s === "green") return "text-success bg-success/10";
  if (s === "kuning" || s === "yellow") return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendUpIcon className="h-3 w-3 text-success" />;
  if (trend === "down") return <TrendDownIcon className="h-3 w-3 text-danger" />;
  return <MinusIcon className="h-3 w-3 text-muted-foreground" />;
}

function rankMedal(rank: number) {
  if (rank === 1) return <TrophyIcon className="h-4 w-4 text-warning" />;
  if (rank === 2) return <MedalIcon className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <MedalIcon className="h-4 w-4 text-warning" />;
  return <span className="text-xxs font-mono text-muted-foreground w-4 text-center">{rank}</span>;
}

export default function Ranking({ ranking, onGoSync }: Props) {
  const { t } = useTranslation();
  const { status, lastUpdated, boards, ourRanks, isSubmitting, refresh, submitStats } = ranking;

  const [metric, setMetric] = useState<RankingMetric>("health");
  const [scope, setScope] = useState<RankingScope>("kabupaten");

  const hasCache = Object.keys(boards).length > 0;

  // ── Connectivity-gated empty states ──
  if (status === "offline" && !hasCache) {
    return (
      <div className="flex-1 overflow-auto">
        <Card className="bg-card border-border max-w-md mx-auto mt-16">
          <CardContent className="p-8 flex flex-col items-center text-center gap-3">
            <WifiSlash className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">{t("ranking.offlineEmptyTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("ranking.offlineEmptyDesc")}</p>
            <Button
              onClick={onGoSync}
              className="mt-2 bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9"
            >
              {t("ranking.goSync")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "loading" && !hasCache) {
    return (
      <div className="flex-1 overflow-auto flex items-center justify-center">
        <CircleNotch className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const isStale = status === "stale";
  const lastUpdatedLabel = lastUpdated !== null ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true }) : "";

  const levels = SCOPES.map((sc) => ({
    scope: sc,
    rank: ourRanks[sc],
    total: boards[sc]?.[metric]?.total ?? 0,
  }));

  function renderTable(data: RankedCoop[]) {
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
              key={`${c.rank}-${c.name}`}
              className={`border-border transition-colors ${
                c.isOurs ? "bg-success/5 hover:bg-success/10" : "hover:bg-secondary"
              }`}
            >
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">{rankMedal(c.rank)}</div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  {c.isOurs && <StarIcon className="h-3 w-3 text-success shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${c.isOurs ? "text-success" : "text-foreground"}`}>
                      {c.name}
                    </p>
                    <p className="text-xxxs font-mono text-muted-foreground">{c.village}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <span className="text-xs font-mono font-bold text-foreground">{c.score}%</span>
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
      {/* ── Status / connectivity banner ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xxs font-mono">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "live"
                ? "bg-success"
                : status === "stale"
                  ? "bg-warning"
                  : status === "offline"
                    ? "bg-muted-foreground"
                    : "bg-info animate-pulse"
            }`}
          />
          <span className="text-muted-foreground uppercase tracking-wider">
            {t(`ranking.status.${status}`)}
            {lastUpdatedLabel && ` · ${t("ranking.lastUpdated", { time: lastUpdatedLabel })}`}
          </span>
          {isStale && <span className="text-warning">— {t("ranking.staleHint")}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={status === "loading"}
            className="h-8 text-xs gap-1.5"
          >
            <ArrowsClockwise className={status === "loading" ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            {t("ranking.refresh")}
          </Button>
          <Button
            onClick={submitStats}
            disabled={isSubmitting || status === "offline"}
            className="h-8 bg-brand hover:bg-brand text-brand-foreground text-xs gap-1.5"
          >
            {isSubmitting ? (
              <CircleNotch className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CloudArrowUp className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? t("ranking.submitting") : t("ranking.submit")}
          </Button>
        </div>
      </div>

      {/* ── Rank Summary Cards (per scope) ── */}
      <div className="grid grid-cols-3 gap-4">
        {levels.map((lv) => (
          <Card key={lv.scope} className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center gap-1">
              <p className="text-xxs font-mono text-muted-foreground uppercase tracking-wider">
                {t(`ranking.scope.${lv.scope}`)}
              </p>
              <span className="text-2xl font-black text-success font-mono">#{lv.rank ?? "—"}</span>
              <span className="text-xxxs font-mono text-muted-foreground">
                {t("ranking.summary.from", { total: lv.total })}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Metric + Scope tabs ── */}
      <Card className="bg-card border-border hover-glow-card">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrophyIcon className="h-3 w-3 text-warning" />
              {t("ranking.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Tabs value={metric} onValueChange={(v) => setMetric(v as RankingMetric)}>
            <TabsList className="w-full bg-muted flex-wrap">
              {METRICS.map((m) => (
                <TabsTrigger key={m} value={m} className="flex-1 text-xs">
                  {t(`ranking.metric.${m}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs value={scope} onValueChange={(v) => setScope(v as RankingScope)}>
            <TabsList className="w-full bg-muted">
              {SCOPES.map((sc) => (
                <TabsTrigger key={sc} value={sc} className="flex-1 text-xs">
                  {t(`ranking.scope.${sc}`)}
                </TabsTrigger>
              ))}
            </TabsList>

            {SCOPES.map((sc) => {
              const items = boards[sc]?.[metric]?.items;
              return (
                <TabsContent key={sc} value={sc} className="mt-2">
                  {items ? (
                    renderTable(items)
                  ) : (
                    <div className="py-8 flex justify-center">
                      <CircleNotch className="h-5 w-5 text-muted-foreground animate-spin" />
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
