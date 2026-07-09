import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import "@/i18n"; // initialize i18next before render
import { listCooperatives, getCooperativeById } from "@/features/System/ProfileSelect/cooperativeDb";
import { getUsersByCooperativeId } from "@/features/System/ProfileSelect/userDb";
import { isTabUnlocked, type TabId } from "@/features/System/moduleUnlock";
import { ToastProvider } from "@/hooks/useToast";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import { IconProvider } from "@/components/IconContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignOut, XCircle } from "@phosphor-icons/react";
import DbErrorScreen from "@/features/System/DbErrorScreen/DbErrorScreen";
import Sidebar from "@/features/System/Sidebar";
import Dashboard from "@/features/Home/Dashboard/Dashboard";
import Statistics from "@/features/Finance/Statistics/Statistics";
import Leveling from "@/features/Learn/Leveling/Leveling";
import Members from "@/features/Community/Members/Members";
import Units from "@/features/Business/Units/Units";
import Equipment from "@/features/Business/Equipment/Equipment";
import Sales from "@/features/Business/Sales/Sales";
import StoreLayout from "@/features/Business/StoreLayout/StoreLayout";
import Development from "@/features/Business/Development/Development";
import Learn from "@/features/Learn/Learn/Learn";
import Planners from "@/features/Learn/Planners/Planners";
import Accounting from "@/features/Finance/Accounting";
import Feasibility from "@/features/Finance/Feasibility/Feasibility";
import Ranking from "@/features/Finance/Ranking/Ranking";
import { useRanking } from "@/features/Finance/Ranking/useRanking";
import CreateEvent from "@/features/Community/CreateEvent/CreateEvent";
import Impact from "@/features/Community/Impact/Impact";
import Participation from "@/features/Community/Participation/Participation";
import Sync from "@/features/System/Sync/Sync";
import Settings from "@/features/System/Settings/Settings";
import ProfileSelect from "@/features/System/ProfileSelect/ProfileSelect";
import CreateUserProfile from "@/features/System/ProfileSelect/CreateUserProfile";
import UserSignIn from "@/features/System/ProfileSelect/UserSignIn";
import ProfileCompletion from "@/features/Home/Dashboard/ProfileCompletion";
import { type CooperativeProfile, type EwsAlert, type LocalUser } from "@/types";
import { isDemoCooperative } from "@/db/seed-demo";

type FontLevel = "small" | "normal" | "large" | "xlarge";
const FONT_LEVELS: FontLevel[] = ["small", "normal", "large", "xlarge"];
const FONT_LEVEL_DEFAULT: FontLevel = "normal";
const TITLEBAR_TEXT = "PAKDE";
const LBL_LOGOUT_TITLE = "Keluar dari Koperasi";
const LBL_LOGOUT_CONFIRM = "Apakah Anda yakin ingin keluar dari profil koperasi saat ini?";
const LBL_CANCEL = "Batal";
const LBL_LOGOUT = "Keluar";
const LBL_QUIT = "Tutup Aplikasi";
const LBL_QUIT_BTN = "QUIT";
const LBL_QUIT_CONFIRM = "Apakah Anda yakin ingin menutup aplikasi?";

function quitApp() {
  exit(0);
}

