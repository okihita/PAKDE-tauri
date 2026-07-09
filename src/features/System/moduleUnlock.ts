// ── Module gating: which tabs unlock at which health score ──

/**
 * Minimum health score required for each tab to be navigable.
 * Tabs not listed here are always unlocked (e.g., "home", "settings").
 */
export const TABS_LEVEL_REQUIREMENTS = {
  home: 0,
  members: 0,
  units: 0,
  sales: 10,
  accounting: 10,
  participation: 20,
  equipment: 20,
  statistics: 30,
  storelayout: 30,
  feasibility: 40,
  event: 50,
  impact: 50,
  leveling: 60,
  ranking: 60,
  development: 70,
  learn: 80,
  planners: 80,
} satisfies Record<string, number>;

/** Canonical set of every navigable tab id in the app. */
export type TabId = keyof typeof TABS_LEVEL_REQUIREMENTS | "sync" | "settings";

/**
 * Check whether a tab is unlocked at a given progression xp.
 */
export function isTabUnlocked(tab: TabId, score: number): boolean {
  const requiredScore = (TABS_LEVEL_REQUIREMENTS as Record<string, number>)[tab];
  if (requiredScore === undefined) return true;
  return score >= requiredScore;
}

/**
 * Human-readable label for the level at which a tab unlocks.
 */
export function getUnlockRequirementLabel(tab: TabId): string | null {
  const requiredScore = (TABS_LEVEL_REQUIREMENTS as Record<string, number>)[tab];
  if (requiredScore === undefined || requiredScore === 0) return null;
  return `Membutuhkan XP ≥ ${requiredScore}`;
}
