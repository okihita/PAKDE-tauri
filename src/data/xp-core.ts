// ── Gamification: pure XP logic (no DB / Tauri deps) ─────────────
//
// Kept dependency-free so it is unit-testable under vitest without the
// Tauri runtime. All persistence lives in `xp.ts`.
//
// v2 (rebuilt from scratch): a single global XP scalar drives the
// cooperative's level (`getCurrentLevel(xp)` in `leveling.ts`). The only
// real, wired source is `member_joined`; additional actions are added as
// rows here, not as code branches.

export interface XpSource {
  /** XP awarded for this action. */
  xp: number;
  labelEn: string;
  labelId: string;
  /** Whether removing the subject (e.g. a member) reverts this XP. */
  reversible: boolean;
}

/**
 * Data-driven XP source table. Adding a new in-app action is a row here,
 * not a code branch. `member_joined` is the only MVP source; the Leveling
 * screen renders this table directly so it always reflects what actually
 * raises XP (no fabricated quest text).
 *
 * The value is scaled to the existing 0–100 level curve
 * (`src/data/leveling-data.ts`, 10 levels × 10 xp): 5 XP per member means
 * ~2 registrations advance one level.
 */
export const XP_SOURCES: Record<string, XpSource> = {
  member_joined: {
    xp: 5,
    labelEn: "Member registers",
    labelId: "Anggota bergabung",
    reversible: true,
  },
};

/** Sum of signed deltas — the authoritative XP total. */
export function computeTotal(events: Array<{ delta: number }>): number {
  return events.reduce((sum, e) => sum + e.delta, 0);
}

// ── Tier bands (overlay) ────────────────────────────────────────
// Maps the existing level `tier` (1–10) onto named milestone bands.
// This is an overlay on `leveling-data.ts` — it does not alter the
// `minXp`/`maxXp` curve. Splits: Bronze 1–3, Silver 4–6, Gold 7–10.
export interface TierBand {
  en: string;
  id: string;
  /** Upper tier (inclusive) this band covers. */
  maxTier: number;
  /** Tailwind classes for the badge pill. */
  cls: string;
}

export const TIER_BANDS: TierBand[] = [
  { en: "Bronze", id: "Perunggu", maxTier: 3, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { en: "Silver", id: "Perak", maxTier: 6, cls: "bg-zinc-400/15 text-zinc-300 border-zinc-400/30" },
  { en: "Gold", id: "Emas", maxTier: 10, cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
];

/** Resolve the tier band for a level tier (1–10). */
export function getTierBand(tier: number): TierBand {
  return TIER_BANDS.find((b) => tier <= b.maxTier) ?? TIER_BANDS[TIER_BANDS.length - 1];
}
