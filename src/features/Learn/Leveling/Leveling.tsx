import "./Leveling.css";
import { useTranslation } from "react-i18next";
import { LEVELS, getLevelProgress, getCurrentLevel, type LevelDef } from "@/data/leveling";
import { getActiveCoopId } from "@/db/active-coop";
import { getTierBand } from "@/data/xp-core";
import { getErlForTier, ERL_FRAMEWORKS, ERL_INTRO, ERL_CONVERGENCE } from "@/data/readiness";
import XpFeed from "./XpFeed";
import { TrophyIcon, LockIcon } from "@phosphor-icons/react";

interface Props {
  xp?: number;
}

/** Static framework abbreviations for the ERL panel (same in en/id). */
const ERL_BADGE = { erl: "ERL", irl: "IRL", trlMrl: "TRL·MRL", cmm: "CMM" } as const;

function LevelCard({
  level,
  lang,
  t,
  xp,
}: {
  level: LevelDef;
  lang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  xp: number;
}) {
  const Icon = TrophyIcon;
  const isId = lang.startsWith("id");
  const label = isId ? level.labelId : level.labelEn;
  const desc = isId ? level.descId : level.descEn;
  const { xp: earned, maxXp, percent } = getLevelProgress(level, xp);
  const isUnlocked = xp >= level.minXp;
  const currentLevel = getCurrentLevel(xp);
  const isCurrent = currentLevel.id === level.id;

  return (
    <div
      className={`banner w-44 shrink-0 snap-start ${isCurrent ? "banner--current" : ""} ${!isUnlocked ? "banner--locked" : ""}`}
      style={
        {
          ["--banner"]: level.color,
          ["--banner-outline"]: isUnlocked ? "#d4af37" : "#374151",
        } as React.CSSProperties
      }
    >
      {/* Color fill — sits 3px inside the gold outline */}
      <div className="banner__field" />

      {/* Large, faint downward-chevron watermark spanning the banner */}
      <div className="banner__chevron" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="banner__chevron-svg">
          <path d="M0 4 L50 34 L100 4" />
          <path d="M0 54 L50 84 L100 54" />
        </svg>
      </div>

      {/* Top finial — the ring the banner hangs from */}
      <div className="banner__finial">
        <span className="banner__finial-ring" />
        <span className="banner__finial-rod" />
      </div>

      {/* Heraldic cap with the level emblem */}
      <div className="banner__cap">
        <div className="banner__emblem">
          {isUnlocked ? (
            <Icon className="h-6 w-6 text-[var(--banner)]" weight="fill" />
          ) : (
            <LockIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="banner__body">
        <div className="banner__title">
          <span className="banner__tier">{t("leveling.level", { n: level.tier })}</span>
          {isCurrent && <span className="banner__active">{t("leveling.active")}</span>}
        </div>

        <span className="banner__label">{label}</span>

        <p className="banner__desc">{desc}</p>

        {/* XP progress */}
        <div className="banner__progress">
          <div className="flex justify-between text-xxxs font-mono mb-1">
            <span className="text-white/80">
              XP {earned}/{maxXp}
            </span>
            <span className="text-white font-bold">{percent}%</span>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${isUnlocked ? percent : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Leveling({ xp = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const isId = i18n.language.startsWith("id");
  const currentLevel = getCurrentLevel(xp);
  const band = getTierBand(currentLevel.tier);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
          <TrophyIcon className="h-5 w-5 text-warning" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-foreground">{isId ? "Leveling Koperasi" : "Cooperative Leveling"}</h1>
            <span className={`text-xxxs font-mono font-bold px-2 py-0.5 rounded-full border ${band.cls}`}>
              {isId ? band.id : band.en}
            </span>
          </div>
          <p className="text-xxs text-muted-foreground mt-0.5">
            {isId
              ? "Selesaikan quest untuk naik level dan tingkatkan kesehatan koperasi"
              : "Complete quests to level up and improve cooperative health"}
          </p>
        </div>
      </div>

      {/* Level strip = XP progress bar.
          Fixed, palette-independent fill + a scrimmed label pill keep the
          tier text legible in light/dark and across every theme palette. */}
      <div className="bg-card border-border text-foreground rounded-xl border">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <TrophyIcon className="h-4 w-4 text-warning" />
              {isId
                ? `Level ${currentLevel.tier} · ${currentLevel.labelId}`
                : `Level ${currentLevel.tier} · ${currentLevel.labelEn}`}
            </span>
            <span className="text-xxs font-mono text-muted-foreground">XP {xp} / 100</span>
          </div>

          <div className="relative h-7 rounded-full bg-muted overflow-hidden">
            {/* Continuous XP fill */}
            <div
              className="absolute inset-y-0 left-0 bg-linear-to-r from-[#16a34a] to-[#eab308] transition-all duration-500"
              style={{ width: `${Math.min(100, xp)}%` }}
            />
            {/* 10 level dividers — the strip reads as 10 segments */}
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="absolute inset-y-0 w-px bg-background/30" style={{ left: `${(i + 1) * 10}%` }} />
            ))}
            {/* Centered tier label — scrim guarantees contrast over any fill */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rounded-full bg-background/85 px-2 py-0.5 text-xxs font-bold text-foreground backdrop-blur-sm">
                {isId ? currentLevel.labelId : currentLevel.labelEn}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-xxxs font-mono text-muted-foreground">
            <span>{isId ? "Rintisan" : "Pioneer"}</span>
            <span>{isId ? "Teladan" : "Exemplary"}</span>
          </div>
        </div>
      </div>

      {/* Level banners — single horizontal row, scrollable */}
      <div className="leveling-scroll pt-6 pb-6 flex gap-4 overflow-x-scroll snap-x snap-mandatory">
        {LEVELS.map((level: LevelDef) => (
          <LevelCard key={level.id} level={level} lang={i18n.language} t={t} xp={xp} />
        ))}
      </div>

      {/* ERL knowledge base — how each PAKDE tier maps to ERL 1–9 & anchor frameworks */}
      <div className="bg-card border-border text-foreground rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-foreground">
            {isId ? "Tingkat Kesiapan Ekonomi (ERL 1–9)" : "Economic Readiness Level (ERL 1–9)"}
          </span>
        </div>
        <p className="text-xxs text-muted-foreground mb-3">{isId ? ERL_INTRO.id : ERL_INTRO.en}</p>

        {/* Anchor framework legend — what each framework is & why we use it */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {ERL_FRAMEWORKS.map((fw) => (
            <div key={fw.key} className="rounded-lg border border-border p-2.5 flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono font-bold text-warning shrink-0">{fw.abbr}</span>
                <span className="text-xxs font-semibold text-foreground leading-tight">
                  {isId ? fw.fullId : fw.fullEn}
                </span>
              </div>
              <p className="text-xxs text-muted-foreground leading-snug">{isId ? fw.descId : fw.descEn}</p>
              <p className="text-xxs leading-snug border-l-2 border-warning/40 pl-2 text-muted-foreground">
                {isId ? fw.whyId : fw.whyEn}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xxs text-muted-foreground mb-3 italic">{isId ? ERL_CONVERGENCE.id : ERL_CONVERGENCE.en}</p>

        {/* Per-tier mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {LEVELS.map((level: LevelDef) => {
            const erl = getErlForTier(level.tier);
            const label = isId ? level.labelId : level.labelEn;
            return (
              <div
                key={level.id}
                className={`rounded-lg border border-border p-2.5 flex flex-col gap-1 ${
                  getCurrentLevel(xp).id === level.id ? "ring-1 ring-brand/40 bg-brand/5" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xxs font-mono font-bold text-muted-foreground shrink-0">
                      {t("leveling.level", { n: level.tier })}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{label}</span>
                  </div>
                  <span className="text-xxxs font-mono font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning shrink-0">
                    {ERL_BADGE.erl} {erl.level}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xxxs font-mono text-muted-foreground">
                  <span>
                    {ERL_BADGE.irl} <span className="text-foreground font-bold">{erl.irl}</span>
                  </span>
                  <span>
                    {ERL_BADGE.trlMrl} <span className="text-foreground font-bold">{erl.trlMrl}</span>
                  </span>
                  <span>
                    {ERL_BADGE.cmm} <span className="text-foreground font-bold">{erl.cmm}</span>
                  </span>
                </div>
                <p className="text-xxs text-muted-foreground leading-snug">{isId ? erl.descId : erl.descEn}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP event ledger (Phase 2) */}
      <XpFeed coopId={getActiveCoopId()} refreshKey={xp} />
    </div>
  );
}