function AppContent() {
  const [appState, setAppState] = useState<"profile_select" | "user_signin" | "user_create" | "main" | "db_error">(
    "profile_select",
  );
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
  const [ewsAlerts, _setEwsAlerts] = useState<EwsAlert[]>([]);
  const [memberCount, _setMemberCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

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

  // Keyboard shortcuts: Cmd/Ctrl + +/-/0 to zoom font, Escape for back/exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: back/exit/logout
      if (e.key === "Escape") {
        if (appState === "profile_select" && !showQuitConfirm) {
          e.preventDefault();
          setShowQuitConfirm(true);
          return;
        }
        if (appState === "profile_select" && showQuitConfirm) {
          setShowQuitConfirm(false);
          return;
        }
        if (appState === "main" && !showLogoutConfirm) {
          e.preventDefault();
          setShowLogoutConfirm(true);
          return;
        }
        if (appState === "user_signin" || appState === "user_create") {
          e.preventDefault();
          setAppState("profile_select");
          return;
        }
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false);
          return;
        }
      }

      // Cmd/Ctrl + +/-/0 to zoom font
      const mod = e.metaKey || e.ctrlKey;
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
  }, [appState, showLogoutConfirm, showQuitConfirm]);

  // Load dashboard data on mount
  useEffect(() => {
    if (appState !== "main") return;
    (async () => {
      try {
        const activeId = coopProfile?.id || localStorage.getItem("pakde-active-profile-id");
        if (activeId) {
          const profile = await getCooperativeById(activeId);
          if (profile) setCoopProfile(profile);
        } else {
          const profiles = await listCooperatives();
          if (profiles.length > 0) {
            setCoopProfile(profiles[0]);
            localStorage.setItem("pakde-active-profile-id", profiles[0].id || "");
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [appState, coopProfile?.id]);

  // Module gating guard: wrap setActiveTab to redirect locked tabs
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

  const ranking = useRanking(coopProfile);

  const handleSwitchProfile = () => {
    setCoopProfile(null);
    localStorage.removeItem("pakde-active-profile-id");
    setAppState("profile_select");
  };

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
            onDbError={(msg) => {
              setDbErrorMessage(msg);
              setAppState("db_error");
            }}
            onProfileSelect={async (profile) => {
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
            <DialogContent className="bg-slate-900 border border-slate-800 max-w-sm shadow-2xl">
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
      <div className="app-container flex flex-1 text-foreground antialiased overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={guardedSetActiveTab}
          coopProfile={coopProfile}
          ewsAlerts={ewsAlerts}
          memberCount={memberCount}
          currentUser={currentUser}
          appTheme={appTheme}
          onThemeToggle={() => setAppTheme((t) => (t === "dark" ? "light" : "dark"))}
          onSwitchProfile={handleSwitchProfile}
          rankingStatus={ranking.status}
          rankingRank={ranking.ourRanks.kabupaten}
          rankingUnlocked={isTabUnlocked("ranking", coopProfile?.xp ?? 0)}
        />

        <main
          className={cn(
            "flex-1 max-h-full overscroll-contain",
            activeTab === "storelayout" ? "flex flex-col overflow-hidden p-0" : "overflow-y-auto p-6",
          )}
        >
          {activeTab === "home" && (
            <>
              {coopProfile && (
                <div className="mb-4">
                  <ProfileCompletion profile={coopProfile} onUpdate={(p) => setCoopProfile(p)} />
                </div>
              )}
              <Dashboard healthScore={coopProfile?.health_score ?? 0} />
            </>
          )}
          {activeTab === "statistics" && <Statistics coopProfile={coopProfile} />}
          {activeTab === "ranking" && <Ranking ranking={ranking} onGoSync={() => guardedSetActiveTab("sync")} />}
          {activeTab === "leveling" && <Leveling xp={coopProfile?.xp ?? 0} />}
          {activeTab === "units" && <Units onTabChange={setActiveTab} />}
          {activeTab === "equipment" && <Equipment />}
          {activeTab === "sales" && <Sales />}
          {activeTab === "storelayout" && <StoreLayout />}
          {activeTab === "development" && <Development />}
          {activeTab === "learn" && <Learn />}
          {activeTab === "planners" && <Planners />}
          {activeTab === "participation" && <Participation onTabChange={setActiveTab} />}
          {activeTab === "members" && <Members />}
          {activeTab === "event" && <CreateEvent />}
          {activeTab === "impact" && <Impact />}
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
          {activeTab === "sync" && <Sync />}
          {activeTab === "settings" && (
            <Settings
              coopProfile={coopProfile}
              setCoopProfile={setCoopProfile}
              fontSizeSetting={fontSizeSetting}
              setFontSizeSetting={setFontSizeSetting}
              appTheme={appTheme}
              setAppTheme={setAppTheme}
              currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : null}
              onSwitchProfile={handleSwitchProfile}
            />
          )}
        </main>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="bg-slate-900 border border-slate-800 max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <SignOut className="h-5 w-5 text-danger shrink-0" />
              {LBL_LOGOUT_TITLE}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400 leading-relaxed py-2">{LBL_LOGOUT_CONFIRM}</p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              {LBL_CANCEL}
            </Button>
            <Button
              onClick={() => {
                setShowLogoutConfirm(false);
                handleSwitchProfile();
              }}
              className="flex-1 bg-danger hover:bg-danger/90 text-white font-bold text-xs h-8"
            >
              <SignOut className="h-3.5 w-3.5 mr-1" />
              {LBL_LOGOUT}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
