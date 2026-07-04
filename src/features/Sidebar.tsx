import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Receipt,
  TrendingUp,
  BarChart3,
  Trophy,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Database,
  UserCheck,
  Sun,
  Moon,
  Shield,
  Medal,
} from "lucide-react";
import { getCurrentLevel } from "@/data/leveling";
import type { CooperativeProfile, EwsAlert } from "@/types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (
    tab:
      "home" | "statistics" | "peringkat" | "leveling" | "members" | "accounting" | "feasibility" | "sync" | "settings",
  ) => void;
  coopProfile: CooperativeProfile | null;
  ewsAlerts: EwsAlert[];
  memberCount: number;
  currentUser: { name: string; role: string } | null;
  appTheme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  coopProfile,
  ewsAlerts,
  memberCount,
  currentUser,
  appTheme,
  onThemeToggle,
}: SidebarProps) {
  const { t } = useTranslation();
  const criticalAlerts = ewsAlerts.filter((a) => a.level === "critical").length;
  const healthScore = coopProfile?.health_score ?? 0;
  const currentLevel = healthScore > 0 ? getCurrentLevel(healthScore) : null;

  const NAV_ITEMS = [
    { id: "home" as const, icon: LayoutDashboard, label: t("sidebar.nav.home") },
    { id: "statistics" as const, icon: BarChart3, label: t("sidebar.nav.statistics") },
    { id: "peringkat" as const, icon: Medal, label: t("sidebar.nav.peringkat") },
    { id: "leveling" as const, icon: Trophy, label: t("sidebar.nav.leveling") },
    { id: "members" as const, icon: Users, label: t("sidebar.nav.members") },
    { id: "accounting" as const, icon: Receipt, label: t("sidebar.nav.accounting") },
    { id: "feasibility" as const, icon: TrendingUp, label: t("sidebar.nav.feasibility") },
    { id: "sync" as const, icon: RefreshCw, label: t("sidebar.nav.sync") },
    { id: "settings" as const, icon: Settings, label: t("sidebar.nav.settings") },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col justify-between print:hidden">
      <div>
        {/* ── Guild Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-border space-y-3">
          {/* Guild Banner Card */}
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            {/* Title row: brand + tier badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <h2 className="text-sm font-bold text-foreground truncate">{coopProfile?.name ?? "..."}</h2>
              </div>
              {currentLevel && (
                <span
                  className={`text-xxxs font-black px-2 py-0.5 rounded-full shrink-0 ${currentLevel.bgClass} ${currentLevel.textClass} border border-current/20`}
                >
                  {`Lv.${currentLevel.tier}`}
                </span>
              )}
            </div>
            {/* Tier name */}
            {currentLevel && (
              <p className="text-xxs font-mono text-muted-foreground uppercase tracking-wider">
                {currentLevel.labelId} · {currentLevel.labelEn}
              </p>
            )}
            {/* Health / XP Bar */}
            {healthScore > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xxxs font-mono">
                  <span className="text-muted-foreground">{t("sidebar.healthScore")}</span>
                  <span className="text-emerald-400 font-bold">{healthScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${healthScore}%` }} />
                </div>
              </div>
            )}
            {/* Stats row */}
            <div className="flex items-center gap-2 text-xxs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" />
                <span>{memberCount}</span>
              </span>
              <span className="text-border">|</span>
              <span className="text-xxxs font-mono truncate">
                {coopProfile?.village}
                {coopProfile?.regency ? `, ${coopProfile.regency}` : ""}
              </span>
            </div>
          </div>

          {/* User Profile Row */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/30">
              <UserCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{currentUser?.name}</p>
              <p className="text-xxs text-muted-foreground truncate">{currentUser?.role}</p>
            </div>
            <button
              onClick={onThemeToggle}
              className="p-1.5 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0"
              title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {appTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-400 transition-colors" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-400 transition-colors" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all text-xs font-semibold ${
                activeTab === id
                  ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              onClick={() => onTabChange(id)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-4 space-y-4">
        {(coopProfile?.health_score ?? 0) > 0 && (
          <div className="px-3 py-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-3 w-3 text-emerald-400" />
              <span className="text-xxs font-mono text-muted-foreground">{t("sidebar.healthScore")}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-emerald-400 font-mono">{coopProfile?.health_score}%</span>
              <span className="text-xxxs text-muted-foreground mb-1">
                {t("sidebar.rag")}: {coopProfile?.rag_status}
              </span>
            </div>
          </div>
        )}

        {criticalAlerts > 0 && (
          <div className="px-3 py-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              <span className="text-xxs font-mono text-rose-300">
                {t("sidebar.criticalAlerts", { count: criticalAlerts })}
              </span>
            </div>
          </div>
        )}

        {(ewsAlerts.filter((a) => a.level === "warning").length > 0 ||
          ewsAlerts.length === 0 ||
          criticalAlerts === 0) && (
          <div className="px-3 py-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-xxs font-mono text-muted-foreground">{t("sidebar.systemNormal")}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
