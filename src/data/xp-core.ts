// ── Gamification: pure XP logic (no DB / Tauri deps) ─────────────
//
// Kept dependency-free so it is unit-testable under vitest without the
// Tauri runtime. All persistence lives in `xp.ts`.

export interface XpSource {
  /** XP awarded for this action. */
  xp: number;
  labelEn: string;
  labelId: string;
  /** Whether removing the subject (e.g. a member) reverts this XP. */
  reversible: boolean;
}

/**
 * Data-driven XP source table (R2). Adding a new in-app action is a row
 * here, not a code branch. `member_joined` is the only MVP source; future
 * actions are data.
 *
 * The value is scaled to the existing 0–100 level curve
 * (`src/data/leveling-data.ts`, 10 levels × 10 xp). See `gamification-proposal.md` §6.
 */
export const XP_SOURCES: Record<string, XpSource> = {
  member_joined: {
    xp: 5,
    labelEn: "Member registers",
    labelId: "Anggota bergabung",
    reversible: true,
  },
};

/** Sum of signed deltas — the authoritative XP total (R1/R4). */
export function computeTotal(events: Array<{ delta: number }>): number {
  return events.reduce((sum, e) => sum + e.delta, 0);
}
