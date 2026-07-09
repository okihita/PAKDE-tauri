import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  SquaresFour,
  UsersIcon,
  Note,
  TrendUpIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowsClockwise,
  Gear,
  WarningIcon,
  UserCheck,
  SunIcon,
  MoonIcon,
  MedalIcon,
  CalendarPlus,
  WrenchIcon,
  HandshakeIcon,
  BuildingsIcon,
  BookOpenIcon,
  FileTextIcon,
  SignOut,
  LockSimple,
  RocketLaunchIcon,
} from "@phosphor-icons/react";
import { getCurrentLevel } from "@/data/leveling";
import { Tooltip } from "@/components/ui/tooltip";
import { isTabUnlocked, getUnlockRequirementLabel } from "@/features/System/moduleUnlock";
import type { RankingStatus } from "@/features/Finance/Ranking/useRanking";
import type { CooperativeProfile, EwsAlert } from "@/types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (
    tab:
      | "home"
      | "statistics"
      | "ranking"
      | "leveling"
      | "units"
      | "equipment"
      | "sales"
      | "storelayout"
      | "development"
      | "learn"
      | "planners"
      | "participation"
      | "members"
      | "event"
      | "impact"
      | "accounting"
      | "feasibility"
      | "sync"
      | "settings",
  ) => void;
  coopProfile: CooperativeProfile | null;
  ewsAlerts: EwsAlert[];
  memberCount: number;
  currentUser: { name: string; role: string } | null;
  appTheme: "dark" | "light";
  onThemeToggle: () => void;
  onSwitchProfile: () => void;
  rankingStatus: RankingStatus;
  rankingRank: number | null;
  rankingUnlocked: boolean;
}

