import { useMemo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { cn, formatCompactRupiah, IS_MAC } from "@/lib/utils";
import { resolveRag, ragMeta } from "@/lib/rag";
import {
  SquaresFour,
  UsersIcon,
  Note,
  TrendUpIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarPlus,
  WarehouseIcon,
  HandshakeIcon,
  BuildingsIcon,
  BookOpenIcon,
  LockSimple,
  RocketLaunchIcon,
  Coins,
  HandCoins,
  PencilSimple,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { CoopEmblem } from "./CoopEmblem";
import { getCurrentLevel, getLevelProgress } from "@/data/leveling";
import {
  isTabUnlocked,
  getUnlockRequirementLabel,
  TABS_LEVEL_REQUIREMENTS,
  type TabId,
} from "@/features/System/moduleUnlock";
import { UNIT_ICONS, UNIT_CONFIG } from "@/features/System/ProfileSelect/unitIcons";
import { QuickStat } from "./QuickStat";
import type { RankingStatus } from "@/features/Finance/Ranking/useRanking";
import type { CooperativeProfile } from "@/types";

import { Tooltip } from "@/components/ui/tooltip";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  coopProfile: CooperativeProfile | null;
  memberCount: number;
  netWorth: number;
  rankingStatus: RankingStatus;
  rankingRank: number | null;
  rankingUnlocked: boolean;
  onOpenProfile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItemDef {
  id: TabId;
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

const isMac = IS_MAC;
const shortcutText = isMac ? "⌘B" : "Ctrl+B";
const LBL_EXPAND_SIDEBAR = `Buka Sidebar (${shortcutText})`;
const LBL_COLLAPSE_SIDEBAR = `Tutup Sidebar (${shortcutText})`; /** Static class strings so Tailwind's content scanner picks them up. */
const ACCENT_CLASSES: Record<Accent, { label: string; icon: string; active: string }> = {
  sky: { label: "text-sky", icon: "text-sky", active: "bg-sky/10 text-sky border-sky/20" },
  brand: { label: "text-brand", icon: "text-brand", active: "bg-brand/10 text-brand border-brand/20" },
  violet: { label: "text-violet", icon: "text-violet", active: "bg-violet/10 text-violet border-violet/20" },
  warning: { label: "text-warning", icon: "text-warning", active: "bg-warning/10 text-warning border-warning/20" },
  amber: { label: "text-amber", icon: "text-amber", active: "bg-amber/10 text-amber border-amber/20" },
};

export default function Sidebar({
  activeTab,
  onTabChange,
  coopProfile,
  memberCount,
  netWorth,
  rankingStatus,
  rankingRank,
  rankingUnlocked,
  onOpenProfile,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { t } = useTranslation();

  const healthScore = coopProfile?.health_score ?? 0;
  const xp = coopProfile?.xp ?? 0;
  const currentLevel = getCurrentLevel(xp);

  // Operational health → RAG band (single source of truth, translation-aware).
  const ragBand = resolveRag(coopProfile?.rag_status, healthScore);
  const rag = ragMeta(ragBand);

  // Active business unit IDs from the cooperative profile (registry).
  const unitIds = useMemo(() => {
    try {
      const arr = JSON.parse(coopProfile?.business_units || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, [coopProfile]);

  // Tabs the quick-stat tiles can navigate to (gated by progression xp).
  const acctUnlocked = isTabUnlocked("accounting", xp);

  // Business-unit icons (falls back to Buildings for custom units).
  const unitValue = (() => {
    if (unitIds.length === 0) return <span className="text-muted-foreground">—</span>;
    const shown = unitIds.slice(0, 4);
    return (
      <span className="flex items-center gap-1">
        {shown.map((id) => {
          const Ico = UNIT_ICONS[id] ?? BuildingsIcon;
          const name = UNIT_CONFIG[id]?.label ?? id;
          return (
            <span key={id} title={name} className="inline-flex">
              <Ico className="h-3.5 w-3.5 text-foreground" />
            </span>
          );
        })}
        {unitIds.length > 4 && <span className="text-xxxs font-mono text-muted-foreground">+{unitIds.length - 4}</span>}
      </span>
    );
  })();

  // Net worth tile value (lock when accounting is still gated).
  const netWorthValue = acctUnlocked ? (
    formatCompactRupiah(netWorth)
  ) : (
    <LockSimple className="h-3.5 w-3.5 text-muted-foreground" />
  );

  const rankingStatusDot = cn(
    "h-1.5 w-1.5 rounded-full",
    rankingStatus === "live"
      ? "bg-success"
      : rankingStatus === "stale"
        ? "bg-warning"
        : rankingStatus === "offline"
          ? "bg-muted-foreground"
          : "bg-info animate-pulse",
  );
  const rankingValue =
    rankingUnlocked && rankingRank != null ? (
      <span className="flex items-center gap-1">
        #{rankingRank}
        <span className={rankingStatusDot} />
      </span>
    ) : (
      <LockSimple className="h-3.5 w-3.5 text-muted-foreground" />
    );

  // The array order inside each group IS the display order. Decoupled from
  // unlock thresholds on purpose: changing a tab's gating level must never
  // silently reshuffle the menu. Ordered to mirror a coop's lifecycle:
  // people → operations → money → growth.
  const GROUPS: NavGroupDef[] = [
    {
      id: "komunitas",
      accent: "violet",
      label: t("sidebar.groups.komunitas"),
      items: [
        { id: "anggota", icon: UsersIcon, label: t("sidebar.nav.anggota") },
        { id: "kegiatan", icon: CalendarPlus, label: t("sidebar.nav.kegiatan") },
        { id: "dampak", icon: HandshakeIcon, label: t("sidebar.nav.dampak") },
      ],
    },
    {
      id: "bisnis",
      accent: "brand",
      label: t("sidebar.groups.bisnis"),
      items: [
        { id: "units", icon: BuildingsIcon, label: t("sidebar.nav.units") },
        { id: "sales", icon: HandshakeIcon, label: t("sidebar.nav.sales") },
        { id: "asetFisik", icon: WarehouseIcon, label: t("sidebar.nav.asetFisik") },
        { id: "development", icon: RocketLaunchIcon, label: t("sidebar.nav.development") },
      ],
    },
    {
      id: "keuangan",
      accent: "warning",
      label: t("sidebar.groups.keuangan"),
      items: [
        { id: "statistics", icon: ChartBarIcon, label: t("sidebar.nav.statistics") },
        { id: "accounting", icon: Note, label: t("sidebar.nav.accounting") },
        { id: "feasibility", icon: TrendUpIcon, label: t("sidebar.nav.feasibility") },
        { id: "hibah", icon: HandCoins, label: t("sidebar.nav.hibah") },
      ],
    },
    {
      id: "learn",
      accent: "sky",
      label: t("sidebar.groups.learn"),
      items: [
        { id: "leveling", icon: TrophyIcon, label: t("sidebar.nav.leveling") },
        { id: "learn", icon: BookOpenIcon, label: t("sidebar.nav.learn") },
      ],
    },
  ];

  // Invariant: every sidebar item must have an unlock threshold in the single
  // source of truth (moduleUnlock). Catches typos / orphan tabs at runtime.
  const orphanIds = GROUPS.flatMap((g) => g.items.map((i) => i.id)).filter((id) => !(id in TABS_LEVEL_REQUIREMENTS));
  if (orphanIds.length) {
    console.error("[sidebar] menu items missing unlock threshold:", orphanIds);
  }

  function renderHome() {
    const isActive = activeTab === "home";
    const label = t("sidebar.nav.home");
    if (isCollapsed) {
      return (
        <Tooltip key="home" label={label} side="right" className="flex justify-center my-1">
          <button
            type="button"
            onClick={() => onTabChange("home")}
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              isActive
                ? "bg-amber/10 text-amber border-amber/20"
                : "text-amber/80 hover:bg-secondary hover:text-amber border-transparent",
            )}
          >
            <SquaresFour className="h-4 w-4 shrink-0" />
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key="home"
        type="button"
        onClick={() => onTabChange("home")}
        className={cn(
          "flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg text-xxs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand whitespace-nowrap",
          isActive ? "bg-amber/10 text-amber" : "text-amber/80 hover:bg-secondary hover:text-amber",
        )}
      >
        <SquaresFour className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  function renderNavItem(item: NavItemDef, accent: Accent) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const unlocked = isTabUnlocked(item.id, xp);
    const a = ACCENT_CLASSES[accent];
    const reqLabel = !unlocked ? (getUnlockRequirementLabel(item.id) ?? undefined) : undefined;

    if (isCollapsed) {
      return (
        <Tooltip
          key={item.id}
          label={item.label}
          description={reqLabel}
          side="right"
          className="flex justify-center my-1"
        >
          <button
            type="button"
            onClick={unlocked ? () => onTabChange(item.id) : undefined}
            disabled={!unlocked}
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              !unlocked
                ? "opacity-40 cursor-not-allowed border-transparent text-muted-foreground"
                : isActive
                  ? a.active
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent",
            )}
          >
            {!unlocked ? (
              <LockSimple className="h-4 w-4 shrink-0" />
            ) : (
              <Icon className={cn("h-4 w-4 shrink-0", !isActive && a.icon)} />
            )}
          </button>
        </Tooltip>
      );
    }

    const inner = !unlocked ? (
      <div className="flex items-center gap-3 rounded-lg px-4 py-2 transition-all text-xs font-semibold border opacity-40 cursor-not-allowed text-muted-foreground border-transparent whitespace-nowrap">
        <LockSimple className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => onTabChange(item.id)}
        className={cn(
          "w-full text-left flex items-center gap-3 rounded-lg px-4 py-2 cursor-pointer transition-all text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand whitespace-nowrap",
          isActive ? a.active : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", !isActive && a.icon)} />
        <span>{item.label}</span>
      </button>
    );

    return inner;
  }

  function renderGroup(group: NavGroupDef) {
    const a = ACCENT_CLASSES[group.accent];
    return (
      <div key={group.id} className={cn("border-t border-border mt-1", isCollapsed && "pt-1")}>
        {!isCollapsed && (
          <p className={cn("px-4 pt-3 pb-1 text-xxs font-bold uppercase tracking-wider whitespace-nowrap", a.label)}>
            {group.label}
          </p>
        )}
        <div className="space-y-0.5">{group.items.map((item) => renderNavItem(item, group.accent))}</div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "relative border-r border-border bg-sidebar flex flex-col print:hidden shrink-0 select-none",
        isCollapsed ? "w-16 overflow-visible" : "w-72 overflow-x-hidden",
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Guild Header ── */}
        <div className="px-2 pt-3 pb-2 border-b border-border">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Tooltip label={coopProfile?.name ?? "Profil Co-op"} side="right">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  disabled={!coopProfile}
                  className="group p-1 rounded-lg hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <CoopEmblem profile={coopProfile} size="sm" />
                </button>
              </Tooltip>
              {currentLevel && (
                <span
                  className={`text-xxxs font-black uppercase px-1 py-0.5 rounded border border-current/20 ${currentLevel.bgClass} ${currentLevel.textClass}`}
                >
                  {`L${currentLevel.tier}`}
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-3 relative">
              {/* ── Profile block: click to open Profil Organisasi ── */}
              <button
                type="button"
                onClick={onOpenProfile}
                disabled={!coopProfile}
                aria-label={t("sidebar.openProfile")}
                className="group block w-full text-left rounded-lg transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand space-y-2"
              >
                {/* ── Identity: emblem + name ── */}
                <div className="flex items-center gap-2.5">
                  <CoopEmblem profile={coopProfile} size="md" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-bold text-foreground leading-tight truncate">
                      {coopProfile?.name ?? "..."}
                    </h2>
                  </div>
                  <PencilSimple className="h-3.5 w-3.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                {/* ── Level — single-row pill with progress bar ── */}
                {currentLevel &&
                  (() => {
                    const prog = getLevelProgress(currentLevel, xp);
                    return (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 border border-current/20 ${currentLevel.bgClass} ${currentLevel.textClass}`}
                      >
                        <span className="text-xxs font-black uppercase tracking-wider shrink-0">{`Lv.${currentLevel.tier}`}</span>
                        <div className="h-2.5 flex-1 rounded-full bg-secondary/50 overflow-hidden relative">
                          <div
                            className="absolute inset-0 h-full rounded-full bg-current/25 transition-all duration-500"
                            style={{ width: `${prog.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                {/* ── Health — single-row RAG pill ── */}
                {healthScore > 0 && (
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1 bg-secondary/40 border border-border">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rag.dotClass}`} />
                    <span className={`text-xxs font-semibold truncate ${rag.textClass}`}>{t(rag.ratingKey)}</span>
                    <span className={`text-xxs font-mono font-bold shrink-0 ${rag.textClass}`}>{healthScore}%</span>
                  </div>
                )}
              </button>

              {/* ── Quick stats ── */}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <QuickStat
                  icon={UsersIcon}
                  label={t("sidebar.statMembers")}
                  value={memberCount.toString()}
                  onClick={() => onTabChange("anggota")}
                  title={t("sidebar.goTo", { tab: t("sidebar.nav.anggota") })}
                />
                <QuickStat
                  icon={BuildingsIcon}
                  label={t("sidebar.statUnits")}
                  value={unitValue}
                  onClick={() => onTabChange("units")}
                  title={t("sidebar.goTo", { tab: t("sidebar.nav.units") })}
                />
                <QuickStat
                  icon={Coins}
                  label={t("sidebar.statNetWorth")}
                  value={netWorthValue}
                  onClick={acctUnlocked ? () => onTabChange("accounting") : undefined}
                  disabled={!acctUnlocked}
                  title={
                    acctUnlocked
                      ? t("sidebar.goTo", { tab: t("sidebar.nav.accounting") })
                      : (getUnlockRequirementLabel("accounting") ?? undefined)
                  }
                />
                <QuickStat
                  icon={TrophyIcon}
                  label={t("sidebar.statRanking")}
                  value={rankingValue}
                  onClick={rankingUnlocked ? () => onTabChange("ranking") : undefined}
                  disabled={!rankingUnlocked}
                  title={
                    rankingUnlocked
                      ? t("sidebar.goTo", { tab: t("ranking.beaconTitle") })
                      : (getUnlockRequirementLabel("ranking") ?? undefined)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className={cn("flex-1", isCollapsed ? "p-1.5 overflow-visible" : "p-3 overflow-y-auto nav-scroll")}>
          {renderHome()}
          {GROUPS.map(renderGroup)}
        </nav>

        {/* ── Sidebar Bottom Footer ── */}
        <div
          className={cn(
            "border-t border-border shrink-0 bg-sidebar",
            isCollapsed ? "p-1.5 flex justify-center" : "p-2",
          )}
        >
          {isCollapsed ? (
            <Tooltip label={LBL_EXPAND_SIDEBAR} side="right">
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label={LBL_EXPAND_SIDEBAR}
                className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CaretRight className="h-4 w-4 shrink-0" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand whitespace-nowrap"
            >
              <span>{LBL_COLLAPSE_SIDEBAR}</span>
              <CaretLeft className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
