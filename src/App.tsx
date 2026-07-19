import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "@/i18n"; // initialize i18next before render
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import {
  listCooperatives,
  getCooperativeById,
  getMemberCount,
  getActiveEwsAlerts,
  getNetWorth,
  getTopBarStats,
  type TopBarStats,
} from "@/features/System/ProfileSelect/cooperativeDb";
import { getUsersByCooperativeId } from "@/features/System/ProfileSelect/userDb";
import { isTabUnlocked, type TabId } from "@/features/System/moduleUnlock";
import { ToastProvider } from "@/hooks/useToast";
import { useDisableDebugMenu } from "@/hooks/useDisableDebugMenu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import { IconProvider } from "@/components/IconContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CommandPaletteDialog, { type CommandAction } from "@/components/ui/command-palette/CommandPaletteDialog";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { requestOpenMember, requestAddMember } from "@/lib/commandPaletteEvents";
import { Button } from "@/components/ui/button";
import {
  SignOut,
  XCircle,
  WarningIcon,
  CalendarPlus,
  UserPlusIcon,
  SunIcon,
  MoonIcon,
  TranslateIcon,
  CloudCheck,
  Gear,
  UserCircleIcon,
  SquaresFour,
  UsersIcon,
  ChartBarIcon,
  Note,
  WarehouseIcon,
  BuildingsIcon,
  HandshakeIcon,
  TrendUpIcon,
  HandCoins,
  TrophyIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  Coins,
} from "@phosphor-icons/react";
import DbErrorScreen from "@/features/System/DbErrorScreen/DbErrorScreen";
import Sidebar from "@/features/System/Sidebar";
import TopBar from "@/features/System/TopBar";
import Dashboard from "@/features/Home/Dashboard/Dashboard";
import Statistics from "@/features/Finance/Statistics/Statistics";
import Leveling from "@/features/Learn/Leveling/Leveling";
import Members from "@/features/Community/Members/Members";
import Units from "@/features/Business/Units/Units";
import Assets from "@/features/Business/Assets/Assets";
import Sales from "@/features/Business/Sales/Sales";
import Development from "@/features/Business/Development/Development";
import Learn from "@/features/Learn/Learn/Learn";
import Accounting from "@/features/Finance/Accounting";
import Feasibility from "@/features/Finance/Feasibility/Feasibility";
import Hibah from "@/features/Finance/Hibah/Hibah";
import Ranking from "@/features/Finance/Ranking/Ranking";
import { useRanking } from "@/features/Finance/Ranking/useRanking";
import CreateEvent from "@/features/Community/CreateEvent/CreateEvent";
import Dampak from "@/features/Community/Dampak/Dampak";
import Sync from "@/features/System/Sync/Sync";
import Settings from "@/features/System/Settings/Settings";
import CoopProfileModal from "@/features/System/CoopProfileModal";
import UserProfileModal from "@/features/System/UserProfileModal";
import ProfileSelect from "@/features/System/ProfileSelect/ProfileSelect";
import { useUpdater } from "@/hooks/useUpdater";
import { useGlobalSfx } from "@/hooks/useGlobalSfx";
import BackupFileOpenHandler from "@/features/System/Backup/BackupFileOpenHandler";
import { takeAutoBackup, isAutoBackupEnabled, AUTO_BACKUP_INTERVAL_MS } from "@/features/System/Backup/autoBackup";
import { reportError } from "@/lib/reportError";
import { IS_MAC } from "@/lib/utils";
import CreateUserProfile from "@/features/System/ProfileSelect/CreateUserProfile";
import UserSignIn from "@/features/System/ProfileSelect/UserSignIn";

import { type CooperativeProfile, type EwsAlert, type LocalUser } from "@/types";
import { isDemoCooperative } from "@/db/seed-demo";
import { getActiveCoopId } from "@/db/active-coop";
import { initDb } from "@/db";

