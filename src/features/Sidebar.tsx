import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  Shield,
  MedalIcon,
  CaretDownIcon,
  CaretRightIcon,
  ChartLine,
  WalletIcon,
  CalendarPlus,
  WrenchIcon,
  HandshakeIcon,
  BuildingsIcon,
  BookOpenIcon,
  FileTextIcon,
  SignOut,
  MapPinIcon,
  LockSimple,
} from "@phosphor-icons/react";
import { getCurrentLevel } from "@/data/leveling";
import { isTabUnlocked, getUnlockRequirementLabel } from "@/features/Sidebar/moduleUnlock";
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
}

interface NavItemDef {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavGroupDef {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: NavItemDef[];
}

const COLLAPSE_KEY = "pakde-sidebar-groups";

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
}: SidebarProps) {
  const { t } = useTranslation();
  const criticalAlerts = ewsAlerts.filter((a) => a.level === "critical").length;
  const healthScore = coopProfile?.health_score ?? 0;
  const currentLevel = healthScore > 0 ? getCurrentLevel(healthScore) : null;

  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...collapsed]));
  }, [collapsed]);

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const GROUPS: NavGroupDef[] = [
    {
      id: "analitik",
      icon: ChartLine,
      label: t("sidebar.groups.analitik"),
      items: [
        { id: "statistics", icon: ChartBarIcon, label: t("sidebar.nav.statistics") },
        { id: "ranking", icon: MedalIcon, label: t("sidebar.nav.ranking") },
        { id: "leveling", icon: TrophyIcon, label: t("sidebar.nav.leveling") },
      ],
    },
    {
      id: "bisnis",
      icon: TrendUpIcon,
      label: t("sidebar.groups.bisnis"),
      items: [
        { id: "units", icon: BuildingsIcon, label: t("sidebar.nav.units") },
        { id: "equipment", icon: WrenchIcon, label: t("sidebar.nav.equipment") },
        { id: "sales", icon: HandshakeIcon, label: t("sidebar.nav.sales") },
        { id: "storelayout", icon: MapPinIcon, label: t("sidebar.nav.storeLayout") },
        { id: "development", icon: BuildingsIcon, label: t("sidebar.nav.development") },
      ],
    },
    {
      id: "komunitas",
      icon: UsersIcon,
      label: t("sidebar.groups.komunitas"),
      items: [
        { id: "participation", icon: ChartBarIcon, label: t("sidebar.nav.participation") },
        { id: "members", icon: UsersIcon, label: t("sidebar.nav.members") },
        { id: "event", icon: CalendarPlus, label: t("sidebar.nav.event") },
        { id: "impact", icon: HandshakeIcon, label: t("sidebar.nav.impact") },
      ],
    },
    {
      id: "keuangan",
      icon: WalletIcon,
      label: t("sidebar.groups.keuangan"),
      items: [
        { id: "accounting", icon: Note, label: t("sidebar.nav.accounting") },
        { id: "feasibility", icon: TrendUpIcon, label: t("sidebar.nav.feasibility") },
      ],
    },
    {
      id: "learn",
      icon: BookOpenIcon,
      label: t("sidebar.groups.learn"),
      items: [
        { id: "learn", icon: BookOpenIcon, label: t("sidebar.nav.learn") },
        { id: "planners", icon: FileTextIcon, label: t("sidebar.nav.planners") },
      ],
    },
    {
      id: "sistem",
      icon: Gear,
      label: t("sidebar.groups.sistem"),
      items: [
        { id: "sync", icon: ArrowsClockwise, label: t("sidebar.nav.sync") },
        { id: "settings", icon: Gear, label: t("sidebar.nav.settings") },
      ],
    },
  ];

  const HOME_ITEM: NavItemDef = { id: "home", icon: SquaresFour, label: t("sidebar.nav.home") };

  function renderNavItem(item: NavItemDef, isChild = false) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const unlocked = isTabUnlocked(item.id, healthScore);
    const unlockLabel = getUnlockRequirementLabel(item.id);

    if (!unlocked) {
      return (
        <div
          key={item.id}
          title={unlockLabel || undefined}
          className={`flex items-center gap-3 rounded-lg transition-all text-xs font-semibold border-[0.5px] opacity-40 cursor-not-allowed text-muted-foreground border-transparent ${isChild ? "px-4 ml-3 py-2" : "px-4 py-3"}`}
        >
          <LockSimple className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 rounded-lg cursor-pointer transition-all text-xs font-semibold border-[0.5px] ${
          isActive
            ? "bg-success/10 text-success border-success/20"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent"
        } ${isChild ? "px-4 ml-3 py-2" : "px-4 py-3"}`}
        onClick={() => onTabChange(item.id as never)}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </div>
    );
  }

  function renderGroup(group: NavGroupDef) {
    const isCollapsed = collapsed.has(group.id);
    const GroupIcon = group.icon;
    return (
      <div key={group.id} className="space-y-0.5">
        {/* Group header */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-xxs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => toggleGroup(group.id)}
        >
          <GroupIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{group.label}</span>
          {isCollapsed ? <CaretRightIcon className="h-3 w-3" /> : <CaretDownIcon className="h-3 w-3" />}
        </div>
        {/* Group items */}
        {!isCollapsed && group.items.map((item) => renderNavItem(item, true))}
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col justify-between print:hidden">
      <div>
        {/* ── Guild Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-border space-y-3">
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="h-3.5 w-3.5 text-success shrink-0" />
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
            {currentLevel && (
              <p className="text-xxs font-mono text-muted-foreground uppercase tracking-wider">
                {currentLevel.labelId} · {currentLevel.labelEn}
              </p>
            )}
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
            <div className="flex items-center gap-2 text-xxs text-muted-foreground">
              <span className="flex items-center gap-1">
                <UsersIcon className="h-3 w-3 shrink-0" />
                <span>{memberCount}</span>
              </span>
              <span className="text-border">|</span>
              <span className="text-xxxs font-mono truncate">
                {coopProfile?.village}
                {coopProfile?.regency ? `, ${coopProfile.regency}` : ""}
              </span>
            </div>
          </div>

          {/* UserIcon Profile Row */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shrink-0 ring-1 ring-brand/30">
              <UserCheck className="h-4 w-4 text-success" />
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

        {/* ── Navigation ── */}
        <nav className="p-3 space-y-1">
          {renderNavItem(HOME_ITEM)}
          <div className="border-t border-border my-2" />
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
