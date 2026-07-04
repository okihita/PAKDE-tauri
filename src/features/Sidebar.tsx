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
} from "lucide-react";
import type { CooperativeProfile, EwsAlert } from "@/types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (
    tab: "home" | "statistics" | "leveling" | "members" | "accounting" | "feasibility" | "sync" | "settings",
  ) => void;
  coopProfile: CooperativeProfile | null;
  ewsAlerts: EwsAlert[];
  currentUser: { name: string; role: string } | null;
  appTheme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  coopProfile,
  ewsAlerts,
  currentUser,
  appTheme,
  onThemeToggle,
}: SidebarProps) {
  const { t } = useTranslation();
  const criticalAlerts = ewsAlerts.filter((a) => a.level === "critical").length;

  const NAV_ITEMS = [
    { id: "home" as const, icon: LayoutDashboard, label: t("sidebar.nav.home") },
    { id: "statistics" as const, icon: BarChart3, label: t("sidebar.nav.statistics") },
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
        <div className="px-6 py-6 border-b border-border flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black tracking-widest text-emerald-400">{t("splash.brand")}</span>
            <span className="text-xs font-mono text-muted-foreground">|</span>
            <span className="text-xs font-mono text-foreground">{coopProfile?.village ?? "DESA"}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]" />
            <span className="text-xxs font-mono text-muted-foreground">{t("sidebar.connected")}</span>
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

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xxs">
            <p className="font-bold text-foreground">{currentUser?.name}</p>
            <p className="text-muted-foreground">{currentUser?.role}</p>
          </div>
          <button
            onClick={onThemeToggle}
            className="p-1 rounded hover:bg-sidebar-ring transition-colors ml-auto"
            title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {appTheme === "dark" ? (
              <Sun className="h-3 w-3 text-muted-foreground hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="h-3 w-3 text-muted-foreground hover:text-blue-400 transition-colors" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
