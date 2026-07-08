import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MagnifyingGlass,
  Buildings,
  Users,
  MapPin,
  ShieldCheck,
  WarningCircle,
  ArrowLeft,
  Key,
} from "@phosphor-icons/react";
import { searchOnlineCoops, type OnlineCooperative } from "./onlineCoopDb";
import { createCooperative } from "./cooperativeDb";
import type { CooperativeProfile } from "@/types";
import { sfx } from "./sfx";

const LBL_TITLE = "Gabung Koperasi";
const LBL_SUBTITLE = "Cari koperasi yang sudah terdaftar di jaringan PAKDE";
const LBL_SEARCHING = "Mencari koperasi...";
const LBL_NO_RESULTS = "Tidak ada koperasi ditemukan.";
const LBL_NO_RESULTS_HINT = "Coba kata kunci atau lokasi yang berbeda.";
const LBL_RESULTS_COUNT = "koperasi ditemukan";
const LBL_BACK_RESULTS = "Kembali ke hasil pencarian";
const LBL_REG_CODE_PROMPT = "Masukkan kode registrasi yang diberikan oleh administrator koperasi ini.";
const LBL_REG_CODE_INVALID = "Kode registrasi tidak valid. Hubungi administrator koperasi.";
const LBL_JOINING = "Menghubungkan...";
const LBL_JOIN_BTN = "Gabung ke Koperasi";
const PLACEHOLDER_SEARCH = "Cari nama koperasi, lokasi, atau desa...";
const PLACEHOLDER_REGION = "Filter: Provinsi atau Kabupaten";
const PLACEHOLDER_REG_CODE = "Kode registrasi (contoh: ABCD-2025)";

interface JoinExistingCoopProps {
  onJoined: (profile: CooperativeProfile) => void;
  onBack: () => void;
}

export default function JoinExistingCoop({ onJoined, onBack }: JoinExistingCoopProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [results, setResults] = useState<OnlineCooperative[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<OnlineCooperative | null>(null);
  const [regCode, setRegCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim() && !region.trim()) return;
    setSearching(true);
    setSearched(true);
    setError("");
    sfx.playBleep(600, 0.03);
    try {
      const r = await searchOnlineCoops(query, region);
      setResults(r);
      setSelected(null);
      setRegCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setSearching(false);
  };

  const handleJoin = async () => {
    if (!selected || !regCode.trim()) {
      setError(LBL_REG_CODE_INVALID);
      return;
    }
    if (regCode.trim().toUpperCase() !== selected.registrationCode) {
      setError(LBL_REG_CODE_INVALID);
      sfx.playBleep(300, 0.05);
      return;
    }

    setJoining(true);
    setError("");
    sfx.playChime();
    try {
      const profile = await createCooperative({
        name: selected.name,
        legalId: "",
        address: "",
        village: selected.village,
        district: selected.district,
        regency: selected.regency,
        province: selected.province,
        postalCode: "",
        phone: "",
        email: "",
        chairman: "",
        secretary: "",
        treasurer: "",
        supervisor: "",
        unitPupuk: selected.businessUnits.includes("unit_pupuk"),
        unitSimpanPinjam: selected.businessUnits.includes("unit_simpan_pinjam"),
        unitToko: selected.businessUnits.includes("unit_toko_desa"),
        foundedDate: `${selected.foundedYear}-01-01`,
        category: selected.category,
      });
      onJoined(profile);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setJoining(false);
  };

  // Escape: if in registration code view → back to search; if in search → back to hero.
  // Must stopImmediatePropagation to prevent App.tsx's quitter from firing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (selected) {
        setSelected(null);
        setRegCode("");
        setError("");
      } else {
        onBack();
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [selected, onBack]);

  return (
    <div className="flex-1 flex flex-col h-full w-full p-6 bg-slate-950 select-none overflow-y-auto">
      {!selected ? (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                sfx.playBleep(600, 0.03);
                onBack();
              }}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{LBL_TITLE}</h2>
              <p className="text-xxs text-slate-400">{LBL_SUBTITLE}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs font-mono text-danger flex items-start gap-2">
              <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={PLACEHOLDER_SEARCH}
                autoFocus
                className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-10 pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={PLACEHOLDER_REGION}
                className="flex-1 bg-slate-900 border-slate-700 text-slate-100 text-xs h-9"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || (!query.trim() && !region.trim())}
                className="bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9 px-4 disabled:opacity-40"
              >
                {searching ? <span className="animate-pulse">{LBL_SEARCHING}</span> : "Cari"}
              </Button>
            </div>
          </div>

          {searching && (
            <div className="text-center py-12">
              <div className="text-brand animate-pulse text-xs font-mono">{LBL_SEARCHING}</div>
            </div>
          )}

          {!searching && searched && results.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Buildings className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">{LBL_NO_RESULTS}</p>
              <p className="text-xxs text-slate-600">{LBL_NO_RESULTS_HINT}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xxs font-mono text-slate-500">{`${results.length} ${LBL_RESULTS_COUNT}`}</p>
              <div className="grid gap-3">
                {results.map((coop) => (
                  <button
                    key={coop.id}
                    onClick={() => {
                      sfx.playBleep(700, 0.02);
                      setSelected(coop);
                    }}
                    className="text-left p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-brand/40 hover:bg-slate-900 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white">{coop.name}</h3>
                      <span className="text-xxxs font-mono px-1.5 py-0.5 rounded bg-brand/10 text-brand shrink-0">
                        {coop.healthScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xxs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {coop.regency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {coop.memberCount}
                      </span>
                      <span className="capitalize">{coop.level}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {coop.businessUnits.map((u) => (
                        <span key={u} className="text-xxxs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {u.replace(/unit_/g, "").replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-sm mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 pt-16">
          <button
            onClick={() => {
              sfx.playBleep(600, 0.03);
              setSelected(null);
              setError("");
              setRegCode("");
            }}
            className="flex items-center gap-1 text-xxs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            {LBL_BACK_RESULTS}
          </button>

          <div className="text-center space-y-3">
            <ShieldCheck className="h-12 w-12 text-brand mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <p className="text-xxs text-slate-400">
                {selected.regency}, {selected.province}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-xxs font-mono text-danger flex items-start gap-2">
              <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <p className="text-xs text-slate-300">{LBL_REG_CODE_PROMPT}</p>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={regCode}
                onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder={PLACEHOLDER_REG_CODE}
                autoFocus
                className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-10 pl-10 font-mono tracking-wider"
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={!regCode.trim() || joining}
              className="w-full bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9 disabled:opacity-40"
            >
              {joining ? <span className="animate-pulse">{LBL_JOINING}</span> : LBL_JOIN_BTN}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
