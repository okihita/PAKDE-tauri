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
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { formatCompactRupiah, IS_MAC } from "@/lib/utils";
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
  onOpenPalette: () => void;
}

const RIGHT_RAIL = "w-auto flex items-center justify-end gap-2 shrink-0 pl-1";

const statSlot =
  "flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-sidebar-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors shrink-0 cursor-default";

export default function TopBar({
  activeTab,
  onNavigate,
  currentUser,
  appTheme,
  onThemeToggle,
  onOpenProfile,
  onOpenSession,
  topStats,
  onAlertsClick,
  onOpenPalette,
}: TopBarProps) {
  const { t } = useTranslation();

  const isMac = IS_MAC;

  const ctrlBtn =
    "p-2 rounded-lg hover:bg-sidebar-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand transition-colors shrink-0 text-muted-foreground";

  const sevClass =
    topStats?.worstSeverity === "critical"
      ? "text-danger"
      : topStats?.worstSeverity === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div className="bg-sidebar border-b border-border flex items-center justify-between gap-3 px-4 xl:px-6 h-12 shrink-0 select-none print:hidden z-40 relative">
      {/* ── Live stat cluster (left) ── */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        {topStats && (
          <>
            {/* 💰 Resource — Net Worth (Primary vital) */}
            <div className="flex items-center">
              <Tooltip label={t("topbar.netWorth")} description={t("topbar.netWorthDesc")} className="inline-flex">
                <div className={statSlot} tabIndex={0}>
                  <Coins className="h-4 w-4 text-success shrink-0" />
                  <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                    <span className="hidden lg:inline">Rp </span>
                    {formatCompactRupiah(topStats.netWorth, true)}
                  </span>
                </div>
              </Tooltip>
            </div>

            {/* ⚔️ Threat — Risk Alerts (Primary vital) */}
            <div className="flex items-center">
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
                  className={`${statSlot} ${
                    topStats.alertCount > 0
                      ? "bg-warning/10 border border-warning/30 hover:bg-warning/20 cursor-pointer animate-pulse"
                      : "opacity-75 cursor-default"
                  }`}
                >
                  <Warning className={`h-4 w-4 shrink-0 ${sevClass}`} />
                  <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${sevClass}`}>
                    {topStats.alertCount}
                    <span className="hidden lg:inline"> {t("topbar.alerts")}</span>
                  </span>
                </button>
              </Tooltip>
            </div>

            {/* 🔥 Morale — Community Liveliness (Secondary metric - visible on lg+) */}
            <div className="hidden lg:flex items-center">
              <span className="h-4 w-px bg-border/60 mx-1 shrink-0" />
              <Tooltip
                label={t("topbar.liveliness")}
                description={t("topbar.livelinessDesc", {
                  count: topStats.eventCount,
                  avg: topStats.avgParticipants.toFixed(1),
                })}
                className="inline-flex"
              >
                <div className={statSlot} tabIndex={0}>
                  <Fire className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                    {topStats.eventCount}
                    <span className="hidden lg:inline"> {t("topbar.events")}</span>
                  </span>
                </div>
              </Tooltip>
            </div>

            {/* 📊 Resource — Average SHU (Secondary metric - visible on xl+) */}
            <div className="hidden xl:flex items-center">
              <span className="h-4 w-px bg-border/60 mx-1 shrink-0" />
              <Tooltip label={t("topbar.avgShu")} description={t("topbar.avgShuDesc")} className="inline-flex">
                <div className={statSlot} tabIndex={0}>
                  <ChartBar className="h-4 w-4 text-info shrink-0" />
                  <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                    <span className="hidden lg:inline">Rp </span>
                    {formatCompactRupiah(topStats.avgShu, true)}
                  </span>
                </div>
              </Tooltip>
            </div>
          </>
        )}
      </div>

      {/* ── Command palette trigger (center) ── */}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label={t("commandPalette.placeholder")}
        className="group flex items-center gap-2 min-w-0 max-w-[200px] xl:max-w-md flex-1 mx-2 px-3 py-1.5 rounded-lg border border-slate-800/80 bg-slate-950/70 text-slate-400 hover:border-brand/40 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand shrink-0"
      >
        <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 group-hover:text-brand transition-colors" />
        <span className="text-xs truncate">{t("commandPalette.placeholder")}</span>
        <kbd className="ml-auto text-xxxs font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0 group-hover:border-brand/30 transition-colors hidden lg:inline-block">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      {/* ── Utility controls (right rail) ── */}
      <div className={RIGHT_RAIL}>
        {/* Preferences */}
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

        <div className="flex items-center gap-1">
          {/* Sync Action */}
          <button
            onClick={() => onNavigate("sync")}
            aria-label={t("sidebar.nav.sync")}
            title={t("sidebar.nav.sync")}
            className={`${ctrlBtn} hover:text-info ${activeTab === "sync" ? "text-foreground bg-sidebar-ring" : ""}`}
          >
            <CloudCheck className="h-4 w-4" />
          </button>

          <span className="h-5 w-px bg-border/60 mx-1 shrink-0" />

          {/* User Profile Identity Pill */}
          {(() => {
            const firstName = currentUser?.name ? currentUser.name.trim().split(/\s+/)[0] : t("topbar.openProfile");
            return (
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label={t("topbar.openProfile")}
                title={
                  currentUser?.name ? `${currentUser.name} (${currentUser.role ?? "User"})` : t("topbar.openProfile")
                }
                className="group flex items-center gap-2 rounded-lg px-2 py-1 -my-1 shrink-0 transition-colors hover:bg-sidebar-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center ring-1 ring-brand/30 group-hover:ring-brand/60 transition-colors text-xs font-bold text-success">
                  {currentUser?.name ? (
                    currentUser.name.charAt(0).toUpperCase()
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-success" />
                  )}
                </div>
                <div className="text-left hidden xl:block max-w-[85px] leading-tight min-w-0">
                  <p className="text-xxs font-bold text-foreground truncate font-sans">{firstName}</p>
                  <p className="text-xxxs text-muted-foreground uppercase tracking-wider truncate font-sans">
                    {currentUser?.role ?? "User"}
                  </p>
                </div>
                <PencilSimple className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            );
          })()}

          <span className="h-5 w-px bg-border/60 mx-1 shrink-0" />

          {/* Session Control */}
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
    </div>
  );
}
