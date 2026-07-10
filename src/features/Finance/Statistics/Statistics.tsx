import "./Statistics.css";
import { useTranslation } from "react-i18next";
import {
  HeartIcon,
  UsersIcon,
  PiggyBankIcon,
  ChartLineUpIcon,
  TrendUpIcon,
  TrendDownIcon,
  ShieldCheckIcon,
  WarningIcon,
  LightningIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import type { CooperativeProfile } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
}

// ── mock data (replace with real DB queries when available) ──
const MOCK = {
  totalMembers: 328,
  totalSimpanan: 1_850_000_000,
  shuAnnual: 178_000_000,
  pendapatan: [
    { label: "Simpanan", value: 420_000_000 },
    { label: "Pinjaman", value: 580_000_000 },
    { label: "Unit Usaha", value: 210_000_000 },
    { label: "Lain-lain", value: 65_000_000 },
  ],
  beban: [
    { label: "Operasional", value: 280_000_000 },
    { label: "Bunga", value: 95_000_000 },
    { label: "Penyusutan", value: 45_000_000 },
    { label: "Lain-lain", value: 60_000_000 },
  ],
  alerts: [] as Array<{ indicator: string; message: string; level: "warning" | "critical" }>,
};

function formatRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatRpCompact(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function getHealthTier(score: number): "sehat" | "cukup" | "kurang" {
  if (score >= 70) return "sehat";
  if (score >= 40) return "cukup";
  return "kurang";
}

export default function Statistics({ coopProfile }: Props) {
  const { t } = useTranslation();

  const healthScore = coopProfile?.health_score ?? 72;
  const tier = getHealthTier(healthScore);

  const totalPendapatan = MOCK.pendapatan.reduce((s, p) => s + p.value, 0);
  const totalBeban = MOCK.beban.reduce((s, b) => s + b.value, 0);
  const hasilBersih = totalPendapatan - totalBeban;
  const maxBar = Math.max(...MOCK.pendapatan.map((d) => d.value), ...MOCK.beban.map((d) => d.value));

  // Health gauge styling
  const gaugeColor = tier === "sehat" ? "text-emerald-400" : tier === "cukup" ? "text-amber-400" : "text-red-400";
  const gaugeRing = tier === "sehat" ? "stroke-emerald-400" : tier === "cukup" ? "stroke-amber-400" : "stroke-red-400";
  const gaugeTrack = "stroke-slate-800";
  const circumference = 2 * Math.PI * 54; // r=54
  const dashOffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {/* ── Health Gauge Hero ── */}
      <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
            <circle cx="65" cy="65" r="54" fill="none" strokeWidth="10" className={gaugeTrack} />
            <circle
              cx="65"
              cy="65"
              r="54"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={`${gaugeRing} transition-all duration-1000`}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black font-mono ${gaugeColor}`}>{healthScore}%</span>
            <span className="text-xxxs font-mono text-muted-foreground">{t("statistics.healthGauge")}</span>
          </div>
        </div>

        {/* Status text */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <HeartIcon className={`h-5 w-5 ${gaugeColor}`} />
            <span className={`text-sm font-bold ${gaugeColor}`}>
              {t(`statistics.health${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}
            </span>
          </div>
          <p className="text-xxs text-muted-foreground leading-relaxed max-w-lg">
            {t(`statistics.healthDesc${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}
          </p>
        </div>
      </div>

      {/* ── 3 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Members */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <UsersIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
              {t("dashboard.totalMembers")}
            </p>
            <p className="text-base font-black font-mono text-foreground">{MOCK.totalMembers}</p>
            <span className="text-xxxs font-mono text-emerald-400 flex items-center gap-0.5">
              <TrendUpIcon className="h-3 w-3" />
              {t("statistics.memberTrendUp", { n: 12 })}
            </span>
          </div>
        </div>

        {/* Savings */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <PiggyBankIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
              {t("statistics.totalSimpanan")}
            </p>
            <p className="text-base font-black font-mono text-foreground">{formatRp(MOCK.totalSimpanan)}</p>
            <span className="text-xxxs font-mono text-muted-foreground">
              {t("statistics.simpananMembers", { n: MOCK.totalMembers })}
            </span>
          </div>
        </div>

        {/* Net Result */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4 flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              hasilBersih >= 0
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <ChartLineUpIcon className={`h-5 w-5 ${hasilBersih >= 0 ? "text-emerald-400" : "text-red-400"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
              {t("statistics.hasilBersih")}
            </p>
            <p className={`text-base font-black font-mono ${hasilBersih >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatRp(hasilBersih)}
            </p>
            <span className="text-xxxs font-mono text-muted-foreground">{t("statistics.hasilBersihDesc")}</span>
          </div>
        </div>
      </div>

      {/* ── Income vs Expense ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendUpIcon className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-foreground">{t("dashboard.income")}</h4>
            <span className="ml-auto text-sm font-black font-mono text-emerald-400">
              {formatRpCompact(totalPendapatan)}
            </span>
          </div>
          <div className="space-y-2">
            {MOCK.pendapatan.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xxxs font-mono text-muted-foreground w-20 shrink-0">{item.label}</span>
                <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/60 rounded-full"
                    style={{ width: `${(item.value / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-xxxs font-mono text-emerald-400 w-16 text-right shrink-0">
                  {formatRpCompact(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendDownIcon className="h-4 w-4 text-red-400" />
            <h4 className="text-xs font-bold text-foreground">{t("dashboard.expense")}</h4>
            <span className="ml-auto text-sm font-black font-mono text-red-400">{formatRpCompact(totalBeban)}</span>
          </div>
          <div className="space-y-2">
            {MOCK.beban.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-xxxs font-mono text-muted-foreground w-20 shrink-0">{item.label}</span>
                <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500/60 rounded-full"
                    style={{ width: `${(item.value / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-xxxs font-mono text-red-400 w-16 text-right shrink-0">
                  {formatRpCompact(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alerts & Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            {MOCK.alerts.length > 0 ? (
              <WarningIcon className="h-4 w-4 text-amber-400" />
            ) : (
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
            )}
            <h4 className="text-xs font-bold text-foreground">{t("statistics.alertsActive")}</h4>
          </div>
          {MOCK.alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-xxs text-muted-foreground">
              <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t("statistics.alertsNone")}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {MOCK.alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xxs">
                  <WarningIcon
                    className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.level === "critical" ? "text-red-400" : "text-amber-400"}`}
                  />
                  <span className="text-muted-foreground">{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended action */}
        <div className="bg-slate-950/60 border border-slate-900/80 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <LightningIcon className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold text-foreground">{t("statistics.actionTitle")}</h4>
          </div>
          <p className="text-xxs text-muted-foreground leading-relaxed">
            {t(`statistics.action${tier.charAt(0).toUpperCase() + tier.slice(1)}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
