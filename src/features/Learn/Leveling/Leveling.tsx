import "./Leveling.css";
import { useTranslation } from "react-i18next";
import { LEVELS, getLevelProgress, getCurrentLevel, type LevelDef } from "@/data/leveling";
import { getActiveCoopId } from "@/db/active-coop";
import { getTierBand, XP_SOURCES } from "@/data/xp-core";
import XpFeed from "./XpFeed";
import { TrophyIcon, StarIcon, LockIcon } from "@phosphor-icons/react";

interface Props {
  xp?: number;
}

/** The real, wired XP sources — rendered so the menu can never lie about
 *  what raises XP. Derived from `XP_SOURCES` (the single source of truth). */
const XP_ACTIONS = Object.values(XP_SOURCES).map((s) => ({ xp: s.xp, labelEn: s.labelEn, labelId: s.labelId }));

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

        {/* Always-visible XP actions */}
        <div className="banner__actions">
          <div className="flex items-center gap-1.5 mb-1.5">
            <StarIcon className="h-3 w-3 text-white" />
            <span className="text-xxxs font-mono font-bold uppercase tracking-wider text-white/80">
              {t("leveling.earnXp")}
            </span>
          </div>
          <ul className="space-y-1">
            {XP_ACTIONS.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xxs text-white/85">
                <span className="font-mono font-bold shrink-0 text-white">+{a.xp}</span>
                <span className="leading-tight">{isId ? a.labelId : a.labelEn}</span>
              </li>
            ))}
          </ul>
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
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <TrophyIcon className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{isId ? "Leveling Koperasi" : "Cooperative Leveling"}</h1>
          <span className={`text-xxxs font-mono font-bold px-2 py-0.5 rounded-full border ${band.cls}`}>
            {isId ? band.id : band.en}
          </span>
          <p className="text-xxs text-muted-foreground">
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
      <div className="-mx-6 px-6 pt-6 pb-4 flex gap-4 overflow-x-auto snap-x snap-mandatory">
        {LEVELS.map((level: LevelDef) => (
          <LevelCard key={level.id} level={level} lang={i18n.language} t={t} xp={xp} />
        ))}
      </div>

      {/* XP event ledger (Phase 2) */}
      <XpFeed coopId={getActiveCoopId()} refreshKey={xp} />
    </div>
  );
}
