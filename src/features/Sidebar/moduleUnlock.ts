// ── Module gating: which tabs unlock at which health score ──

/**
 * Minimum health score required for each tab to be navigable.
 * Tabs not listed here are always unlocked (e.g., "home", "settings").
 */
export const TABS_LEVEL_REQUIREMENTS: Record<string, number> = {
  home: 0,
  members: 0,
  units: 0,
  settings: 0,
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
  sync: 70,
  learn: 80,
  planners: 80,
};

/**
 * Check whether a tab is unlocked at a given health score.
 */
export function isTabUnlocked(tab: string, healthScore: number): boolean {
  const requiredScore = TABS_LEVEL_REQUIREMENTS[tab];
  if (requiredScore === undefined) return true;
  return healthScore >= requiredScore;
}

/**
 * Human-readable label for the level at which a tab unlocks.
 */
export function getUnlockRequirementLabel(tab: string): string | null {
  const requiredScore = TABS_LEVEL_REQUIREMENTS[tab];
  if (requiredScore === undefined || requiredScore === 0) return null;
  return `Membutuhkan Health Score ≥ ${requiredScore}`;
}
