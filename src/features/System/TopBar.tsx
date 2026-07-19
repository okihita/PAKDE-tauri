import { useTranslation } from "react-i18next";
import {
  Gear,
  SunIcon,
  MoonIcon,
  UserCheck,
  SignOut,
  CloudCheck,
  Coins,
  Fire,
  Warning,
  PencilSimple,
  ChartBar,
} from "@phosphor-icons/react";
import type { TabId } from "@/features/System/moduleUnlock";
import { Tooltip } from "@/components/ui/tooltip";
import type { TopBarStats } from "@/features/System/ProfileSelect/cooperativeDb";
import type { LocalUser } from "@/types";

interface TopBarProps {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  currentUser: LocalUser | null;
  appTheme: "dark" | "light";
  onThemeToggle: () => void;
  onOpenProfile: () => void;
  onOpenSession: () => void;
  topStats?: TopBarStats | null;
  onAlertsClick?: () => void;
}

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Shared right-rail width: matches the left Sidebar (w-72) so the settings
// cluster aligns with the Beranda "Berita" column. The TopBar stays a global
// component — it just blocks out a fixed-width right rail.
const RIGHT_RAIL = "w-72";

const statSlot = "flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0";

export default function TopBar({
  activeTab,
  onNavigate,
  appTheme,
  onThemeToggle,
  onOpenProfile,
  onOpenSession,
  topStats,
  onAlertsClick,
}: TopBarProps) {
  const { t } = useTranslation();

  const ctrlBtn = "p-2 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0 text-muted-foreground";

  const sevClass =
    topStats?.worstSeverity === "critical"
      ? "text-danger"
      : topStats?.worstSeverity === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div className="bg-sidebar border-b border-border flex items-center justify-between gap-3 px-6 h-12 shrink-0 select-none print:hidden z-40 relative">
      {/* ── Live stat cluster (left): grows to fill up to the right rail.
            Vitals are distributed uniformly across this space. ── */}
      <div className="flex items-center justify-between gap-1 min-w-0 flex-1">
        {topStats && (
          <>
            {/* 💰 Resource — Net Worth (Assets − Liabilities) */}
            <Tooltip label={t("topbar.netWorth")} description={t("topbar.netWorthDesc")} className="inline-flex">
              <div className={statSlot}>
                <Coins className="h-4 w-4 text-success shrink-0" />
                <div className="leading-none">
                  <p className="text-xs font-bold text-foreground tabular-nums">{idr.format(topStats.netWorth)}</p>
                  <p className="text-xxxs text-muted-foreground mt-0.5">{t("topbar.netWorth")}</p>
                </div>
              </div>
            </Tooltip>

            <span className="h-6 w-px bg-border mx-0.5 shrink-0" />

            {/* 🔥 Morale — Community Liveliness (events + turnout, 30d) */}
            <Tooltip
              label={t("topbar.liveliness")}
              description={t("topbar.livelinessDesc", {
                count: topStats.eventCount,
                avg: topStats.avgParticipants.toFixed(1),
              })}
              className="inline-flex"
            >
              <div className={statSlot}>
                <Fire className="h-4 w-4 text-warning shrink-0" />
                <div className="leading-none">
                  <p className="text-xs font-bold text-foreground tabular-nums">
                    {topStats.eventCount}
                    <span className="text-xxxs font-normal text-muted-foreground ml-1">{t("topbar.events")}</span>
                  </p>
                  <p className="text-xxxs text-muted-foreground mt-0.5">{t("topbar.liveliness")}</p>
                </div>
              </div>
            </Tooltip>

            <span className="h-6 w-px bg-border mx-0.5 shrink-0" />

            {/* ⚔️ Threat — Active Risk Alerts (EWS), colored by severity */}
            <Tooltip
              label={t("topbar.alerts")}
              description={
                topStats.alertCount > 0
                  ? t("topbar.alertsDesc", { count: topStats.alertCount })
                  : t("topbar.alertsNone")
              }
              className="inline-flex"
            >
              <button
                type="button"
                onClick={onAlertsClick}
                disabled={topStats.alertCount === 0}
                className={`${statSlot} ${topStats.alertCount === 0 ? "cursor-default" : "hover:bg-sidebar-ring"}`}
              >
                <Warning className={`h-4 w-4 shrink-0 ${sevClass}`} />
                <div className="leading-none text-left">
                  <p className={`text-xs font-bold tabular-nums ${sevClass}`}>{topStats.alertCount}</p>
                  <p className="text-xxxs text-muted-foreground mt-0.5">{t("topbar.alerts")}</p>
                </div>
              </button>
            </Tooltip>

            <span className="h-6 w-px bg-border mx-0.5 shrink-0" />

            {/* 📊 Resource — Average SHU per member (net SHU ÷ members) */}
            <Tooltip label={t("topbar.avgShu")} description={t("topbar.avgShuDesc")} className="inline-flex">
              <div className={statSlot}>
                <ChartBar className="h-4 w-4 text-info shrink-0" />
                <div className="leading-none">
                  <p className="text-xs font-bold text-foreground tabular-nums">{idr.format(topStats.avgShu)}</p>
                  <p className="text-xxxs text-muted-foreground mt-0.5">{t("topbar.avgShu")}</p>
                </div>
              </div>
            </Tooltip>
          </>
        )}
      </div>

      {/* ── Utility controls (right rail) ──
          Fixed-width block that mirrors the Beranda "Berita" column. */}
      <div className={`${RIGHT_RAIL} flex items-center gap-1 shrink-0 justify-end`}>
        {/* ── Preferences ── */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate("settings")}
            aria-label={t("sidebar.nav.settings")}
            title={t("sidebar.nav.settings")}
            className={`${ctrlBtn} ${activeTab === "settings" ? "text-foreground bg-sidebar-ring" : ""}`}
          >
            <Gear className="h-4 w-4" />
          </button>
          <button
            onClick={onThemeToggle}
            aria-label={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={ctrlBtn}
          >
            {appTheme === "dark" ? (
              <SunIcon className="h-4 w-4 hover:text-warning transition-colors" />
            ) : (
              <MoonIcon className="h-4 w-4 hover:text-info transition-colors" />
            )}
          </button>
        </div>

        <span className="h-6 w-px bg-border mx-2 shrink-0" />

        {/* ── Primary action + identity anchor ── */}
        <button
          onClick={() => onNavigate("sync")}
          aria-label={t("sidebar.nav.sync")}
          title={t("sidebar.nav.sync")}
          className={`${ctrlBtn} hover:text-info ${activeTab === "sync" ? "text-foreground bg-sidebar-ring" : ""}`}
        >
          <CloudCheck className="h-4 w-4" />
        </button>

        {/* ── User profile (near-right anchor) ── */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t("topbar.openProfile")}
          className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 -my-1 shrink-0 transition-colors hover:bg-sidebar-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center ring-1 ring-brand/30 group-hover:ring-brand/60 transition-colors">
            <UserCheck className="h-3.5 w-3.5 text-success" />
          </div>
          <PencilSimple className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>

        <span className="h-6 w-px bg-border mx-2 shrink-0" />

        {/* ── Session: single entry point → merged logout/quit dialog ── */}
        <button
          onClick={onOpenSession}
          aria-label={t("session.title")}
          title={t("session.title")}
          className={`${ctrlBtn} hover:text-danger`}
        >
          <SignOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
