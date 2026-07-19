// Full-width RPG campaign strip for the Beranda screen.
//
// Region 1: tier track (currentTier -> currentTier+2), XP-driven.
// Region 2: an RPG box with a dialogue -> scene state machine.
//   - dialogue: typewriter script + "Next" button (i18n ready).
//   - scene: a living kopdes vignette (building + crowd + leader) bound to
//     real coop state (tier, member count, board readiness).
//
// Strict simplicity: <=2 CSS animation loops, flat/gradient SVG fills, exactly 3 state
// bindings (tier, members, pengurus). No new DB/store/router.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentLevel, LEVELS } from "@/data/leveling";
import { getTierBand } from "@/data/xp-core";
import { getCoopMemberCount } from "@/hooks/useMembers";
import { onMembersChanged } from "@/lib/memberEvents";
import { getActiveCoopId } from "@/db/active-coop";
import { sfx } from "@/features/System/ProfileSelect/sfx";
import KopdesBuilding from "./KopdesBuilding";

// Per-campaign "seen" flag — namespaced by coop id so a NEW campaign (new coop
// profile) replays the intro dialogue instead of being permanently suppressed
// by a global flag. Falls back to the legacy global key for pre-namespacing data.
const SEEN_KEY = "pakde-campaign-seen";
const seenKeyFor = (coopId: string) => (coopId ? `pakde-campaign-seen:${coopId}` : SEEN_KEY);

// Default Indonesian script fallback (in case i18n array isn't populated).
const DEFAULT_SCRIPT: string[] = [
  "Penatua Desa: Selamat datang, Pengurus. Koperasi ini baru saja berdiri.",
  "Tugasmu sederhana - bawa koperasi ini naik dua tingkat dari sekarang.",
  "Daftarkan warga, catat keuangan, dan biarkan desa ini tumbuh.",
  "Setiap langkahmu akan kuteruskan ke pembukuan. Mari kita mulai.",
];

const VILLAGER_EMOJIS = ["🧑‍🌾", "👩‍🌾", "🧑‍💼", "👩‍💼", "👨‍🍳", "👩‍💻", "👨‍🔧", "👩‍🔬", "👨‍🎨", "👩‍🌾"];
const MAX_CROWD = 10;
const TYPE_SPEED_MS = 22;

type SceneMode = "dialogue" | "scene";

interface CampaignStripProps {
  xp?: number;
  /** Whether >=3 active board positions exist (leader appears in scene). */
  pengurusReady?: boolean;
}

