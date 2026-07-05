import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Statistics.css";
import { useTranslation } from "react-i18next";
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

export default function Statistics({ coopProfile, ewsAlerts, currentUser }: Props) {
  const { t } = useTranslation();

  const activeAlerts = ewsAlerts.filter((a) => a.is_active === 1);
  const ragScore = coopProfile?.health_score ?? 0;

  const pendItems = [
    { label: t("dashboard.simpanan"), value: 320 },
    { label: t("dashboard.pinjaman"), value: 580 },
    { label: t("dashboard.unitUsaha"), value: 210 },
    { label: t("dashboard.lainLain"), value: 165 },
  ];

  const bebanItems = [
    { label: t("dashboard.operasional"), value: 180 },
    { label: t("dashboard.bunga"), value: 95 },
    { label: t("dashboard.penyusutan"), value: 45 },
    { label: t("dashboard.lainLain"), value: 60 },
  ];

  const maxBar = Math.max(...pendItems.map((d) => d.value), ...bebanItems.map((d) => d.value));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <DevDocStripe content={readmeContent} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── COLUMN 1 ──────────────────────────────────────────── */}

        <div className="space-y-6">
          <Card className="bg-card border-border text-foreground">
            <CardHeader>
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                {t("dashboard.welcome")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentUser && (
                <div>
                  <p className="text-sm font-bold text-foreground">{currentUser.name}</p>
                  <p className="text-xxs text-muted-foreground">{currentUser.role}</p>
                </div>
              )}
              {coopProfile && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-emerald-400">{coopProfile.name}</p>
                  <p className="text-xxs font-mono text-muted-foreground">
                    {t("dashboard.legalId")}: {coopProfile.legal_id}
                  </p>
                  <p className="text-xxs font-mono text-muted-foreground">
                    {coopProfile.regency}, {coopProfile.province}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                {t("dashboard.ewAlerts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xxs font-mono text-muted-foreground py-2 pl-4">
                      {t("dashboard.level")}
                    </TableHead>
                    <TableHead className="text-xxs font-mono text-muted-foreground py-2">
                      {t("dashboard.indicator")}
                    </TableHead>
                    <TableHead className="text-xxs font-mono text-muted-foreground py-2">
                      {t("dashboard.message")}
                    </TableHead>
                    <TableHead className="text-xxs font-mono text-muted-foreground py-2 pr-4 text-right">
                      {t("dashboard.time")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.length === 0 && (
                    <TableRow className="border-border hover:bg-transparent">
                      <TableCell colSpan={4} className="text-xxs text-muted-foreground py-4 text-center">
                        {t("dashboard.noAlerts")}
                      </TableCell>
                    </TableRow>
                  )}
                  {activeAlerts.map((a) => {
                    const Icon = LEVEL_ICON[a.level] ?? Info;
                    return (
                      <TableRow key={a.id} className="border-border hover:bg-sidebar-ring">
                        <TableCell className="py-2 pl-4">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xxxs font-mono font-semibold ${LEVEL_STYLE[a.level]}`}
                          >
                            <Icon className="h-2.5 w-2.5" />
                            {a.level.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-xxs font-mono text-foreground py-2">{a.indicator}</TableCell>
                        <TableCell className="text-xxs font-mono text-muted-foreground py-2">{a.message}</TableCell>
                        <TableCell className="text-xxs font-mono text-muted-foreground py-2 pr-4 text-right">
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
              { label: t("dashboard.totalMembers"), value: "328", accent: "text-foreground" },
              { label: t("dashboard.totalAssets"), value: "Rp 1,275M", accent: "text-emerald-400" },
              { label: t("dashboard.shuAnnual"), value: "Rp 178M", accent: "text-emerald-400" },
              {
                label: t("dashboard.healthScore"),
                value: ragScore > 0 ? `${ragScore}%` : "--",
                accent: ragScore >= 70 ? "text-emerald-400" : "text-amber-400",
              },
            ].map(({ label, value, accent }) => (
              <Card key={label} className="bg-card border-border text-foreground">
                <CardContent className="p-4">
                  <p className="text-xxs font-mono text-muted-foreground mb-1">{label}</p>
                  <p className={`text-lg font-black font-mono ${accent}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                {t("dashboard.incomeExpense")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xxs font-mono text-emerald-400 mb-2">{t("dashboard.income")}</p>
                  <div className="space-y-1.5">
                    {pendItems.map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-xxxs font-mono text-muted-foreground w-20 text-right">{d.label}</span>
                        <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/70 rounded-sm"
                            style={{ width: `${(d.value / maxBar) * 100}%` }}
                          />
                        </div>
                        <span className="text-xxxs font-mono text-emerald-300 w-12 text-right">{d.value}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xxs font-mono text-rose-400 mb-2">{t("dashboard.expense")}</p>
                  <div className="space-y-1.5">
                    {bebanItems.map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-xxxs font-mono text-muted-foreground w-20 text-right">{d.label}</span>
                        <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-rose-500/70 rounded-sm"
                            style={{ width: `${(d.value / maxBar) * 100}%` }}
                          />
                        </div>
                        <span className="text-xxxs font-mono text-rose-300 w-12 text-right">{d.value}M</span>
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
