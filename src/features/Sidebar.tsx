import {
  LayoutDashboard,
  Users,
  Receipt,
  TrendingUp,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Database,
  UserCheck,
} from "lucide-react";
import type { CooperativeProfile, EwsAlert } from "@/types";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: "home" | "members" | "accounting" | "feasibility" | "sync" | "settings") => void;
  coopProfile: CooperativeProfile | null;
  ewsAlerts: EwsAlert[];
  currentUser: { name: string; role: string } | null;
}

const NAV_ITEMS = [
  { id: "home" as const, icon: LayoutDashboard, label: "Beranda Utama" },
  { id: "members" as const, icon: Users, label: "Database Anggota" },
  { id: "accounting" as const, icon: Receipt, label: "Akuntansi SAK EP" },
  { id: "feasibility" as const, icon: TrendingUp, label: "Kelayakan Finansial" },
  { id: "sync" as const, icon: RefreshCw, label: "Sinkronisasi Data" },
  { id: "settings" as const, icon: Settings, label: "Pengaturan" },
];

export default function Sidebar({ activeTab, onTabChange, coopProfile, ewsAlerts, currentUser }: SidebarProps) {
  const criticalAlerts = ewsAlerts.filter((a) => a.level === "critical").length;

  return (
    <aside className="w-64 border-r border-slate-900 bg-[#090e1a]/95 flex flex-col justify-between print:hidden">
      <div>
        <div className="px-6 py-6 border-b border-slate-900 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black tracking-widest text-emerald-400">KDKMP</span>
            <span className="text-xs font-mono text-slate-500">|</span>
            <span className="text-xs font-mono text-slate-300">{coopProfile?.village ?? "DESA"}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]" />
            <span className="text-[10px] font-mono text-slate-400">Connected to local.db</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all text-xs font-semibold ${
                activeTab === id
                  ? "bg-emerald-500/10 text-emerald-400 border-[0.5px] border-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
              }`}
              onClick={() => onTabChange(id)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-900 p-4 space-y-4">
        {(coopProfile?.health_score ?? 0) > 0 && (
          <div className="px-3 py-3 rounded-xl bg-[#0b101c] border border-slate-900">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-slate-400">HEALTH SCORE</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-emerald-400 font-mono">{coopProfile?.health_score}%</span>
              <span className="text-[9px] text-slate-500 mb-1">RAG: {coopProfile?.rag_status}</span>
            </div>
          </div>
        )}

        {criticalAlerts > 0 && (
          <div className="px-3 py-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              <span className="text-[10px] font-mono text-rose-300">{criticalAlerts} Critical Alerts</span>
            </div>
          </div>
        )}

        {(ewsAlerts.filter((a) => a.level === "warning").length > 0 ||
          ewsAlerts.length === 0 ||
          criticalAlerts === 0) && (
          <div className="px-3 py-3 rounded-xl bg-[#0b101c] border border-slate-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-slate-400">Sistem Normal</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-[10px]">
            <p className="font-bold text-slate-300">{currentUser?.name}</p>
            <p className="text-slate-500">{currentUser?.role}</p>
          </div>
          <Bell className="h-3 w-3 text-slate-600 ml-auto" />
        </div>
      </div>
    </aside>
  );
}