type FontLevel = "small" | "normal" | "large" | "xlarge";
const FONT_LEVELS: FontLevel[] = ["small", "normal", "large", "xlarge"];
const FONT_LEVEL_DEFAULT: FontLevel = "normal";
const TITLEBAR_TEXT = "PAKDE";
const LBL_CANCEL = "Batal";
const LBL_QUIT = "Tutup Aplikasi";
const LBL_QUIT_BTN = "QUIT";
const isMac = IS_MAC;
const LBL_QUIT_CONFIRM = "Apakah Anda yakin ingin menutup aplikasi?";
const LBL_ALERT_ATTENTION = "Perlu perhatian segera";

function quitApp() {
  exit(0);
}

function AppContent() {
  useDisableDebugMenu();
  const { t } = useTranslation();
  const [appState, setAppState] = useState<"profile_select" | "user_signin" | "user_create" | "main" | "db_error">(
    "profile_select",
  );
  useGlobalSfx(appState === "main");
  const [dbErrorMessage, setDbErrorMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [financeTier, setFinanceTier] = useState<"simplified" | "standard" | "advanced">(() => {
    return (localStorage.getItem("pakde-finance-tier") as "simplified" | "standard" | "advanced") || "simplified";
  });
  const [appTheme, setAppTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("pakde-theme") as "dark" | "light") || "dark";
  });
  const [fontSizeSetting, setFontSizeSetting] = useState<FontLevel>(() => {
    const saved = localStorage.getItem("pakde-font-size") as FontLevel | null;
    return saved && FONT_LEVELS.includes(saved) ? saved : FONT_LEVEL_DEFAULT;
  });
  const [coopProfile, setCoopProfile] = useState<CooperativeProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [ewsAlerts, setEwsAlerts] = useState<EwsAlert[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [topStats, setTopStats] = useState<TopBarStats | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  // Helper for responsive sidebar collapse with a hard viewport safety floor (< 1024px).
  const computeSidebarCollapsed = useCallback((width: number, userPref: string | null): boolean => {
    if (width < 1024) return true;
    if (userPref !== null) return userPref === "true";
    return width < 1280;
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const userPref = typeof window !== "undefined" ? localStorage.getItem("pakde-sidebar-collapsed") : null;
    const width = typeof window !== "undefined" ? window.innerWidth : 1400;
    if (width < 1024) return true;
    if (userPref !== null) return userPref === "true";
    return width < 1280;
  });

  useEffect(() => {
    const handleResize = () => {
      const userPref = localStorage.getItem("pakde-sidebar-collapsed");
      setSidebarCollapsed(computeSidebarCollapsed(window.innerWidth, userPref));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [computeSidebarCollapsed]);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pakde-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  // Update lifecycle — owned at the app root so the title screen can surface an
  // "Update available" banner and a manual check button without a login gate.
  const updater = useUpdater();

  // Global command palette (Cmd/Ctrl+K, "/").
  const palette = useCommandPalette();

  // Sync font-size setting to <html> and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSizeSetting);
    localStorage.setItem("pakde-font-size", fontSizeSetting);
  }, [fontSizeSetting]);

  useEffect(() => {
    localStorage.setItem("pakde-theme", appTheme);
    if (appTheme === "dark") {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [appTheme]);

  // Return to the profile-selection (title) screen. Stable; safe to reference
  // from the Escape handler below.
  const handleSwitchProfile = useCallback(() => {
    setCoopProfile(null);
    localStorage.removeItem("pakde-active-profile-id");
    setAppState("profile_select");
  }, []);

  // Open the merged session dialog (logout / quit app / cancel). Stable.
  const openSessionDialog = useCallback(() => {
    setShowSessionDialog(true);
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl + +/-/0 to zoom font, Escape to return home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: return to profile selection — never quit. Quitting is the
      // explicit QUIT button only.
      if (e.key === "Escape") {
        // 1. A confirmation dialog is already open → let it close itself
        //    (highest priority). Its onEscapeKeyDown is prevented, so we
        //    must close it here.
        if (showQuitConfirm) {
          e.preventDefault();
          e.stopPropagation();
          setShowQuitConfirm(false);
          return;
        }
        // 1b. The merged session dialog is open → close it.
        if (showSessionDialog) {
          e.preventDefault();
          e.stopPropagation();
          setShowSessionDialog(false);
          return;
        }
        // 2. Any other open modal dialog (member form, settings sub-dialog,
        //    etc.) → let Radix close it; do NOT navigate away from the view.
        if (document.querySelector('[role="dialog"][data-state="open"]')) {
          return;
        }
        // 3. Sign-in / create-user → back to profile selection.
        if (appState === "user_signin" || appState === "user_create") {
          e.preventDefault();
          setAppState("profile_select");
          return;
        }
        // 4. Main app, not on Beranda and no popup open → return to Beranda.
        if (appState === "main" && activeTab !== "home") {
          e.preventDefault();
          setActiveTab("home");
          return;
        }
        // 5. Main app on Beranda → open the session dialog (avoid misclick
        //    leaving the app). Title screen is handled below.
        if (appState === "main") {
          e.preventDefault();
          openSessionDialog();
          return;
        }
        // 5. Title screen (profile selection) → confirm before quitting.
        if (appState === "profile_select") {
          e.preventDefault();
          setShowQuitConfirm(true);
          return;
        }
      }

      // Cmd/Ctrl + B → toggle left sidebar; Cmd/Ctrl + Shift + B → toggle right news panel
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggleSidebarCollapse();
        return;
      }
      if (mod && e.shiftKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pakde:toggle-news"));
        return;
      }

      if (!mod) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setFontSizeSetting((prev) => {
          const idx = FONT_LEVELS.indexOf(prev);
          return idx < FONT_LEVELS.length - 1 ? FONT_LEVELS[idx + 1] : prev;
        });
      } else if (e.key === "-") {
        e.preventDefault();
        setFontSizeSetting((prev) => {
          const idx = FONT_LEVELS.indexOf(prev);
          return idx > 0 ? FONT_LEVELS[idx - 1] : prev;
        });
      } else if (e.key === "0") {
        e.preventDefault();
        setFontSizeSetting(FONT_LEVEL_DEFAULT);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    appState,
    activeTab,
    showQuitConfirm,
    showSessionDialog,
    handleSwitchProfile,
    openSessionDialog,
    toggleSidebarCollapse,
  ]);

  // Load dashboard data on mount
  useEffect(() => {
    if (appState !== "main") return;
    (async () => {
      try {
        const activeId = coopProfile?.id || localStorage.getItem("pakde-active-profile-id");
        if (activeId) {
          const profile = await getCooperativeById(activeId);
          if (profile) setCoopProfile(profile);

          setMemberCount(await getMemberCount(activeId));
          setEwsAlerts(await getActiveEwsAlerts(activeId));
          setNetWorth(await getNetWorth(activeId));
        } else {
          const profiles = await listCooperatives();
          if (profiles.length > 0) {
            setCoopProfile(profiles[0]);
            localStorage.setItem("pakde-active-profile-id", profiles[0].id || "");
          }
        }
      } catch (e) {
        reportError(e, "loadDashboard");
      }
    })();
  }, [appState, coopProfile?.id]);

  // Unattended local auto-backup: snapshot the active coop on a schedule so a
  // crash or bad restore can't wipe its history. Reuses the manual-export writer.
  // Best-effort only — failures are logged and ignored, never surfaced.
  const autoBackupRunning = useRef(false);
  useEffect(() => {
    if (appState !== "main") return;
    const coopId = coopProfile?.id || getActiveCoopId();
    if (!coopId || !isAutoBackupEnabled()) return;

    const run = async () => {
      if (autoBackupRunning.current) return;
      autoBackupRunning.current = true;
      try {
        await takeAutoBackup(coopId);
      } catch (e) {
        reportError(e, "autoBackup");
      } finally {
        autoBackupRunning.current = false;
      }
    };

    void run();
    const handle = setInterval(run, AUTO_BACKUP_INTERVAL_MS);
    // Final snapshot on quit (best-effort; async may not flush on every platform).
    const onUnload = () => void takeAutoBackup(coopId);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearInterval(handle);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [appState, coopProfile?.id]);

  const refreshMemberCount = useCallback(async () => {
    const id = coopProfile?.id || getActiveCoopId();
    try {
      setMemberCount(await getMemberCount(id));
      // Member add now awards XP via the ledger, so refresh the profile so the
      // Dashboard/Sidebar level + progress bar reflect the new `xp`.
      const profile = await getCooperativeById(id);
      if (profile) {
        setCoopProfile((prev) => (prev?.id === profile.id ? { ...prev, ...profile } : profile));
      }
    } catch (e) {
      reportError(e, "refreshMemberCount");
    }
  }, [coopProfile?.id]);

  // Refresh the headline top-bar stats (net worth, liveliness, risk alerts).
  // Event-driven: recomputes on every tab switch and whenever the co-op
  // profile changes, so the meters stay live without a polling timer.
  const refreshTopStats = useCallback(async () => {
    const id = coopProfile?.id || getActiveCoopId();
    if (!id) return;
    try {
      setTopStats(await getTopBarStats(id));
    } catch (e) {
      reportError(e, "refreshTopStats");
    }
  }, [coopProfile?.id]);

  useEffect(() => {
    if (appState !== "main") return;
    (async () => {
      await refreshTopStats();
    })();
  }, [appState, activeTab, coopProfile?.id, refreshTopStats]);

  // Boot resume: if a cooperative was previously active, skip the title screen
  // and drop the user straight back into their session. Demo coop → auto-login
  // straight to main; real coop → PIN prompt (security gate stays). First run
  // or missing/unresolvable id → normal title screen.
  useEffect(() => {
    // Silent update probe on boot — populates the "Update available" banner on
    // the title screen. Non-blocking; failures are logged and ignored.
    void updater.checkForUpdateAvailable();
    (async () => {
      const savedId = localStorage.getItem("pakde-active-profile-id");
      if (!savedId) return;
      try {
        await initDb();
        const profile = await getCooperativeById(savedId);
        if (!profile) return;
        setCoopProfile(profile);
        const users = await getUsersByCooperativeId(profile.id || "");
        if (isDemoCooperative(profile) && users.length > 0) {
          setActiveTab("home");
          setCurrentUser(users[0]);
          setAppState("main");
          return;
        }
        setAppState(users.length === 0 ? "user_create" : "user_signin");
      } catch (e) {
        reportError(e, "bootResume");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardedSetActiveTab = useCallback(
    (tab: typeof activeTab) => {
      const score = coopProfile?.xp ?? 0;
      if (!isTabUnlocked(tab, score)) {
        setActiveTab("home");
      } else {
        setActiveTab(tab);
      }
    },
    [coopProfile?.xp],
  );

  // Command Palette action registry. Rebuilt when language/theme change so the
  // labels stay in sync; `guardedSetActiveTab` is stable so it doesn't churn.
  const paletteActions = useMemo<CommandAction[]>(() => {
    const nav = (id: TabId, title: string, icon: CommandAction["icon"], keywords: string) => ({
      id: `nav-${id}`,
      group: "navigation" as const,
      title,
      subtitle: t("commandPalette.groupNavigation"),
      icon,
      keywords,
      run: () => guardedSetActiveTab(id),
    });
    return [
      // ── Quick Actions ──
      {
        id: "qa-deposit",
        group: "quickActions",
        title: t("commandPalette.newDeposit"),
        subtitle: t("sidebar.nav.anggota"),
        icon: Coins,
        keywords: "deposit simpanan setor savings",
        run: () => guardedSetActiveTab("anggota"),
      },
      {
        id: "qa-event",
        group: "quickActions",
        title: t("commandPalette.newEvent"),
        subtitle: t("sidebar.nav.kegiatan"),
        icon: CalendarPlus,
        keywords: "event kegiatan baru create",
        run: () => guardedSetActiveTab("kegiatan"),
      },
      {
        id: "qa-member",
        group: "quickActions",
        title: t("commandPalette.newMember"),
        subtitle: t("sidebar.nav.anggota"),
        icon: UserPlusIcon,
        keywords: "member anggota baru register daftar",
        run: () => {
          guardedSetActiveTab("anggota");
          requestAddMember();
        },
      },
      // ── Navigation ──
      nav("home", t("sidebar.nav.home"), SquaresFour, "beranda dashboard home"),
      nav("anggota", t("sidebar.nav.anggota"), UsersIcon, "members anggota"),
      nav("kegiatan", t("sidebar.nav.kegiatan"), CalendarPlus, "event kegiatan"),
      nav("dampak", t("sidebar.nav.dampak"), HandshakeIcon, "impact dampak"),
      nav("units", t("sidebar.nav.units"), BuildingsIcon, "units bisnis"),
      nav("sales", t("sidebar.nav.sales"), HandshakeIcon, "sales penjualan"),
      nav("asetFisik", t("sidebar.nav.asetFisik"), WarehouseIcon, "assets aset"),
      nav("development", t("sidebar.nav.development"), RocketLaunchIcon, "development pengembangan"),
      nav("statistics", t("sidebar.nav.statistics"), ChartBarIcon, "statistics statistik"),
      nav("accounting", t("sidebar.nav.accounting"), Note, "accounting ledger buku besar"),
      nav("feasibility", t("sidebar.nav.feasibility"), TrendUpIcon, "feasibility kelayakan"),
      nav("hibah", t("sidebar.nav.hibah"), HandCoins, "grant hibah"),
      nav("leveling", t("sidebar.nav.leveling"), TrophyIcon, "leveling level"),
      nav("learn", t("sidebar.nav.learn"), BookOpenIcon, "learn belajar"),
      // ── System ──
      {
        id: "sys-theme",
        group: "system",
        title: t("commandPalette.toggleTheme"),
        icon: appTheme === "dark" ? SunIcon : MoonIcon,
        keywords: "theme dark light mode",
        run: () => setAppTheme((p) => (p === "dark" ? "light" : "dark")),
      },
      {
        id: "sys-lang",
        group: "system",
        title: t("commandPalette.toggleLanguage"),
        icon: TranslateIcon,
        keywords: "language bahasa en id",
        run: () => i18next.changeLanguage(i18next.language.startsWith("id") ? "en" : "id"),
      },
      {
        id: "sys-sync",
        group: "system",
        title: t("commandPalette.openSync"),
        subtitle: t("sidebar.nav.sync"),
        icon: CloudCheck,
        keywords: "sync sinkronisasi",
        run: () => guardedSetActiveTab("sync"),
      },
      {
        id: "sys-settings",
        group: "system",
        title: t("commandPalette.openSettings"),
        subtitle: t("sidebar.nav.settings"),
        icon: Gear,
        keywords: "settings pengaturan",
        run: () => guardedSetActiveTab("settings"),
      },
      {
        id: "sys-sidebar",
        group: "system",
        title: sidebarCollapsed ? "Buka Sidebar Kiri" : "Tutup Sidebar Kiri",
        subtitle: isMac ? "⌘B" : "Ctrl+B",
        icon: SquaresFour,
        keywords: "sidebar navigasi collapse expand buka tutup left",
        shortcut: isMac ? "⌘B" : "Ctrl+B",
        run: toggleSidebarCollapse,
      },
      {
        id: "sys-news",
        group: "system",
        title: "Buka / Tutup Panel Berita",
        subtitle: isMac ? "⌘⇧B" : "Ctrl+Shift+B",
        icon: Note,
        keywords: "news berita panel right collapse expand buka tutup",
        shortcut: isMac ? "⌘⇧B" : "Ctrl+Shift+B",
        run: () => window.dispatchEvent(new CustomEvent("pakde:toggle-news")),
      },
      {
        id: "sys-focus-mode",
        group: "system",
        title: "Mode Fokus (Tutup Semua Sidebar)",
        subtitle: "Maksimalkan area kerja",
        icon: SquaresFour,
        keywords: "focus fokus mode full screen bersih",
        run: () => {
          setSidebarCollapsed(true);
          localStorage.setItem("pakde-sidebar-collapsed", "true");
          window.dispatchEvent(new CustomEvent("pakde:toggle-news", { detail: { collapse: true } }));
        },
      },
      {
        id: "sys-profile",
        group: "system",
        title: t("commandPalette.openProfile"),
        icon: UserCircleIcon,
        keywords: "profile profil user",
        run: () => setShowUserModal(true),
      },
    ];
  }, [t, appTheme, guardedSetActiveTab, setAppTheme, setShowUserModal, sidebarCollapsed, toggleSidebarCollapse]);

  const ranking = useRanking(coopProfile);

  const handleTitlebarMouseDown = (e: React.MouseEvent) => {
    // Only respond to left mouse button
    if (e.buttons !== 1) return;
    // Double-click → toggle maximize; single click → start dragging
    if (e.detail === 2) {
      getCurrentWindow().toggleMaximize();
    } else {
      getCurrentWindow().startDragging();
    }
  };

  const titleBar = (
    <div
      className="bg-brand flex items-center justify-center border-b border-brand/80 relative z-50 select-none shrink-0"
      style={{ height: "38px" }}
      onMouseDown={handleTitlebarMouseDown}
    >
      <span className="text-xxs font-black text-brand-foreground tracking-widest uppercase pointer-events-none">
        {TITLEBAR_TEXT}
      </span>
    </div>
  );

  if (appState === "db_error") {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {titleBar}
        <div className="flex-1 overflow-hidden">
          <DbErrorScreen message={dbErrorMessage} />
        </div>
      </div>
    );
  }
  if (appState === "profile_select") {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {titleBar}
        <div className="flex-1 overflow-hidden relative">
          <ProfileSelect
            updater={updater}
            onDbError={(msg) => {
              setDbErrorMessage(msg);
              setAppState("db_error");
            }}
            onProfileSelect={async (profile) => {
              setActiveTab("home");
              setCoopProfile(profile);
              localStorage.setItem("pakde-active-profile-id", profile.id || "");
              // Demo coop — auto-login with seeded user, skip PIN
              if (isDemoCooperative(profile)) {
                const users = await getUsersByCooperativeId(profile.id || "");
                if (users.length > 0) {
                  setCurrentUser(users[0]);
                  setAppState("main");
                  return;
                }
              }
              const users = await getUsersByCooperativeId(profile.id || "");
              if (users.length === 0) {
                setAppState("user_create");
              } else {
                setAppState("user_signin");
              }
            }}
          />
          {/* Quit button */}
          <button
            onClick={() => setShowQuitConfirm(true)}
            className="absolute bottom-6 right-6 z-20 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-danger/40 hover:text-danger transition-colors shadow-md backdrop-blur-md text-xxs font-bold text-slate-500"
            title={LBL_QUIT}
          >
            {LBL_QUIT_BTN}
          </button>

          {/* Quit confirmation dialog */}
          <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
            <DialogContent
              className="bg-slate-900 border border-slate-800 max-w-sm shadow-2xl"
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <XCircle className="h-5 w-5 text-danger shrink-0" />
                  {LBL_QUIT}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-slate-400 leading-relaxed py-2">{LBL_QUIT_CONFIRM}</p>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  {LBL_CANCEL}
                </Button>
                <Button
                  onClick={() => {
                    setShowQuitConfirm(false);
                    quitApp();
                  }}
                  className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold text-xs h-8"
                >
                  <SignOut className="h-3.5 w-3.5 mr-1" />
                  {LBL_QUIT}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (appState === "user_create" && coopProfile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {titleBar}
        <div className="flex-1 overflow-hidden">
          <CreateUserProfile
            cooperativeId={coopProfile.id || ""}
            cooperativeName={coopProfile.name}
            onComplete={(user) => {
              setCurrentUser(user);
              setAppState("main");
            }}
          />
        </div>
      </div>
    );
  }

  if (appState === "user_signin" && coopProfile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {titleBar}
        <div className="flex-1 overflow-hidden">
          <UserSignIn
            cooperativeId={coopProfile.id || ""}
            cooperativeName={coopProfile.name}
            onSuccess={(user) => {
              setCurrentUser(user);
              setAppState("main");
            }}
            onBack={() => setAppState("profile_select")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {titleBar}
      <BackupFileOpenHandler />
      <div className="app-container flex flex-1 text-foreground antialiased overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={guardedSetActiveTab}
          coopProfile={coopProfile}
          memberCount={memberCount}
          netWorth={netWorth}
          rankingStatus={ranking.status}
          rankingRank={ranking.ourRanks.kabupaten}
          rankingUnlocked={isTabUnlocked("ranking", coopProfile?.xp ?? 0)}
          onOpenProfile={() => setShowProfileModal(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* ── Persistent top bar: profile, sync, theme, settings, quit (all tabs) ── */}
          <div className="pt-4 shrink-0">
            <TopBar
              activeTab={activeTab}
              onNavigate={(tab) => {
                if (tab === "settings" || tab === "home") setActiveTab(tab);
                else guardedSetActiveTab(tab);
              }}
              currentUser={currentUser}
              appTheme={appTheme}
              onThemeToggle={() => setAppTheme((t) => (t === "dark" ? "light" : "dark"))}
              onOpenProfile={() => setShowUserModal(true)}
              onOpenSession={openSessionDialog}
              topStats={topStats}
              onAlertsClick={() => guardedSetActiveTab("home")}
              onOpenPalette={palette.openPalette}
            />
          </div>

          {/* ── Critical alert banner: global, below the top bar ── */}
          {ewsAlerts.filter((a) => a.level === "critical").length > 0 && (
            <div className="px-6 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => guardedSetActiveTab("home")}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/30 text-left hover:bg-danger/15 transition-colors"
              >
                <WarningIcon className="h-4 w-4 text-danger shrink-0 animate-pulse" />
                <span className="text-xxs font-bold text-danger">
                  {t("sidebar.criticalAlerts", { count: ewsAlerts.filter((a) => a.level === "critical").length })}
                </span>
                <span className="text-xxs text-danger/70 ml-auto">{LBL_ALERT_ATTENTION} &rarr;</span>
              </button>
            </div>
          )}

          <main className="flex-1 max-h-full overscroll-contain overflow-y-auto p-6 brand-scroll">
            {activeTab === "home" && (
              <Dashboard xp={coopProfile?.xp ?? 0} coopId={coopProfile?.id ?? getActiveCoopId()} />
            )}
            {activeTab === "statistics" && <Statistics coopProfile={coopProfile} />}
            {activeTab === "ranking" && <Ranking ranking={ranking} onGoSync={() => guardedSetActiveTab("sync")} />}
            {activeTab === "leveling" && <Leveling xp={coopProfile?.xp ?? 0} />}
            {activeTab === "units" && <Units onTabChange={setActiveTab} />}
            {activeTab === "asetFisik" && <Assets />}
            {activeTab === "sales" && <Sales />}
            {activeTab === "development" && <Development onTabChange={setActiveTab} />}
            {activeTab === "learn" && <Learn />}
            {activeTab === "anggota" && (
              <Members
                xp={coopProfile?.xp ?? 0}
                onMembersChanged={() => {
                  void refreshMemberCount();
                  void refreshTopStats();
                }}
              />
            )}
            {activeTab === "kegiatan" && <CreateEvent coopId={coopProfile?.id ?? getActiveCoopId()} />}
            {activeTab === "dampak" && <Dampak />}
            {activeTab === "accounting" && (
              <Accounting
                financeTier={financeTier}
                onTierChange={(t) => {
                  setFinanceTier(t);
                  localStorage.setItem("pakde-finance-tier", t);
                }}
              />
            )}
            {activeTab === "feasibility" && <Feasibility />}
            {activeTab === "hibah" && <Hibah />}
            {activeTab === "sync" && <Sync />}
            {activeTab === "settings" && (
              <Settings
                coopProfile={coopProfile}
                fontSizeSetting={fontSizeSetting}
                setFontSizeSetting={setFontSizeSetting}
                appTheme={appTheme}
                setAppTheme={setAppTheme}
                onSwitchProfile={openSessionDialog}
              />
            )}
          </main>
        </div>
      </div>

      {/* Quit confirmation dialog (main view). Mirrors the title-screen quit
          dialog; Escape handling owned by App's keydown listener. */}
      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent
          className="bg-slate-900 border border-slate-800 max-w-sm shadow-2xl"
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <XCircle className="h-5 w-5 text-danger shrink-0" />
              {LBL_QUIT}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 leading-relaxed py-2">{LBL_QUIT_CONFIRM}</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowQuitConfirm(false)}
              className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              {LBL_CANCEL}
            </Button>
            <Button
              onClick={() => {
                setShowQuitConfirm(false);
                quitApp();
              }}
              className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold text-xs h-8"
            >
              <SignOut className="h-3.5 w-3.5 mr-1" />
              {LBL_QUIT}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merged session dialog (main view). One entry point offering three
          explicit choices: log out to profile selection, quit the app, or
          cancel. Opened by the TopBar session button or the Settings switch. */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent
          className="bg-slate-900 border border-slate-800 max-w-sm shadow-2xl p-0 overflow-hidden"
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-800">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-warning/15 text-warning shrink-0">
              <SignOut className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-slate-100">{t("session.title")}</DialogTitle>
              <p className="text-xxs text-slate-400 mt-0.5">{t("session.desc")}</p>
            </div>
          </div>

          {/* Action rows */}
          <div className="flex flex-col gap-1 p-3">
            <button
              type="button"
              onClick={() => {
                setShowSessionDialog(false);
                handleSwitchProfile();
              }}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-warning"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-warning shrink-0">
                <SignOut className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100">{t("session.logout")}</p>
                <p className="text-xxs text-slate-400 leading-snug">{t("session.logoutDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSessionDialog(false);
                quitApp();
              }}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-danger/10 text-danger shrink-0">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100">{t("session.quitApp")}</p>
                <p className="text-xxs text-slate-400 leading-snug">{t("session.quitAppDesc")}</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3">
            <Button
              variant="outline"
              onClick={() => setShowSessionDialog(false)}
              className="w-full justify-center border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8"
            >
              {t("session.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CoopProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        coopProfile={coopProfile}
        setCoopProfile={setCoopProfile}
      />

      <CommandPaletteDialog
        open={palette.open}
        onOpenChange={palette.setOpen}
        actions={paletteActions}
        onOpenMember={(member) => {
          guardedSetActiveTab("anggota");
          requestOpenMember(member);
        }}
      />

      <UserProfileModal
        open={showUserModal}
        onOpenChange={setShowUserModal}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <IconProvider>
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-fixed opacity-3 pointer-events-none"
          style={{ backgroundImage: 'url("/background.jpg")' }}
        />
        <AppContent />
      </IconProvider>
    </ToastProvider>
  );
}