export default function CampaignStrip({ xp = 0, pengurusReady = false }: CampaignStripProps) {
  const { t } = useTranslation();
  const currentLevel = getCurrentLevel(xp);
  const currentTier = currentLevel.tier;
  const goalTier = Math.min(10, currentTier + 2);
  const midTier = Math.min(10, currentTier + 1);
  const band = getTierBand(currentTier);

  // Background atmosphere per tier band
  const backdropClass = useMemo(() => {
    switch (band.en) {
      case "Gold":
        return "from-amber-950/60 via-slate-900/80 to-card border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]";
      case "Silver":
        return "from-sky-950/60 via-slate-900/80 to-card border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.15)]";
      default:
        return "from-emerald-950/60 via-slate-900/80 to-card border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]";
    }
  }, [band.en]);

  const startMinXp = LEVELS[currentTier - 1]?.minXp ?? 0;
  const goalMinXp = LEVELS[goalTier - 1]?.minXp ?? startMinXp + 1;
  const progress = Math.max(0, Math.min(1, (xp - startMinXp) / Math.max(1, goalMinXp - startMinXp)));

  const coopId = getActiveCoopId();
  const [mode, setMode] = useState<SceneMode>(() =>
    typeof localStorage !== "undefined" && localStorage.getItem(seenKeyFor(coopId)) === "1" ? "scene" : "dialogue",
  );
  const [lineIdx, setLineIdx] = useState(0);
  const [shownLength, setShownLength] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  // Load localized script array with fallback
  const scriptLines = useMemo(() => {
    const raw = t("campaign.script", { returnObjects: true });
    return Array.isArray(raw) && raw.length > 0 ? (raw as string[]) : DEFAULT_SCRIPT;
  }, [t]);

  const fullLine = scriptLines[lineIdx] ?? scriptLines[0] ?? "";

  // Typewriter effect for the current dialogue line.
  useEffect(() => {
    if (mode !== "dialogue") return;
    const timer = setInterval(() => {
      setShownLength((prev) => {
        if (prev >= fullLine.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, TYPE_SPEED_MS);
    return () => clearInterval(timer);
  }, [mode, lineIdx, fullLine.length]);

  const advance = useCallback(() => {
    if (lineIdx < scriptLines.length - 1) {
      sfx.playClick(420, 0.04);
      setShownLength(0);
      setLineIdx((n) => n + 1);
    } else {
      sfx.playChime();
      localStorage.setItem(seenKeyFor(getActiveCoopId()), "1");
      setMode("scene");
    }
  }, [lineIdx, scriptLines.length]);

  const isTypingFinished = shownLength >= fullLine.length;
  const shown = fullLine.slice(0, shownLength);

  // Instantly finish typewriter on first click, or advance line on second click.
  const completeOrAdvance = useCallback(() => {
    if (shownLength < fullLine.length) {
      sfx.playClick(300, 0.05);
      setShownLength(fullLine.length);
    } else {
      advance();
    }
  }, [shownLength, fullLine.length, advance]);

  const replayDialogue = useCallback(() => {
    sfx.playClick(350, 0.05);
    setShownLength(0);
    setLineIdx(0);
    setMode("dialogue");
  }, []);

  // Live member count for the crowd.
  useEffect(() => {
    let alive = true;
    const refresh = () => getCoopMemberCount().then((n) => alive && setMemberCount(n));
    refresh();
    const unsub = onMembersChanged(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const crowd = Math.min(memberCount, MAX_CROWD);
  const overflow = memberCount - crowd;

  // Split speaker prefix for highlighted formatting (e.g. "Penatua Desa: ")
  const speakerMatch = shown.match(/^([^:]+:\s*)(.*)/);
  const speakerPrefix = speakerMatch ? speakerMatch[1] : null;
  const dialogueBody = speakerMatch ? speakerMatch[2] : shown;

  return (
    <div className="w-full pb-4">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-linear-to-b ${backdropClass} bg-cover bg-center bg-no-repeat backdrop-blur-md transition-all duration-700 [background-image:url('/campaign-bg.jpg')]`}
      >
        {/* Ambient Overlay Vignette */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Region 1 — Tier track */}
        <div className="relative flex flex-col gap-2.5 px-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xxs font-mono font-semibold uppercase tracking-widest text-slate-200">
                {t("campaign.title", "Kampanye · Tingkat")} {currentTier} → {goalTier}
              </span>
            </div>
            <span className={`text-xxxs font-semibold px-2 py-0.5 rounded-full border shadow-xs ${band.cls}`}>
              {band.id}
            </span>
          </div>

          {/* XP Progress Bar with Milestone Tier Pips & Shimmer */}
          <div className="relative my-1">
            <div className="relative h-2.5 w-full rounded-full bg-slate-950/80 p-0.5 border border-white/10 shadow-inner overflow-hidden">
              <div
                className="relative h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                style={{ width: `${progress * 100}%` }}
              >
                {/* Shimmer light pass */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>

            {/* Tier Milestone Nodes */}
            <div className="absolute inset-x-0 -top-1 flex justify-between px-1 pointer-events-none">
              {/* Tier Current Node */}
              <div className="flex flex-col items-center">
                <span className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950 ring-2 ring-emerald-400/60 shadow-md flex items-center justify-center text-xxxs font-bold text-slate-950">
                  T{currentTier}
                </span>
              </div>
              {/* Tier Mid Node */}
              <div className="flex flex-col items-center">
                <span
                  className={`h-4 w-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-xxxs font-bold ${
                    progress >= 0.5
                      ? "bg-teal-400 text-slate-950 ring-2 ring-teal-400/60 shadow-md"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  T{midTier}
                </span>
              </div>
              {/* Tier Goal Node */}
              <div className="flex flex-col items-center">
                <span
                  className={`h-4 w-4 rounded-full border-2 border-slate-950 flex items-center justify-center text-xxxs font-bold ${
                    progress >= 1
                      ? "bg-amber-400 text-slate-950 ring-2 ring-amber-400/60 shadow-md"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  T{goalTier}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xxxs font-mono text-slate-400">
            <span className="font-semibold text-emerald-400">XP {xp}</span>
            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 border border-white/5 font-bold text-slate-200">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        {/* Region 2 — RPG box (fixed 112px / h-28 height for seamless mode transitions) */}
        <div className="relative px-6 py-4">
          {mode === "dialogue" ? (
            <div className="flex h-28 items-end gap-4 cursor-pointer" onClick={completeOrAdvance}>
              {/* Elder Avatar Frame */}
              <div className="flex shrink-0 flex-col items-center gap-1.5 justify-end">
                <div className="relative grid h-16 w-16 place-items-center rounded-2xl border-2 border-amber-400/60 bg-linear-to-b from-slate-800 to-slate-950 text-3xl shadow-xl shadow-amber-950/40 backdrop-blur-md">
                  <span aria-hidden="true" className="drop-shadow-md select-none animate-[bounce_3s_infinite]">
                    👴
                  </span>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-xxxs text-slate-950 font-bold ring-2 ring-slate-900">
                    📜
                  </span>
                </div>
                <span className="text-xxxs font-bold uppercase tracking-wider text-amber-200/90 shadow-xs">
                  {t("campaign.elder", "Penatua Desa")}
                </span>
              </div>

              {/* Dialogue Box with Tail */}
              <div
                data-sfx="ignore"
                className="relative h-full flex-1 flex flex-col justify-center rounded-2xl border border-amber-500/20 bg-slate-900/90 p-4 text-xs leading-relaxed text-slate-100 shadow-xl backdrop-blur-md transition-all hover:border-amber-400/40 select-none before:absolute before:-left-2.5 before:bottom-5 before:h-0 before:w-0 before:border-y-6 before:border-y-transparent before:border-r-8 before:border-r-slate-900/90"
              >
                <div>
                  {speakerPrefix && <span className="font-semibold text-amber-300 mr-1">{speakerPrefix}</span>}
                  <span>{dialogueBody}</span>

                  {/* Animated Glowing Cursor */}
                  {!isTypingFinished && (
                    <span className="ml-1 inline-block font-bold text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">
                      ▌
                    </span>
                  )}
                </div>
              </div>

              {/* Continue / Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  completeOrAdvance();
                }}
                data-sfx="ignore"
                className="shrink-0 self-end rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xxs font-bold text-white shadow-lg shadow-emerald-950/50 transition-all hover:scale-105 hover:from-emerald-400 hover:to-teal-500 active:scale-95 animate-pulse cursor-pointer"
              >
                {isTypingFinished ? t("campaign.next", "▸ Lanjut") : t("campaign.skip", "▸ Skip")}
              </button>
            </div>
          ) : (
            /* Scene Mode — Kopdes Vignette (exact same h-28 height) */
            <div className="flex h-28 items-end justify-between gap-4">
              <KopdesBuilding
                tier={currentTier}
                goalTier={goalTier}
                className="h-28 w-44 shrink-0 drop-shadow-2xl transition-transform duration-500 hover:scale-102"
              />

              <div className="flex h-full flex-1 flex-col justify-end gap-2.5">
                {/* Crowd Figures */}
                <div className="flex flex-wrap items-end gap-1.5 text-xl leading-none">
                  {Array.from({ length: crowd }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block animate-bounce drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)] select-none"
                      style={{ animationDelay: `${(i % 5) * 150}ms`, animationDuration: "2.4s" }}
                      title={`${t("campaign.residents", "Warga")} #${i + 1}`}
                    >
                      {VILLAGER_EMOJIS[i % VILLAGER_EMOJIS.length]}
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-xxs font-mono text-slate-300 border border-white/10 backdrop-blur-xs">
                      +{overflow} {t("campaign.overflow", "lainnya")}
                    </span>
                  )}
                  {pengurusReady && (
                    <div
                      className="relative ml-1 grid h-7 w-7 place-items-center rounded-full bg-linear-to-b from-amber-400 to-amber-600 shadow-md ring-2 ring-amber-300/50 animate-pulse"
                      title={t("campaign.leader", "Pengurus")}
                    >
                      <span className="text-sm select-none">👑</span>
                    </div>
                  )}
                </div>

                {/* Village Info Strip & Dialogue Replay Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xxxs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-900/60 px-2 py-1 border border-white/5">
                      {t("campaign.residents", "Warga:")} <strong className="text-emerald-400">{memberCount}</strong>{" "}
                      {t("campaign.tierLabel", "· Tingkat")} {currentTier}/{goalTier}
                    </span>
                    {currentTier >= goalTier && (
                      <span className="rounded-md bg-emerald-500/20 px-2 py-1 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs animate-bounce">
                        {t("campaign.done", "🎉 kampanye selesai")}
                      </span>
                    )}
                  </div>

                  {/* Replay Dialogue Button */}
                  <button
                    onClick={replayDialogue}
                    title={t("campaign.replayTitle", "Buka kembali dialog RPG Penatua Desa")}
                    className="flex items-center gap-1 rounded-md bg-slate-900/80 hover:bg-slate-800 px-2 py-1 text-amber-300/90 hover:text-amber-200 border border-amber-500/20 hover:border-amber-400/40 transition-all text-xxxs font-semibold cursor-pointer active:scale-95"
                  >
                    <span>📜</span>
                    <span>{t("campaign.replay", "Dialog")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
