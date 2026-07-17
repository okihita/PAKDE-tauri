// Full-width RPG campaign strip for the Beranda screen.
//
// Region 1: tier track (currentTier -> currentTier+2), XP-driven.
// Region 2: an RPG box with a dialogue -> scene state machine.
//   - dialogue: hardcoded typewriter script + "Next" button.
//   - scene: a living kopdes vignette (building + crowd + leader) bound to
//     real coop state (tier, member count, board readiness).
//
// Strict simplicity: <=2 CSS animation loops, flat SVG fills, exactly 3 state
// bindings (tier, members, pengurus). No new DB/store/router.
//
// NOTE: UI strings below are hardcoded Indonesian for the v1 campaign and are
// extracted to module constants. They must move to the `campaign.*` i18n
// namespace before the MVP tag (see plan Follow-ups).

import { useCallback, useEffect, useState } from "react";
import { getCurrentLevel, LEVELS } from "@/data/leveling";
import { getTierBand } from "@/data/xp-core";
import { getCoopMemberCount } from "@/hooks/useMembers";
import { onMembersChanged } from "@/lib/memberEvents";
import KopdesBuilding from "./KopdesBuilding";

const SEEN_KEY = "pakde-campaign-seen";

// Hardcoded Indonesian narration for the easy campaign (v1; extracted to i18n later).
const SCRIPT: string[] = [
  "Penatua Desa: Selamat datang, Pengurus. Koperasi ini baru saja berdiri.",
  "Tugasmu sederhana - bawa koperasi ini naik dua tingkat dari sekarang.",
  "Daftarkan warga, catat keuangan, dan biarkan desa ini tumbuh.",
  "Setiap langkahmu akan kuteruskan ke pembukuan. Mari kita mulai.",
];

const LABEL_CAMPAIGN = "Kampanye · Tingkat";
const LABEL_NEXT = "▸ Lanjut";
const LABEL_OVERFLOW = "lainnya";
const LABEL_LEADER = "Pengurus";
const LABEL_RESIDENTS = "Warga:";
const LABEL_OF = "· Tingkat";
const LABEL_DONE = "🎉 kampanye selesai";

const MAX_CROWD = 10;
const TYPE_SPEED_MS = 22;

type SceneMode = "dialogue" | "scene";

interface CampaignStripProps {
  xp?: number;
  /** Whether >=3 active board positions exist (leader appears in scene). */
  pengurusReady?: boolean;
}

export default function CampaignStrip({ xp = 0, pengurusReady = false }: CampaignStripProps) {
  const currentLevel = getCurrentLevel(xp);
  const currentTier = currentLevel.tier;
  const goalTier = Math.min(10, currentTier + 2);
  const band = getTierBand(currentTier);
  const backdropClass = band.en === "Gold" ? "from-yellow-900/40" : "from-slate-900/40";

  const startMinXp = LEVELS[currentTier - 1]?.minXp ?? 0;
  const goalMinXp = LEVELS[goalTier - 1]?.minXp ?? startMinXp + 1;
  const progress = Math.max(0, Math.min(1, (xp - startMinXp) / Math.max(1, goalMinXp - startMinXp)));

  const [mode, setMode] = useState<SceneMode>(() =>
    typeof localStorage !== "undefined" && localStorage.getItem(SEEN_KEY) === "1" ? "scene" : "dialogue",
  );
  const [lineIdx, setLineIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [memberCount, setMemberCount] = useState(0);

  const fullLine = SCRIPT[lineIdx] ?? "";

  // Typewriter effect for the current dialogue line. The reset to "" happens
  // implicitly via the first interval tick, avoiding synchronous setState in
  // the effect body.
  useEffect(() => {
    if (mode !== "dialogue") return;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShown(fullLine.slice(0, i));
      if (i >= fullLine.length) clearInterval(timer);
    }, TYPE_SPEED_MS);
    return () => clearInterval(timer);
  }, [mode, lineIdx, fullLine]);

  const advance = useCallback(() => {
    if (lineIdx < SCRIPT.length - 1) {
      setLineIdx((n) => n + 1);
    } else {
      localStorage.setItem(SEEN_KEY, "1");
      setMode("scene");
    }
  }, [lineIdx]);

  // Skip the typewriter and reveal the full line immediately on click.
  const onBoxClick = useCallback(() => {
    if (shown.length < fullLine.length) {
      setShown(fullLine);
    } else {
      advance();
    }
  }, [shown, fullLine, advance]);

  // Live member count for the crowd, refreshed on member-list changes.
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

  return (
    <div className="w-full pb-4">
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-linear-to-b ${backdropClass} to-card`}
      >
        {/* Region 1 — tier track */}
        <div className="flex flex-col gap-2 px-5 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xxxs font-mono uppercase tracking-widest text-muted-foreground">
              {LABEL_CAMPAIGN} {currentTier} → {goalTier}
            </span>
            <span className={`text-xxxs font-mono px-1.5 py-0.5 rounded border ${band.cls}`}>{band.id}</span>
          </div>
          <div className="relative h-2 rounded-full bg-secondary">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xxxs font-mono text-muted-foreground">
            <span>XP {xp}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>

        {/* Region 2 — RPG box (dialogue or scene) */}
        <div className="px-5 py-4">
          {mode === "dialogue" ? (
            <div className="flex flex-col gap-3">
              <div
                onClick={onBoxClick}
                className="min-h-[3.5rem] cursor-pointer rounded-xl border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-foreground"
              >
                {shown}
                {shown.length < fullLine.length && <span className="ml-0.5 animate-pulse">▌</span>}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={advance}
                  disabled={shown.length < fullLine.length}
                  className="rounded-lg bg-brand px-3 py-1 text-xxxs font-bold text-brand-foreground transition-opacity disabled:opacity-40"
                >
                  {LABEL_NEXT}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-4">
              <KopdesBuilding tier={currentTier} goalTier={goalTier} className="h-28 w-44 shrink-0 drop-shadow" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-end gap-1 text-lg leading-none">
                  {Array.from({ length: crowd }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block animate-bounce"
                      style={{ animationDelay: `${(i % 5) * 120}ms`, animationDuration: "2.4s" }}
                    >
                      🧑
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="text-xxs text-muted-foreground">
                      +{overflow} {LABEL_OVERFLOW}
                    </span>
                  )}
                  {pengurusReady && (
                    <span className="text-xl" title={LABEL_LEADER}>
                      👑
                    </span>
                  )}
                </div>
                <div className="text-xxxs font-mono text-muted-foreground">
                  {LABEL_RESIDENTS} {memberCount} {LABEL_OF} {currentTier}/{goalTier}
                  {currentTier >= goalTier && <span className="ml-2 text-success">{LABEL_DONE}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
