// ── Gamification: Koperasi Leveling System ─────────────────────────
//
// 10 levels × 6 aspects. Each level has quests (subgoals) across aspects.
// Level is derived from the cooperative's stored `xp` (progression), which is
// decoupled from `health_score` (operational EWS health / RAG).

import { LEVELS } from "./leveling-data";
export { LEVELS } from "./leveling-data";

export type LevelId =
  "rintisan" | "pemula" | "bertumbuh" | "produktif" | "mapan" | "tangguh" | "maju" | "inovatif" | "modern" | "teladan";

export interface Quest {
  id: string;
  en: string;
}

export interface AspectQuests {
  aspectId: string;
  icon: string;
  labelEn: string;
  labelId: string;
  quests: Quest[];
}

export interface LevelDef {
  id: LevelId;
  tier: number;
  labelEn: string;
  labelId: string;
  descEn: string;
  descId: string;
  color: string;
  bgClass: string;
  textClass: string;
  /** Minimum xp to unlock this level */
  minXp: number;
  /** Maximum xp for this level (next level min - 1) */
  maxXp: number;
  aspects: AspectQuests[];
}

/** Derive XP progress for a level given the current xp */
export function getLevelProgress(level: LevelDef, xp: number): { xp: number; maxXp: number; percent: number } {
  const earned = Math.max(0, xp - level.minXp);
  const maxXp = level.maxXp - level.minXp;
  const percent = maxXp > 0 ? Math.min(100, Math.round((earned / maxXp) * 100)) : 100;
  return { xp: earned, maxXp, percent };
}

/** Determine which level the cooperative is currently at */
export function getCurrentLevel(xp: number): LevelDef {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

export function getLevelById(id: LevelId): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getLevelByTier(tier: number): LevelDef | undefined {
  return LEVELS.find((l) => l.tier === tier);
}