interface NavItemDef {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface NavGroupDef {
  id: string;
  label: string;
  accent: Accent;
  items: NavItemDef[];
}

type Accent = "sky" | "brand" | "violet" | "warning" | "amber";

/** Static class strings so Tailwind's content scanner picks them up. */
const ACCENT_CLASSES: Record<Accent, { label: string; icon: string; active: string }> = {
  sky: { label: "text-sky", icon: "text-sky", active: "bg-sky/10 text-sky border-sky/20" },
  brand: { label: "text-brand", icon: "text-brand", active: "bg-brand/10 text-brand border-brand/20" },
  violet: { label: "text-violet", icon: "text-violet", active: "bg-violet/10 text-violet border-violet/20" },
  warning: {
    label: "text-warning",
    icon: "text-warning",
    active: "bg-warning/10 text-warning border-warning/20",
  },
  amber: { label: "text-amber", icon: "text-amber", active: "bg-amber/10 text-amber border-amber/20" },
};

export default function Sidebar({
  activeTab,
  onTabChange,
  coopProfile,
  ewsAlerts,
  memberCount,
  currentUser,
  appTheme,
  onThemeToggle,
  onSwitchProfile,
  rankingStatus,
  rankingRank,
  rankingUnlocked,
}: SidebarProps) {
  const { t } = useTranslation();
  const criticalAlerts = ewsAlerts.filter((a) => a.level === "critical").length;
  const healthScore = coopProfile?.health_score ?? 0;
  const xp = coopProfile?.xp ?? 0;
  const currentLevel = getCurrentLevel(xp);

  const [logoFailed, setLogoFailed] = useState(false);
  const coopInitials = (coopProfile?.name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  // Ordered to mirror a coop's lifecycle: people → operations → money → growth.
  // Combined with per-group unlocked-first sorting, a fresh coop surfaces
  // Members → Units → Sales → Accounting as the first actionable items.
  const GROUPS: NavGroupDef[] = [
    {
      id: "komunitas",
      accent: "violet",
      label: t("sidebar.groups.komunitas"),
      items: [
        { id: "participation", icon: ChartBarIcon, label: t("sidebar.nav.participation") },
        { id: "members", icon: UsersIcon, label: t("sidebar.nav.members") },
        { id: "event", icon: CalendarPlus, label: t("sidebar.nav.event") },
        { id: "impact", icon: HandshakeIcon, label: t("sidebar.nav.impact") },
      ],
    },
    {
      id: "bisnis",
      accent: "brand",
      label: t("sidebar.groups.bisnis"),
      items: [
        { id: "units", icon: BuildingsIcon, label: t("sidebar.nav.units") },
        { id: "equipment", icon: WrenchIcon, label: t("sidebar.nav.equipment") },
        { id: "sales", icon: HandshakeIcon, label: t("sidebar.nav.sales") },
        { id: "development", icon: RocketLaunchIcon, label: t("sidebar.nav.development") },
      ],
    },
    {
      id: "keuangan",
      accent: "warning",
      label: t("sidebar.groups.keuangan"),
      items: [
        { id: "accounting", icon: Note, label: t("sidebar.nav.accounting") },
        { id: "feasibility", icon: TrendUpIcon, label: t("sidebar.nav.feasibility") },
        { id: "statistics", icon: ChartBarIcon, label: t("sidebar.nav.statistics") },
        { id: "ranking", icon: MedalIcon, label: t("sidebar.nav.ranking") },
      ],
    },
    {
      id: "learn",
      accent: "sky",
      label: t("sidebar.groups.learn"),
      items: [
        { id: "learn", icon: BookOpenIcon, label: t("sidebar.nav.learn") },
        { id: "planners", icon: FileTextIcon, label: t("sidebar.nav.planners") },
        { id: "leveling", icon: TrophyIcon, label: t("sidebar.nav.leveling") },
      ],
    },
  ];

  function renderHome() {
    const isActive = activeTab === "home";
    return (
      <button
        key="home"
        type="button"
        onClick={() => onTabChange("home")}
        className={cn(
          "flex items-center gap-2 w-full text-left px-4 py-2 rounded-lg text-xxs font-bold uppercase tracking-wider transition-colors",
          isActive ? "bg-amber/10 text-amber" : "text-amber/80 hover:bg-secondary hover:text-amber",
        )}
      >
        <SquaresFour className="h-3.5 w-3.5 shrink-0" />
        <span>{t("sidebar.nav.home")}</span>
      </button>
    );
  }

  function renderNavItem(item: NavItemDef, accent: Accent) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const unlocked = isTabUnlocked(item.id, xp);
    const unlockLabel = getUnlockRequirementLabel(item.id);
    const a = ACCENT_CLASSES[accent];

    const inner = !unlocked ? (
      <div className="flex items-center gap-3 rounded-lg px-4 py-2 transition-all text-xs font-semibold border-[0.5px] opacity-40 cursor-not-allowed text-muted-foreground border-transparent">
        <LockSimple className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-2 cursor-pointer transition-all text-xs font-semibold border-[0.5px]",
          isActive ? a.active : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent",
        )}
        onClick={() => onTabChange(item.id as never)}
      >
        <Icon className={cn("h-4 w-4 shrink-0", !isActive && a.icon)} />
        <span>{item.label}</span>
      </div>
    );

