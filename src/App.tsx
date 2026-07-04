import { useState, useEffect } from "react";
import { initDb, getDb } from "@/db";
import { ToastProvider } from "@/hooks/useToast";
import SplashScreen from "@/features/SplashScreen";
import DbErrorScreen from "@/features/DbErrorScreen";
import Sidebar from "@/features/Sidebar";
import Dashboard from "@/features/Dashboard";
import Members from "@/features/Members";
import Accounting from "@/features/Accounting";
import Feasibility from "@/features/Feasibility";
import Sync from "@/features/Sync";
import Settings from "@/features/Settings";
import { getErrorMessage, type CooperativeProfile, type EwsAlert } from "@/types";
function AppContent() {
  const [appState, setAppState] = useState<"splash" | "main" | "db_error">("splash");
  const [dbErrorMessage, setDbErrorMessage] = useState("");
  const [currentUser] = useState<{ id: string; name: string; role: string }>({
    id: "usr-001",
    name: "Slamet Riyadi",
    role: "Ketua Koperasi",
  });

  const [activeTab, setActiveTab] = useState<"home" | "members" | "accounting" | "feasibility" | "sync" | "settings">(
    "home",
  );
  const [appTheme] = useState<"dark" | "light">("dark");
  const [fontSizeSetting] = useState<"normal" | "large">("normal");
  const [coopProfile, setCoopProfile] = useState<CooperativeProfile | null>(null);
  const [ewsAlerts, setEwsAlerts] = useState<EwsAlert[]>([]);

  // DB init
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        setAppState("main");
      } catch (err: unknown) {
        console.error(err);
        setDbErrorMessage(getErrorMessage(err));
        setAppState("db_error");
      }
    })();
  }, []);

  // Load dashboard data on mount
  useEffect(() => {
    if (appState !== "main") return;
    (async () => {
      try {
        const db = await getDb();
        const profile = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives LIMIT 1");
        if (profile.length > 0) setCoopProfile(profile[0]);
        const alerts = await db.select<EwsAlert[]>("SELECT * FROM ews_alerts ORDER BY triggered_at DESC LIMIT 5");
        setEwsAlerts(alerts);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [appState]);

  if (appState === "splash") return <SplashScreen />;
  if (appState === "db_error") return <DbErrorScreen message={dbErrorMessage} />;

  return (
    <div
      className={`app-container flex min-h-screen text-slate-300 bg-[#070b14] ${appTheme} font-${fontSizeSetting} antialiased`}
    >
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        coopProfile={coopProfile}
        ewsAlerts={ewsAlerts}
        currentUser={currentUser}
      />

      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        {activeTab === "home" && (
          <Dashboard coopProfile={coopProfile} ewsAlerts={ewsAlerts} currentUser={currentUser} />
        )}
        {activeTab === "members" && <Members />}
        {activeTab === "accounting" && <Accounting />}
        {activeTab === "feasibility" && <Feasibility />}
        {activeTab === "sync" && <Sync />}
        {activeTab === "settings" && <Settings coopProfile={coopProfile} setCoopProfile={setCoopProfile} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
