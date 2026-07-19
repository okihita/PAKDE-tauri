import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  SpeakerLow,
  SpeakerX,
  MusicNotes,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheck,
  GameController,
  TrophyIcon,
  Camera,
  Buildings,
  CircleNotch,
  ArrowLeft,
  ArrowCircleUp,
} from "@phosphor-icons/react";
import type { CooperativeProfile } from "@/types";
import { initDb } from "@/db";
import { getCoopDb } from "@/db/coopDb";
import { ensureDemoNews } from "@/db/news";
import { listCooperatives, getDemoCooperative } from "./cooperativeDb";
import { sfx } from "./sfx";
import { bgMusic } from "./music";
import CreateProfileDialog from "./CreateProfileDialog";
import CooperativeCardList from "./CooperativeCardList";
import JoinExistingCoop from "./JoinExistingCoop";
import { UNIT_CONFIG } from "./unitIcons";
import { DEMO_TIERS } from "./demoTiers";
import CampaignBriefingDialog from "./CampaignBriefingDialog";
import DirectionalTransition, { type SwapDir } from "./DirectionalTransition";
import { seedDemoCooperativeAtLevel, isDemoSeeded, isDemoCooperative, type DemoLevel } from "@/db/seed-demo";
import type { UpdaterApi } from "@/hooks/useUpdater";
import { useAppVersion } from "@/hooks/useAppVersion";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Module-level constants for branding (not translatable)
const LOGOTYPE = "PAKDE";
const FOOTER_COPYRIGHT = "© 2026 PAKDE. pakde.vercel.app";

const SLIDESHOW_IMAGES = [
  "/slideshow-1.webp",
  "/slideshow-2.webp",
  "/slideshow-3.webp",
  "/slideshow-4.webp",
  "/slideshow-5.webp",
];
const SLIDE_INTERVAL_MS = 5000;

const JOIN_TITLE = "Gabung Koperasi";
const JOIN_BADGE = "Cari & Temukan";
const JOIN_DESC = "Cari koperasi yang sudah terdaftar di jaringan PAKDE dan bergabung dengan kode registrasi.";
const JOIN_ACTION = "Cari Koperasi";

interface ProfileSelectProps {
  onProfileSelect: (profile: CooperativeProfile) => void;
  onDbError: (message: string) => void;
  updater: UpdaterApi;
}

