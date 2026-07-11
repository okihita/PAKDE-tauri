import { useMemo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { cn, formatCompactRupiah } from "@/lib/utils";
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
  memberCount,
  netWorth,
  rankingStatus,
  rankingRank,
  rankingUnlocked,
  onOpenProfile,
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

  // Ranking tile value: live rank + freshness dot, or a lock when gated.
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
    return (
      <button
        key="home"
        type="button"
        onClick={() => onTabChange("home")}
        className={cn(
          "flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg text-xxs font-bold uppercase tracking-wider transition-colors",
          isActive ? "bg-amber/10 text-amber" : "text-amber/80 hover:bg-secondary hover:text-amber",
        )}
      >
        <SquaresFour className="h-4 w-4 shrink-0" />
        <span>{t("sidebar.nav.home")}</span>
      </button>
    );
  }

  function renderNavItem(item: NavItemDef, accent: Accent) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const unlocked = isTabUnlocked(item.id, xp);
    const a = ACCENT_CLASSES[accent];

    const inner = !unlocked ? (
      <div className="flex items-center gap-3 rounded-lg px-4 py-2 transition-all text-xs font-semibold border opacity-40 cursor-not-allowed text-muted-foreground border-transparent">
        <LockSimple className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    ) : (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-2 cursor-pointer transition-all text-xs font-semibold border",
          isActive ? a.active : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent",
        )}
        onClick={() => onTabChange(item.id)}
      >
        <Icon className={cn("h-4 w-4 shrink-0", !isActive && a.icon)} />
        <span>{item.label}</span>
      </div>
    );

    return inner;
  }

  function renderGroup(group: NavGroupDef) {
    const a = ACCENT_CLASSES[group.accent];
    return (
      <div key={group.id} className="border-t border-border mt-1">
        <p className={cn("px-4 pt-3 pb-1 text-xxs font-bold uppercase tracking-wider", a.label)}>{group.label}</p>
        <div className="space-y-0.5">{group.items.map((item) => renderNavItem(item, group.accent))}</div>
      </div>
    );
  }

  return (
    <aside className="w-72 border-r border-border bg-sidebar flex flex-col print:hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── Guild Header ── */}
        <div className="px-3 pt-4 pb-3 border-b border-border">
          <div className="rounded-xl bg-card border border-border p-4">
            {/* ── Profile block: click to open Profil Organisasi ── */}
            <button
              type="button"
              onClick={onOpenProfile}
              disabled={!coopProfile}
              aria-label={t("sidebar.openProfile")}
              className="group block w-full text-left rounded-lg transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand space-y-3"
            >
              {/* ── Identity: emblem + name (wraps, never cut off) ── */}
              <div className="flex items-center gap-3">
                <CoopEmblem profile={coopProfile} size="md" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-foreground leading-tight break-words">
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
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-current/20 ${currentLevel.bgClass} ${currentLevel.textClass}`}
                    >
                      <span className="text-xxs font-black uppercase tracking-wider shrink-0">{`Lv.${currentLevel.tier}`}</span>
                      <div className="h-3 flex-1 rounded-full bg-secondary/50 overflow-hidden relative">
                        <div
                          className="absolute inset-0 h-full rounded-full bg-current/25 transition-all duration-500"
                          style={{ width: `${prog.percent}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xxxs font-mono font-bold">
                          {prog.xp}/{prog.maxXp}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              {/* ── Health — single-row RAG pill ── */}
              {healthScore > 0 && (
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-secondary/40 border border-border">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rag.dotClass}`} />
                  <span className={`text-xxs font-semibold truncate ${rag.textClass}`}>{t(rag.ratingKey)}</span>
                  <span className={`text-xxs font-mono font-bold shrink-0 ${rag.textClass}`}>{healthScore}%</span>
                  <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rag.barClass} transition-all duration-500`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
              )}
            </button>

            {/* ── Quick stats — clickable cooperative scorecard ── */}
            <div className="grid grid-cols-2 gap-2 mt-3">
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
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 nav-scroll">
          {renderHome()}
          {GROUPS.map(renderGroup)}
        </nav>
      </div>
    </aside>
  );
}
