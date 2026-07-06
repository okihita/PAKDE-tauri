import { useState, useEffect } from "react";
import "@/i18n"; // initialize i18next before render
import { initDb, getDb } from "@/db";
import { ToastProvider } from "@/hooks/useToast";
import SplashScreen from "@/features/System/SplashScreen/SplashScreen";
import DbErrorScreen from "@/features/System/DbErrorScreen/DbErrorScreen";
import Sidebar from "@/features/Sidebar";
import Dashboard from "@/features/Home/Dashboard/Dashboard";
import Statistics from "@/features/Analytics/Statistics/Statistics";
import Leveling from "@/features/Analytics/Leveling/Leveling";
import Members from "@/features/Community/Members/Members";
import Units from "@/features/Business/Units/Units";
import Equipment from "@/features/Business/Equipment/Equipment";
import Sales from "@/features/Business/Sales/Sales";
import Development from "@/features/Business/Development/Development";
import Learn from "@/features/Education/Learn/Learn";
import Planners from "@/features/Education/Planners/Planners";
import Accounting from "@/features/Finance/Accounting";
import Feasibility from "@/features/Finance/Feasibility/Feasibility";
import Ranking from "@/features/Analytics/Ranking/Ranking";
import CreateEvent from "@/features/Community/CreateEvent/CreateEvent";
import Impact from "@/features/Community/Impact/Impact";
import Participation from "@/features/Community/Participation/Participation";
import Sync from "@/features/System/Sync/Sync";
import Settings from "@/features/System/Settings/Settings";
import ProfileSelect from "@/features/System/ProfileSelect/ProfileSelect";
import { getErrorMessage, type CooperativeProfile, type EwsAlert, type CountRow } from "@/types";

type FontLevel = "small" | "normal" | "large" | "xlarge";
const FONT_LEVELS: FontLevel[] = ["small", "normal", "large", "xlarge"];
const FONT_LEVEL_DEFAULT: FontLevel = "normal";

function AppContent() {
  const [appState, setAppState] = useState<"splash" | "profile_select" | "main" | "db_error">("splash");
  const [dbErrorMessage, setDbErrorMessage] = useState("");
  const [currentUser] = useState<{ id: string; name: string; role: string }>({
    id: "usr-001",
    name: "Slamet Riyadi",
    role: "Ketua Koperasi",
  });

  const [activeTab, setActiveTab] = useState<
    | "home"
    | "statistics"
    | "ranking"
    | "leveling"
    | "units"
    | "equipment"
    | "sales"
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
    | "settings"
  >("home");
  const [financeTier, setFinanceTier] = useState<"simplified" | "standard" | "advanced">(() => {
    return (localStorage.getItem("pakde-finance-tier") as any) || "simplified";
  });
  const [appTheme, setAppTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("pakde-theme") as "dark" | "light") || "dark";
  });
  const [fontSizeSetting, setFontSizeSetting] = useState<FontLevel>(() => {
    const saved = localStorage.getItem("pakde-font-size") as FontLevel | null;
    return saved && FONT_LEVELS.includes(saved) ? saved : FONT_LEVEL_DEFAULT;
  });
  const [coopProfile, setCoopProfile] = useState<CooperativeProfile | null>(null);
  const [ewsAlerts, setEwsAlerts] = useState<EwsAlert[]>([]);
  const [memberCount, setMemberCount] = useState(0);

  // DB init
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const db = await getDb();
        const lastProfileId = localStorage.getItem("pakde-active-profile-id");
        if (lastProfileId) {
          const profile = await db.select<CooperativeProfile[]>(
            "SELECT * FROM cooperatives WHERE id = ?",
            [lastProfileId]
          );
          if (profile.length > 0) {
            setCoopProfile(profile[0]);
            setAppState("main");
            return;
          }
        }
        setAppState("profile_select");
      } catch (err: unknown) {
        console.error(err);
        setDbErrorMessage(getErrorMessage(err));
        setAppState("db_error");
      }
    })();
  }, []);

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

  // Keyboard shortcuts: Cmd/Ctrl + +/-/0 to zoom font
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only fire when Cmd (mac) or Ctrl (windows/linux) is held
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
  }, []);

  // Load dashboard data on mount
  useEffect(() => {
    if (appState !== "main") return;
    (async () => {
      try {
        const db = await getDb();
        const activeId = coopProfile?.id || localStorage.getItem("pakde-active-profile-id");
        if (activeId) {
          const profile = await db.select<CooperativeProfile[]>(
            "SELECT * FROM cooperatives WHERE id = ?",
            [activeId]
          );
          if (profile.length > 0) setCoopProfile(profile[0]);
        } else {
          const profile = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives LIMIT 1");
          if (profile.length > 0) {
            setCoopProfile(profile[0]);
            localStorage.setItem("pakde-active-profile-id", profile[0].id || "");
          }
        }
        const alerts = await db.select<EwsAlert[]>("SELECT * FROM ews_alerts ORDER BY triggered_at DESC LIMIT 5");
        setEwsAlerts(alerts);
        const count = await db.select<CountRow[]>("SELECT COUNT(*) as count FROM members");
        if (count.length > 0) setMemberCount(count[0].count);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [appState, coopProfile?.id]);

  const handleSwitchProfile = () => {
    setCoopProfile(null);
    localStorage.removeItem("pakde-active-profile-id");
    setAppState("profile_select");
  };

  if (appState === "splash") return <SplashScreen />;
  if (appState === "db_error") return <DbErrorScreen message={dbErrorMessage} />;
  if (appState === "profile_select") {
    return (
      <ProfileSelect
        onProfileSelect={(profile) => {
          setCoopProfile(profile);
          localStorage.setItem("pakde-active-profile-id", profile.id || "");
          setAppState("main");
        }}
      />
    );
  }

  return (
    <div className="app-container flex min-h-screen text-foreground antialiased">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        coopProfile={coopProfile}
        ewsAlerts={ewsAlerts}
        memberCount={memberCount}
        currentUser={currentUser}
        appTheme={appTheme}
        onThemeToggle={() => setAppTheme((t) => (t === "dark" ? "light" : "dark"))}
        onSwitchProfile={handleSwitchProfile}
      />

      <main className="flex-1 p-6 overflow-y-auto max-h-screen overscroll-contain">
        {activeTab === "home" && <Dashboard />}
        {activeTab === "statistics" && (
          <Statistics coopProfile={coopProfile} ewsAlerts={ewsAlerts} currentUser={currentUser} />
        )}
        {activeTab === "ranking" && <Ranking coopProfile={coopProfile} />}
        {activeTab === "leveling" && <Leveling healthScore={coopProfile?.health_score ?? 0} />}
        {activeTab === "units" && <Units onTabChange={setActiveTab} />}
        {activeTab === "equipment" && <Equipment />}
        {activeTab === "sales" && <Sales />}
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
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat bg-fixed opacity-3 pointer-events-none"
        style={{ backgroundImage: 'url("/background.jpg")' }}
      />
      <AppContent />
    </ToastProvider>
  );
}
