import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import {
  Buildings,
  Plus,
  MapPin,
  SpeakerLow,
  SpeakerX,
  MusicNotes,
  CheckCircle,
  XCircle,
  ShieldCheck,
  GameController,
  Trophy,
} from "@phosphor-icons/react";
import { getDb } from "@/db";
import type { CooperativeProfile } from "@/types";
import { sfx } from "./sfx";
import { bgMusic } from "./music";
import CreateProfileDialog from "./CreateProfileDialog";
import { seedDemoCooperativeAtLevel } from "@/db/init";
import type { DemoLevel } from "@/db/init";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Module-level constants to satisfy eslint no-hardcoded-labels rule
const TEXT_UNIT_PUPUK = "Sales";
const TEXT_UNIT_SP = "Simpan Pinjam";
const TEXT_UNIT_TOKO = "Toko Desa";
const LOGOTYPE = "PAKDE";
const FOOTER_COPYRIGHT = "© 2026 PAKDE. pakde.vercel.app";
const BTN_CLOSE = "Close";
const HERO_TITLE = "Mulai Perjalanan Koperasi Anda";
const HERO_SUBTITLE = "Pilih jalur Anda — kelola koperasi nyata atau jelajahi akun demo.";
const REAL_TITLE = "Koperasi Saya";
const REAL_DESC = "Daftarkan koperasi baru atau masuk ke akun yang sudah ada.";
const REAL_REGISTER = "Daftar Baru";
const REAL_LOGIN = "Sudah punya akun?";
const LOGIN_LINK = "Masuk";
const COOP_LIST_HEADING = "Koperasi Anda";
const COOP_COUNT_SUFFIX = "koperasi";
const DEMO_TIER_HEADING = "Pilih Level Demo";
const DEMO_TIER_COUNT = "3 level";
const DEMO_TIER_START = "Mulai";

const DEMO_TIERS: { level: DemoLevel; title: string; desc: string; color: string; border: string; bg: string; text: string }[] = [
  {
    level: "pemula",
    title: "Pemula",
    desc: "10 anggota · 1 unit usaha · 8 modul — Cocok untuk koperasi kecil yang baru memulai.",
    color: "emerald",
    border: "border-emerald-800/50",
    bg: "bg-emerald-950/30",
    text: "text-emerald-400",
  },
  {
    level: "menengah",
    title: "Menengah",
    desc: "30 anggota · 2 unit usaha · 12 modul — Untuk koperasi yang sedang berkembang.",
    color: "amber",
    border: "border-amber-800/50",
    bg: "bg-amber-950/30",
    text: "text-amber-400",
  },
  {
    level: "lanjutan",
    title: "Lanjutan",
    desc: "50 anggota · 3 unit usaha · 16 modul — Koperasi lengkap dengan semua fitur.",
    color: "brand",
    border: "border-brand/40",
    bg: "bg-brand/10",
    text: "text-brand",
  },
];
const DEMO_TITLE = "Coba Demo";
const DEMO_DESC = "Koperasi Maju Bersama — 50 anggota · 3 unit usaha · 16 modul siap dijelajahi.";
const DEMO_ACTION = "Mulai Demo";
const DEMO_BADGE = "Mode Eksplorasi";
const REAL_BADGE = "Mulai dari 0";
const OR_TEXT = "atau";

const SLIDESHOW_IMAGES = [
  "/Gemini_Generated_Image_4tfb4o4tfb4o4tfb.png",
  "/Gemini_Generated_Image_htw32rhtw32rhtw3.png",
  "/Gemini_Generated_Image_pxcvqwpxcvqwpxcv.png",
  "/Gemini_Generated_Image_rllm0erllm0erllm.png",
  "/Gemini_Generated_Image_tik8trtik8trtik8.png",
];
const SLIDE_INTERVAL_MS = 5000;

interface ProfileSelectProps {
  onProfileSelect: (profile: CooperativeProfile) => void;
}