export default function ProfileSelect({ onProfileSelect, onDbError, updater }: ProfileSelectProps) {
  const { t } = useTranslation();
  const appVersion = useAppVersion();
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
  const [selectedTier, setSelectedTier] = useState<DemoLevel | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [showJoinExisting, setShowJoinExisting] = useState(false);
  const [demoExists, setDemoExists] = useState(false);

  // Slideshow loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Music pause on unmount
  useEffect(() => {
    return () => {
      bgMusic.pause();
    };
  }, []);

  const loadProfiles = async () => {
    const list = await listCooperatives();
    setProfiles(list);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        // Database initialization (schema create/migrate) is offloaded here so
        // the title screen itself doubles as the loading screen. Tables must
        // exist before any profile query below.
        await initDb();
        await loadProfiles();
        const seeded = await isDemoSeeded();
        if (active) setDemoExists(seeded);
      } catch (e) {
        console.error(e);
        if (active) {
          setLoading(false);
          onDbError(e instanceof Error ? e.message : String(e));
        }
        return;
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [onDbError]);

  // Escape: close any open sub-view. Capture phase so this fires before App.tsx's quitter.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // JoinExistingCoop handles its own Escape — don't close it from here
      if (showJoinExisting) return;
      if (showCoopList) {
        e.stopImmediatePropagation();
        setShowCoopList(false);
      } else if (showDemoTiers) {
        e.stopImmediatePropagation();
        setShowDemoTiers(false);
      } else if (showCreateModal) {
        e.stopImmediatePropagation();
        setShowCreateModal(false);
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true });
  }, [showJoinExisting, showCoopList, showDemoTiers, showCreateModal]);

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

  /** Load existing demo data without re-seeding — preserves user progress. */
  const resumeDemo = async () => {
    try {
      const coop = await getDemoCooperative();
      if (coop) {
        // Guarantee the demo's mock news feed is present (idempotent upsert) so
        // Beranda always shows content even on a pre-existing account.
        if (isDemoCooperative(coop)) {
          const db = await getCoopDb(coop.id);
          await ensureDemoNews(db);
        }
        sfx.playChime();
        setTimeout(() => {
          onProfileSelect(coop);
        }, 280);
      }
    } catch (e) {
      console.error("[Demo] Resume failed:", e);
      setDevResult({ open: true, ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  };

  /** Clear + re-seed the demo at the chosen tier — used for fresh starts only. */
  const startFreshDemo = async (level: DemoLevel) => {
    try {
      await seedDemoCooperativeAtLevel(level);
      localStorage.setItem("pakde-demo-tier", level);
      setDemoExists(true);
      const coop = await getDemoCooperative();
      if (coop) {
        sfx.playChime();
        setTimeout(() => {
          onProfileSelect(coop);
        }, 280);
      }
    } catch (e) {
      console.error("[Demo] Start fresh failed:", e);
      setDevResult({ open: true, ok: false, message: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleCreateCreated = (newProfile: CooperativeProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setShowCreateModal(false);
    onProfileSelect(newProfile);
  };

  // A submenu (demo tiers / cooperative list) replaces the three-box hero
  // in-place so the view fits one viewport instead of stacking and scrolling.
  const closeSubmenu = () => {
    setShowDemoTiers(false);
    setShowCoopList(false);
  };

  // Which "view" is active, and the edge each submenu enters from.
  // Demo sits on the right card → slides from right; Real/coop on the left → left.
  const view: "hero" | "demo" | "coop" | "join" = showJoinExisting
    ? "join"
    : showDemoTiers
      ? "demo"
      : showCoopList && profiles.length > 0
        ? "coop"
        : "hero";
  const DIR_MAP: Record<string, SwapDir> = { hero: "fade", demo: "right", coop: "left", join: "fade" };

  return (
    <div
      onClick={handleUserInteraction}
      className="flex-1 flex flex-col h-full w-full relative overflow-hidden bg-slate-950 select-none"
    >
      {/* Slideshow background — slow Ken Burns zoom, 5s cadence.
          Wrapper key is stable so the opacity cross-fade is preserved; the
          inner <img> key flips on activation so the zoom restarts each cycle. */}
      {SLIDESHOW_IMAGES.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === slideIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            key={i === slideIndex ? `active-${i}` : `idle-${i}`}
            src={src}
            alt=""
            className={`w-full h-full object-cover ${i === slideIndex ? "ken-burns" : ""}`}
          />
        </div>
      ))}

      {/* Dark blur overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] bg-linear-to-b from-slate-950/20 via-slate-950/50 to-slate-950/80 z-0" />

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
          <h1 className="text-8xl font-black bg-linear-to-r from-brand to-teal-400 bg-clip-text text-transparent tracking-tight font-sans leading-none">
            {LOGOTYPE}
          </h1>
        </div>
      </div>

      {/* Middle: directional submenu transition — demo slides from right,
          coop from left (each from its trigger card), hero/join use a fade. */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-[10vh] px-6 w-full max-w-5xl mx-auto overflow-y-auto">
        <DirectionalTransition active={view} dirMap={DIR_MAP}>
          {/* ── HERO (default landing) ── */}
          <div key="hero" className="w-full max-w-5xl mx-auto text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t("profileSelect.heroTitle")}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">{t("profileSelect.heroSubtitle")}</p>
            </div>

            <div
              className={`relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-3 transition-opacity duration-300 ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {/* Left: Real Account */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowCreateModal(true)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-login-link]")) return;
                  handleUserInteraction();
                  if (profiles.length > 0) {
                    sfx.playBleep(600, 0.03);
                    setShowDemoTiers(false);
                    setShowCoopList((prev) => !prev);
                  } else {
                    sfx.playChime();
                    setShowCreateModal(true);
                  }
                }}
                onMouseEnter={handleRealHover}
                className="group relative w-full md:w-56 min-h-[240px] rounded-2xl border-2 border-slate-700 bg-slate-900/80 backdrop-blur-md p-5 cursor-pointer hover:border-brand/60 hover:bg-slate-900/95 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(16,185,129,0.12)] transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{t("profileSelect.realTitle")}</h3>
                    <p className="text-xxxs text-slate-500 mt-0.5 flex items-center gap-1">
                      <TrophyIcon className="h-3 w-3" />
                      {t("profileSelect.realBadge")}
                    </p>
                  </div>
                </div>
                <p className="text-xxs text-slate-400 leading-relaxed mb-4">{t("profileSelect.realDesc")}</p>
                <div
                  className="rounded-lg bg-brand/10 border border-brand/25 px-3 py-2 text-xs font-bold text-brand text-center group-hover:bg-brand/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserInteraction();
                    sfx.playChime();
                    setShowCreateModal(true);
                  }}
                >
                  {t("profileSelect.realRegister")}
                </div>
                <p className="mt-2.5 text-xxxs text-slate-600 text-center">
                  {t("profileSelect.realLogin")}{" "}
                  <span
                    data-login-link
                    className="text-slate-500 underline cursor-pointer hover:text-slate-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserInteraction();
                      sfx.playBleep(600, 0.03);
                      setShowDemoTiers(false);
                      setShowCoopList((prev) => !prev);
                    }}
                  >
                    {t("profileSelect.loginLink")}
                  </span>
                </p>
              </div>

              {/* "atau" divider */}
              <span className="text-xxs font-bold text-slate-600 uppercase tracking-widest">
                {t("profileSelect.orText")}
              </span>

              {/* Middle: Join Existing */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setShowJoinExisting(true)}
                onClick={() => {
                  handleUserInteraction();
                  sfx.playBleep(600, 0.03);
                  setShowDemoTiers(false);
                  setShowCoopList(false);
                  setShowJoinExisting(true);
                }}
                onMouseEnter={handleCardHover}
                className="group relative w-full md:w-56 min-h-[240px] rounded-2xl border-2 border-info/50 bg-info/10 backdrop-blur-md p-5 cursor-pointer hover:border-info/60 hover:bg-info/20 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(59,130,246,0.12)] transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-info/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-info/10 border border-info/30 flex items-center justify-center shrink-0 group-hover:bg-info/20 transition-colors">
                    <Buildings className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{JOIN_TITLE}</h3>
                    <p className="text-xxxs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Buildings className="h-3 w-3" />
                      {JOIN_BADGE}
                    </p>
                  </div>
                </div>
                <p className="text-xxs text-slate-400 leading-relaxed mb-4">{JOIN_DESC}</p>
                <div className="invisible h-[1.5rem]" />
                <div className="mt-auto rounded-lg bg-info/10 border border-info/25 px-3 py-2 text-xs font-bold text-info text-center group-hover:bg-info/20 transition-colors">
                  {JOIN_ACTION}
                </div>
              </div>

              {/* "atau" divider */}
              <span className="text-xxs font-bold text-slate-600 uppercase tracking-widest">
                {t("profileSelect.orText")}
              </span>

              {/* Right: Demo Account */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  setShowCoopList(false);
                  setShowJoinExisting(false);
                  setShowDemoTiers((prev) => !prev);
                }}
                onClick={() => {
                  handleUserInteraction();
                  sfx.playBleep(600, 0.03);
                  setShowCoopList(false);
                  setShowJoinExisting(false);
                  setShowDemoTiers((prev) => !prev);
                }}
                onMouseEnter={handleCardHover}
                className="group relative w-full md:w-56 min-h-[240px] rounded-2xl border-2 border-amber-800/50 bg-amber-950/30 backdrop-blur-md p-5 cursor-pointer hover:border-amber-600/60 hover:bg-amber-950/50 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(245,158,11,0.12)] transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <GameController className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-200">{t("profileSelect.demoTitle")}</h3>
                    <p className="text-xxxs text-amber-600 mt-0.5 flex items-center gap-1">
                      <GameController className="h-3 w-3" />
                      {t("profileSelect.demoBadge")}
                    </p>
                  </div>
                </div>
                <p className="text-xxs text-amber-300/70 leading-relaxed mb-4">{t("profileSelect.demoDesc")}</p>
                <div className="invisible h-[1.5rem]" />
                <div className="mt-auto rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs font-bold text-amber-400 text-center group-hover:bg-amber-500/20 transition-colors">
                  {t("profileSelect.demoAction")}
                </div>
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                  <CircleNotch className="h-7 w-7 text-brand animate-spin" weight="bold" />
                </div>
              )}
            </div>
          </div>

          {/* ── DEMO pane (slides in from the right) ── */}
          <div key="demo" className="w-full max-w-3xl mx-auto mt-2">
            <div className="flex justify-end mb-4">
              <button
                onClick={closeSubmenu}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("profileSelect.back")}
              </button>
            </div>
            <div>
              {/* Resume card — only when a demo already exists */}
              {demoExists && (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && resumeDemo()}
                    onClick={() => {
                      handleUserInteraction();
                      resumeDemo();
                    }}
                    onMouseEnter={handleCardHover}
                    className="group relative w-full rounded-xl border-2 border-amber-500/50 bg-amber-950/60 backdrop-blur-md p-5 cursor-pointer hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(245,158,11,0.18)] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-400/50 mb-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
                        <GameController className="h-5 w-5 text-amber-400" weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-amber-200">{t("profileSelect.resumeCardTitle")}</h4>
                        <p className="text-xxs text-amber-400/60 mt-0.5">{t("profileSelect.resumeCardDesc")}</p>
                      </div>
                      <div className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                        {t("profileSelect.resumeCardAction")}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-xxs text-slate-500 uppercase tracking-widest">
                      {t("profileSelect.freshStartDivider")}
                    </span>
                  </div>
                </>
              )}

              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider text-center mb-4">
                {demoExists ? t("profileSelect.freshStartHeading") : t("profileSelect.tierHeading")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_TIERS.map((tier) => (
                  <div
                    key={tier.level}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedTier(tier.level)}
                    onClick={() => {
                      handleUserInteraction();
                      setSelectedTier(tier.level);
                    }}
                    onMouseEnter={handleCardHover}
                    className={`group relative rounded-xl border-2 ${tier.border} ${tier.bg} backdrop-blur-md p-4 cursor-pointer hover:scale-[1.03] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_25px_rgba(245,158,11,0.10)] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                  >
                    {/* Image placeholder */}
                    <div className="w-full h-20 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3">
                      <Camera className="h-5 w-5 text-slate-600" />
                    </div>
                    <h4 className={`text-sm font-bold ${tier.text}`}>{tier.title}</h4>
                    {/* Stats */}
                    <div className="mt-2 text-xxxs text-slate-500">
                      <p>
                        {tier.stats[0].label} <span className="text-slate-300">{tier.stats[0].value}</span>
                      </p>
                      <p>
                        <span className="text-slate-300">{tier.stats[1].value}</span> {tier.stats[1].label}
                        {tier.stats[2] && (
                          <>
                            {" "}
                            · <span className="text-slate-300">{tier.stats[2].value}</span> {tier.stats[2].label}
                          </>
                        )}
                      </p>
                    </div>
                    {/* Location */}
                    <p className="mt-1.5 text-xxxs text-slate-600">
                      {tier.village}, {tier.regency}
                    </p>
                    {/* Unit icons */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {tier.units.map((unitId) => {
                        const cfg = UNIT_CONFIG[unitId];
                        if (!cfg) return null;
                        const Icon = cfg.icon;
                        return (
                          <Tooltip key={unitId} label={cfg.label} description={cfg.desc} className="inline-flex">
                            <div
                              className={`flex items-center justify-center h-6 w-6 rounded-md border ${cfg.boxClass}`}
                            >
                              <Icon weight="fill" className={`h-3.5 w-3.5 ${cfg.iconClass}`} />
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {demoExists && (
                <p className="text-xxxs text-amber-500/60 text-center mt-3 flex items-center justify-center gap-1">
                  ⚠ {t("profileSelect.freshStartWarning")}
                </p>
              )}
            </div>
          </div>

          {/* ── COOP pane (slides in from the left) ── */}
          <div key="coop" className="w-full max-w-3xl mx-auto mt-2">
            <div className="flex justify-start mb-4">
              <button
                onClick={closeSubmenu}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("profileSelect.back")}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("profileSelect.coopListHeading")}
                </h3>
              </div>
              <CooperativeCardList
                profiles={profiles}
                onCardClick={handleCardClick}
                onCardHover={handleCardHover}
                onCreateClick={() => setShowCreateModal(true)}
              />
            </div>
          </div>

          {/* ── JOIN pane (neutral fade) ── */}
          <div key="join" className="w-full max-w-5xl mx-auto">
            <JoinExistingCoop
              onJoined={(profile) => {
                setProfiles((prev) => [profile, ...prev]);
                setShowJoinExisting(false);
                onProfileSelect(profile);
              }}
              onBack={() => setShowJoinExisting(false)}
            />
          </div>
        </DirectionalTransition>
      </div>

      {/* Bottom: Footer */}
      <div className="relative z-10 flex flex-col items-center pb-8 space-y-1.5 animate-in fade-in duration-500">
        <span className="text-xxs text-slate-500">{t("splash.version", { version: appVersion })}</span>

        {/* Update entry — visible on the title screen (no login required) */}
        <div className="flex flex-col items-center gap-1.5">
          {updater.updateAvailable && !updater.isUpdateChecking && (
            <button
              onClick={() => void updater.startUpdate()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xxs font-bold bg-brand/15 border border-brand/40 text-brand hover:bg-brand/25 transition-colors backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <ArrowCircleUp className="h-3.5 w-3.5" weight="fill" />
              {t("profileSelect.update.available")}
            </button>
          )}
          {!updater.updateAvailable && !updater.isUpdateChecking && (
            <button
              onClick={() => void updater.startUpdate()}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xxs font-bold bg-slate-900/80 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-colors backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-slate-600/50"
              title={t("profileSelect.update.check")}
            >
              <ArrowCircleUp className="h-3.5 w-3.5" />
              {t("profileSelect.update.check")}
            </button>
          )}
          {updater.isUpdateChecking && (
            <div className="w-56 max-w-[80vw] space-y-1">
              <span className="block text-center text-xxs font-mono font-semibold text-success">
                {updater.updateStatusText}
              </span>
              {updater.downloadContentLength > 0 && (
                <div className="w-full bg-slate-900/80 rounded-full h-1 border border-slate-800 overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all duration-300"
                    style={{ width: `${updater.downloadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <img src="/logo_kemenkop.svg" alt={t("profileSelect.footerKemenkopAlt")} className="h-6 w-auto opacity-70" />
          <span className="text-xxs text-slate-600">{FOOTER_COPYRIGHT}</span>
        </div>
      </div>

      <CreateProfileDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProfileCreated={handleCreateCreated}
      />

      {/* Campaign briefing popup */}
      {selectedTier &&
        (() => {
          const tier = DEMO_TIERS.find((t) => t.level === selectedTier);
          if (!tier) return null;
          return (
            <CampaignBriefingDialog
              tier={tier}
              seeding={seeding}
              isReseed={demoExists}
              onStart={async () => {
                setSeeding(true);
                try {
                  await startFreshDemo(tier.level);
                } finally {
                  setSeeding(false);
                  setSelectedTier(null);
                }
              }}
              onClose={() => setSelectedTier(null)}
            />
          );
        })()}

      {/* Result popup */}
      <Dialog open={devResult.open} onOpenChange={(open) => setDevResult((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-slate-900 border max-w-sm shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold">
              {devResult.ok ? (
                <CheckCircleIcon className="h-5 w-5 text-success shrink-0" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-danger shrink-0" />
              )}
              <span className={devResult.ok ? "text-success" : "text-danger"}>
                {devResult.ok ? "Success" : "Error"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-300 leading-relaxed py-2">{devResult.message}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDevResult((prev) => ({ ...prev, open: false }))}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs h-8.5"
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
