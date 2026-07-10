// ── Gamification: XP event ledger (persistence) ───────────────
//
// XP is the single source of truth for a cooperative's level
// (`getCurrentLevel(xp)` in `leveling.ts`). This module makes XP
// *acquisition* event-sourced and auditable (R1/R3/R4):
//
//   member add ──► awardXp() ──► append xp_events row
//                                └──► keep registry `cooperatives.xp` in sync
//
// `cooperatives.xp` stays the cached total the UI already reads; it is
// always equal to `SUM(xp_events.delta)`, which makes churn/de-level
// correct by construction (Phase 3) and the ledger replayable.

import { getCoopDb } from "@/db/coopDb";
import { getRegistryDb } from "@/db/registry";
import { newId } from "@/db/repository";
import { XP_SOURCES } from "./xp-core";

/** Internal action recorded when a co-op's pre-ledger XP is reconciled. */
const BASELINE_ACTION = "xp_baseline";

// ── Phase 4 abuse-guard flags (R4) ─────────────────────
// Kept as data, default OFF so normal behaviour is unchanged. Flip
// `REQUIRE_VERIFICATION` to `true` (or set a positive `DAILY_XP_CAP`)
// to exercise the gates; UI surfaces the rejection via a toast.
export const REQUIRE_VERIFICATION = false;
/** Per-coop daily XP cap. `0` = disabled. */
export const DAILY_XP_CAP = 0;

export interface XpEvent {
  id: string;
  action: string;
  delta: number;
  totalAfter: number;
  meta: string | null;
  createdAt: string;
}

/**
 * Award XP for an in-app action. Appends an immutable `xp_events` row,
 * keeps `cooperatives.xp` equal to the running total, and returns the new
 * total.
 *
 * On first award for a co-op (empty ledger) a `xp_baseline` reconciliation
 * event is written from the co-op's existing registry XP, so the ledger is
 * continuous for co-ops created before the ledger existed (e.g. demo seed).
 */
/**
 * Append an immutable `xp_events` row and keep `cooperatives.xp` equal to
 * the running total. Reconciles a one-off `xp_baseline` event from the
 * co-op's existing registry XP the first time the ledger is written (for
 * co-ops created before the ledger existed).
 */
async function appendXp(coopId: string, action: string, delta: number, meta?: object): Promise<number> {
  const coopDb = await getCoopDb(coopId);

  const rows = await coopDb.select<Array<{ total: number }>>("SELECT COALESCE(SUM(delta), 0) AS total FROM xp_events;");
  let currentTotal = rows[0]?.total ?? 0;

  // Reconcile a pre-ledger co-op: seed one baseline event from registry XP.
  // Gate on the ledger being *truly empty* (zero rows), NOT on the sum
  // netting to 0 — otherwise an external registry.xp write (re-seed, a
  // future Settings edit) combined with a net-zero ledger would inject a
  // phantom baseline and desync the total (review #2).
  const countRows = await coopDb.select<Array<{ c: number }>>("SELECT COUNT(*) AS c FROM xp_events;");
  if ((countRows[0]?.c ?? 0) === 0) {
    const reg = await getRegistryDb();
    const existing = await reg.select<Array<{ xp: number }>>("SELECT xp FROM cooperatives WHERE id = ?;", [coopId]);
    const baseline = existing[0]?.xp ?? 0;
    if (baseline !== 0) {
      await coopDb.execute(
        "INSERT INTO xp_events (id, action, delta, total_after, meta, created_at) VALUES (?, ?, ?, ?, ?, ?);",
        [newId("xp"), BASELINE_ACTION, baseline, baseline, null, new Date().toISOString()],
      );
      currentTotal = baseline;
    }
  }

  const totalAfter = currentTotal + delta;
  await coopDb.execute(
    "INSERT INTO xp_events (id, action, delta, total_after, meta, created_at) VALUES (?, ?, ?, ?, ?, ?);",
    [newId("xp"), action, delta, totalAfter, meta ? JSON.stringify(meta) : null, new Date().toISOString()],
  );

  const reg = await getRegistryDb();
  await reg.execute("UPDATE cooperatives SET xp = ? WHERE id = ?;", [totalAfter, coopId]);

  return totalAfter;
}

/**
 * Award XP for an in-app action. On first award for a co-op (empty ledger)
 * a `xp_baseline` reconciliation event is written from the co-op's
 * existing registry XP, so the ledger is continuous for co-ops created
 * before the ledger existed (e.g. demo seed).
 *
 * Enforces the Phase-4 abuse guards (R4): when `REQUIRE_VERIFICATION`
 * is on, no XP is granted; when `DAILY_XP_CAP` is set, the cap is
 * checked against today's positive deltas. Both are OFF by default (data
 * flags, not blocking) — flip them to exercise the gates.
 */
export async function awardXp(coopId: string, action: string, meta?: object): Promise<number> {
  if (REQUIRE_VERIFICATION) throw new Error("xp.verificationRequired");
  if (DAILY_XP_CAP > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const day = await getCoopDb(coopId).then((db) =>
      db.select<Array<{ total: number }>>(
        "SELECT COALESCE(SUM(delta), 0) AS total FROM xp_events WHERE date(created_at) = ? AND delta > 0;",
        [today],
      ),
    );
    const source = XP_SOURCES[action];
    const delta = source?.xp ?? 0;
    if ((day[0]?.total ?? 0) + delta > DAILY_XP_CAP) throw new Error("xp.dailyCapReached");
  }

  const source = XP_SOURCES[action];
  if (!source) throw new Error(`Unknown XP action: ${action}`);
  return appendXp(coopId, action, source.xp, meta);
}

/**
 * Revert XP when a reversible subject leaves (R3). `member_joined` is
 * `reversible`, so removing a member emits a negative event; the level
 * recomputes from the new total (supports multi-level de-level).
 *
 * Guard (review #1): only revert XP that was actually awarded for this
 * member. Pre-ledger (demo-seeded) members never got a `member_joined`
 * event, so removing one must NOT subtract XP that was never granted —
 * otherwise the co-op de-levels incorrectly and the ledger desyncs.
 */
export async function removeMemberXp(coopId: string, memberId: string): Promise<number | null> {
  const source = XP_SOURCES["member_joined"];
  if (!source?.reversible) return null;
  const events = await getXpEvents(coopId);
  const wasAwarded = events.some(
    (e) => e.action === "member_joined" && e.meta && JSON.parse(e.meta).memberId === memberId,
  );
  if (!wasAwarded) return null;
  return appendXp(coopId, "member_removed", -source.xp, { memberId });
}

/** Read the full, chronological XP event ledger for a co-op (R4). */
export async function getXpEvents(coopId: string): Promise<XpEvent[]> {
  const coopDb = await getCoopDb(coopId);
  return coopDb.select<XpEvent[]>(
    "SELECT id, action, delta, total_after AS totalAfter, meta, created_at AS createdAt FROM xp_events ORDER BY created_at ASC, id ASC;",
  );
}