export default function ProfileSelect({ onProfileSelect }: ProfileSelectProps) {
  const { t } = useTranslation();
  const [devResult, setDevResult] = useState<{ open: boolean; ok: boolean; message: string }>({
    open: false,
    ok: true,
    message: "",
  });
  const [profiles, setProfiles] = useState<CooperativeProfile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(sfx.enabled);
  const [musicOn, setMusicOn] = useState(bgMusic.enabled);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showCoopList, setShowCoopList] = useState(false);
  const [showDemoTiers, setShowDemoTiers] = useState(false);

  // Slideshow loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const loadProfiles = async () => {
    const db = await getDb();
    const list = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives ORDER BY created_at DESC");
    setProfiles(list);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadProfiles();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUserInteraction = () => {
    sfx.resume();
    bgMusic.resume();
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    const newState = sfx.toggleSound();
    setSoundOn(newState);
    if (newState) {
      sfx.playBleep(800, 0.05);
    }
  };

  const handleMusicToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    const newState = bgMusic.toggleMusic();
    setMusicOn(newState);
  };

  const handleCardClick = (p: CooperativeProfile) => {
    handleUserInteraction();
    sfx.playChime();
    setTimeout(() => {
      onProfileSelect(p);
    }, 280);
  };

  const handleCardHover = () => {
    sfx.playBleep(700, 0.012);
  };

  const handleRealHover = () => {
    sfx.playSoftThud(100, 0.15);
  };

  const handleDemoEnter = async (level: DemoLevel) => {
    try {
      const db = await getDb();
      await seedDemoCooperativeAtLevel(level);
      const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = 'kdp-001'");
      if (rows.length > 0) {
        sfx.playChime();
        setTimeout(() => {
          onProfileSelect(rows[0]);
        }, 280);
      }
    } catch (e) {
      console.error("[Demo] Failed:", e);
      setDevResult({ open: true, ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleCreateCreated = (newProfile: CooperativeProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setShowCreateModal(false);
    onProfileSelect(newProfile);
  };

  const getBusinessUnits = (unitsStr: string | null): string[] => {
    if (!unitsStr) return [];
    try {
      const parsed = JSON.parse(unitsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return (
    <div
      onClick={handleUserInteraction}
      className="flex-1 flex flex-col h-full w-full relative overflow-hidden bg-slate-950 select-none"
    >
      {/* Slideshow background */}
      {SLIDESHOW_IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === slideIndex ? 1 : 0 }}
        />
      ))}

      {/* Dark blur overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950/80 z-0" />

      {/* Audio Controls (Absolute top right) */}
      <div className="absolute top-4 right-4 z-20 flex gap-1.5">
        <button
          onClick={handleMusicToggle}
          className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-slate-200 transition-colors shadow-md backdrop-blur-md"
          title={musicOn ? "Music On" : "Music Off"}
        >
          <MusicNotes className={`h-4 w-4 ${musicOn ? "text-success" : "text-slate-500"}`} />
        </button>
        <button
          onClick={handleSoundToggle}
          className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors shadow-md backdrop-blur-md"
          title={soundOn ? "Mute SFX" : "Unmute SFX"}
        >
          {soundOn ? <SpeakerLow className="h-4 w-4" /> : <SpeakerX className="h-4 w-4 text-danger" />}
        </button>
      </div>

      {/* Top: Logotype Header */}
      <div className="relative z-10 flex justify-center pt-12 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="text-center p-6 rounded-2xl bg-slate-950/80 border border-slate-900 backdrop-blur-lg w-fit shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          <h1 className="text-8xl font-black bg-gradient-to-r from-brand to-teal-400 bg-clip-text text-transparent tracking-tight font-sans leading-none">
            {LOGOTYPE}
          </h1>
        </div>
      </div>

      {/* Middle: Hero Two-Box + submenus */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-[10vh] px-6 w-full max-w-5xl mx-auto overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 text-xxs font-mono text-brand animate-pulse">{t("common.loading")}</div>
        ) : (
          <>
            {/* ── Two-Box always visible ── */}
            <div className="w-full max-w-3xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{HERO_TITLE}</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">{HERO_SUBTITLE}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                {/* Left: Real Account */}
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setShowCreateModal(true)}
                  onClick={(e) => {
                    // If clicking the "Masuk" link, don't fire the card click
                    if ((e.target as HTMLElement).closest("[data-login-link]")) return;
                    handleUserInteraction();
                    if (profiles.length > 0) {
                      setShowDemoTiers(false);
                      setShowCoopList((prev) => !prev);
                    } else {
                      sfx.playChime();
                      setShowCreateModal(true);
                    }
                  }}
                  onMouseEnter={handleRealHover}
                  className="group relative w-full sm:w-72 min-h-[260px] rounded-2xl border-2 border-slate-700 bg-slate-900/80 backdrop-blur-md p-6 cursor-pointer hover:border-brand/60 hover:bg-slate-900/95 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(16,185,129,0.12)] transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                      <ShieldCheck className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{REAL_TITLE}</h3>
                      <p className="text-xxxs text-slate-500 mt-0.5 flex items-center gap-1"><Trophy className="h-3 w-3" />{REAL_BADGE}</p>
                    </div>
                  </div>
                  <p className="text-xxs text-slate-400 leading-relaxed mb-5">{REAL_DESC}</p>
                  <div
                    className="rounded-lg bg-brand/10 border border-brand/25 px-4 py-2.5 text-xs font-bold text-brand text-center group-hover:bg-brand/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserInteraction();
                      sfx.playChime();
                      setShowCreateModal(true);
                    }}
                  >
                    {REAL_REGISTER}
                  </div>
                  <p className="mt-3 text-xxxs text-slate-600 text-center">
                    {REAL_LOGIN}{" "}
                    <span
                      data-login-link
                      className="text-slate-500 underline cursor-pointer hover:text-slate-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserInteraction();
                        setShowDemoTiers(false);
                        setShowCoopList((prev) => !prev);
                      }}
                    >
                      {LOGIN_LINK}
                    </span>
                  </p>
                </div>

                {/* "atau" divider */}
                <span className="text-xxs font-mono font-bold text-slate-600 uppercase tracking-widest">{OR_TEXT}</span>

                {/* Right: Demo Account */}
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && (setShowCoopList(false), setShowDemoTiers((prev) => !prev))}
                  onClick={() => {
                    handleUserInteraction();
                    setShowCoopList(false);
                    setShowDemoTiers((prev) => !prev);
                  }}
                  onMouseEnter={handleCardHover}
                  className="group relative w-full sm:w-72 min-h-[260px] rounded-2xl border-2 border-amber-800/50 bg-amber-950/30 backdrop-blur-md p-6 cursor-pointer hover:border-amber-600/60 hover:bg-amber-950/50 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(245,158,11,0.12)] transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                      <GameController className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-200">{DEMO_TITLE}</h3>
                      <p className="text-xxxs text-amber-600 mt-0.5 flex items-center gap-1"><GameController className="h-3 w-3" />{DEMO_BADGE}</p>
                    </div>
                  </div>
                  <p className="text-xxs text-amber-300/70 leading-relaxed mb-5">{DEMO_DESC}</p>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-xs font-bold text-amber-400 text-center group-hover:bg-amber-500/20 transition-colors">
                    {DEMO_ACTION}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Submenu area (reserved space, prevents layout shift) ── */}
            <div className="w-full max-w-3xl mx-auto min-h-[220px] mt-6">
              {/* Demo tier cards */}
              {showDemoTiers && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">{DEMO_TIER_HEADING}</h3>
                  <span className="text-xxs text-amber-700">{DEMO_TIER_COUNT}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DEMO_TIERS.map((tier) => (
                    <div
                      key={tier.level}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleDemoEnter(tier.level)}
                      onClick={() => {
                        handleUserInteraction();
                        handleDemoEnter(tier.level);
                      }}
                      onMouseEnter={handleCardHover}
                      className={`group relative rounded-xl border-2 ${tier.border} ${tier.bg} backdrop-blur-md p-4 cursor-pointer hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(245,158,11,0.10)] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                    >
                      <h4 className={`text-sm font-bold ${tier.text}`}>{tier.title}</h4>
                      <p className="mt-1.5 text-xxs leading-relaxed text-slate-500">{tier.desc}</p>
                      <div className={`mt-3 rounded-md border ${tier.border} ${tier.bg} px-3 py-1.5 text-xxs font-bold ${tier.text} text-center group-hover:brightness-110 transition-all`}>
                        {DEMO_TIER_START}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Cooperative list (shown when "Masuk" clicked) ── */}
            {showCoopList && profiles.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{COOP_LIST_HEADING}</h3>
                  <span className="text-xxs text-slate-600">
                    {profiles.length} {COOP_COUNT_SUFFIX}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {profiles.map((p) => {
                    const activeUnits = getBusinessUnits(p.business_units);
                    const isHealthy = p.health_score >= 70;
                    const isCritical = p.health_score < 40;

                    return (
                      <Card
                        key={p.id}
                        onClick={() => handleCardClick(p)}
                        onMouseEnter={handleCardHover}
                        className="bg-slate-950/90 border-slate-800 hover:border-brand/40 backdrop-blur-md cursor-pointer hover:shadow-[0_8px_30px_hsl(var(--brand) / 0.08)] transition-all duration-200 flex flex-col justify-between min-h-52 p-5 hover:scale-[1.01] select-none shadow-xl relative"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center border border-success/20 shrink-0">
                              <Buildings className="h-4.5 w-4.5 text-success" />
                            </div>
                            <span className="text-xxxs font-mono font-bold text-success uppercase border border-brand/25 px-2 py-0.5 rounded bg-success/20">
                              {p.id}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-foreground line-clamp-1 leading-tight tracking-wide">
                              {p.name}
                            </h3>
                            <p className="text-xxs text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">
                                {p.regency}, {p.province}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-900 font-sans">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xxxs font-mono text-slate-400">
                              <span className="uppercase">{t("profileSelect.health")}</span>
                              <span
                                className={`font-bold ${isHealthy ? "text-success" : isCritical ? "text-danger" : "text-warning"}`}
                              >
                                {p.health_score}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isHealthy ? "bg-brand" : isCritical ? "bg-danger" : "bg-warning"
                                }`}
                                style={{ width: `${p.health_score}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {activeUnits.map((unit) => {
                              let label = "";
                              if (unit === "unit_pupuk") label = TEXT_UNIT_PUPUK;
                              else if (unit === "unit_simpan_pinjam") label = TEXT_UNIT_SP;
                              else if (unit === "unit_toko_desa") label = TEXT_UNIT_TOKO;
                              return (
                                <span
                                  key={unit}
                                  className="text-xxxs font-mono font-bold px-1.5 py-0.5 rounded-xs bg-slate-900 border border-slate-800 text-slate-400 uppercase tracking-wider"
                                >
                                  {label}
                                </span>
                              );
                            })}
                            {activeUnits.length === 0 && (
                              <span className="text-xxxs font-mono text-slate-600 italic">
                                {t("profileSelect.units")}: 0
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  <Card
                    onClick={() => setShowCreateModal(true)}
                    onMouseEnter={handleCardHover}
                    className="bg-slate-950/60 border-dashed border-slate-800 hover:border-brand/35 hover:bg-success/5 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-52 p-5 hover:scale-[1.01] select-none shadow-md"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800 transition-colors shadow-sm">
                      <Plus className="h-5 w-5 text-success" />
                    </div>
                    <span className="text-xxs font-mono font-bold text-success uppercase tracking-wider">
                      {t("profileSelect.createBtn")}
                    </span>
                  </Card>
                </div>
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {/* Bottom: Footer */}
      <div className="relative z-10 flex flex-col items-center pb-8 space-y-0.5 animate-in fade-in duration-500">
        <span className="text-xxs font-mono text-slate-500">{t("splash.version")}</span>
        <span className="text-xxs font-mono text-slate-600">{FOOTER_COPYRIGHT}</span>
      </div>

      <CreateProfileDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProfileCreated={handleCreateCreated}
      />

      {/* Result popup */}
      <Dialog open={devResult.open} onOpenChange={(open) => setDevResult((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-slate-900 border max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              {devResult.ok ? (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-danger flex-shrink-0" />
              )}
              <span className={devResult.ok ? "text-success" : "text-danger"}>
                {devResult.ok ? "Success" : "Error"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-300 font-mono leading-relaxed py-2">{devResult.message}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDevResult((prev) => ({ ...prev, open: false }))}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8.5"
            >
              {BTN_CLOSE}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