    return (
      <Tooltip
        label={item.label}
        description={unlocked ? undefined : (unlockLabel ?? undefined)}
        className="block w-full"
      >
        {inner}
      </Tooltip>
    );
  }

  function renderGroup(group: NavGroupDef) {
    const a = ACCENT_CLASSES[group.accent];
    // Unlocked (available) items float to the top of each section; locked
    // items sink below, preserving relative order within each partition.
    const sorted = [...group.items].sort((x, y) => Number(isTabUnlocked(y.id, xp)) - Number(isTabUnlocked(x.id, xp)));
    return (
      <div key={group.id} className="border-t border-border mt-1">
        <p className={cn("px-4 pt-3 pb-1 text-xxs font-bold uppercase tracking-wider", a.label)}>{group.label}</p>
        <div className="space-y-0.5">{sorted.map((item) => renderNavItem(item, group.accent))}</div>
      </div>
    );
  }

  return (
    <aside className="w-72 border-r border-border bg-sidebar flex flex-col print:hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Guild Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-border space-y-3">
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            {/* ── Identity: emblem + name (wraps, never cut off) ── */}
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-success/15 ring-1 ring-brand/30 flex items-center justify-center shrink-0 overflow-hidden">
                {coopProfile?.logo_path && !logoFailed ? (
                  <img
                    src={coopProfile.logo_path}
                    alt={coopProfile.name}
                    className="h-full w-full object-cover"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-sm font-black text-success">{coopInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-foreground leading-tight break-words">
                  {coopProfile?.name ?? "..."}
                </h2>
                {coopProfile?.village && (
                  <p className="text-xxs text-muted-foreground truncate mt-0.5">{coopProfile.village}</p>
                )}
              </div>
            </div>

            {/* ── Tier / level — full-width pill ── */}
            {currentLevel && (
              <div
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border border-current/20 ${currentLevel.bgClass} ${currentLevel.textClass}`}
              >
                <span className="text-xxs font-black uppercase tracking-wider shrink-0">{`Lv.${currentLevel.tier}`}</span>
                <span className="text-xxs font-semibold truncate">{currentLevel.labelId}</span>
              </div>
            )}

            {/* ── Vitals — health score ── */}
            {healthScore > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xxxs font-mono">
                  <span className="text-muted-foreground">{t("sidebar.healthScore")}</span>
                  <span className="text-success font-bold">{healthScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${healthScore}%` }} />
                </div>
              </div>
            )}

            {/* ── Meta — member count ── */}
            <div className="flex items-center gap-1 text-xxs text-muted-foreground">
              <UsersIcon className="h-3 w-3 shrink-0" />
              <span>{memberCount}</span>
            </div>
          </div>

          {/* Account */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0 ring-1 ring-brand/30">
              <UserCheck className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{currentUser?.name}</p>
              <p className="text-xxs text-muted-foreground truncate">{currentUser?.role}</p>
            </div>
          </div>
          {/* Meta control bar */}
          <div className="flex items-center justify-between gap-1 rounded-lg bg-secondary/40 px-1.5 py-1 mx-1">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => rankingUnlocked && onTabChange("ranking")}
                disabled={!rankingUnlocked}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-1 rounded-lg transition-colors shrink-0",
                  rankingUnlocked
                    ? "hover:bg-sidebar-ring text-muted-foreground hover:text-warning cursor-pointer"
                    : "text-muted-foreground/40 cursor-not-allowed",
                )}
                title={rankingUnlocked ? t("ranking.beaconTitle") : t("ranking.beaconLocked")}
              >
                <TrophyIcon className="h-3.5 w-3.5" />
                {rankingUnlocked && rankingRank != null && (
                  <span className="text-xxxs font-mono font-bold leading-none">{`#${rankingRank}`}</span>
                )}
                {!rankingUnlocked && <LockSimple className="h-2.5 w-2.5" />}
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    rankingStatus === "live"
                      ? "bg-success"
                      : rankingStatus === "stale"
                        ? "bg-warning"
                        : rankingStatus === "offline"
                          ? "bg-muted-foreground"
                          : "bg-info animate-pulse",
                  )}
                />
              </button>
              <button
                onClick={() => onTabChange("sync")}
                className="p-1.5 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0 text-muted-foreground hover:text-info"
                title={t("sidebar.nav.sync")}
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onTabChange("settings")}
                className="p-1.5 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0 text-muted-foreground hover:text-foreground"
                title={t("sidebar.nav.settings")}
              >
                <Gear className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onThemeToggle}
                className="p-1.5 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0"
                title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {appTheme === "dark" ? (
                  <SunIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-warning transition-colors" />
                ) : (
                  <MoonIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-info transition-colors" />
                )}
              </button>
              <button
                onClick={onSwitchProfile}
                className="p-1.5 rounded-lg hover:bg-sidebar-ring transition-colors shrink-0 text-muted-foreground hover:text-danger"
                title={t("profileSelect.switchProfile")}
              >
                <SignOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 nav-scroll">
          {renderHome()}
          {GROUPS.map(renderGroup)}
        </nav>
      </div>

      {/* ── Bottom Alerts ── */}
      {criticalAlerts > 0 && (
        <div className="border-t border-border p-4">
          <div className="px-3 py-3 rounded-xl bg-danger/5 border border-danger/10">
            <div className="flex items-center gap-2">
              <WarningIcon className="h-3 w-3 text-danger" />
              <span className="text-xxs font-mono text-danger">
                {t("sidebar.criticalAlerts", { count: criticalAlerts })}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
