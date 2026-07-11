// ── Gamification: XP event ledger (persistence) ───────────────
//
// v2 (rebuilt from scratch). XP is the single source of truth for a
// cooperative's level (`getCurrentLevel(xp)` in `leveling.ts`). This
// module makes XP *acquisition* event-sourced and auditable:
//
//   member add ──► awardXp() ──► append xp_events row
//                                └──► keep registry `cooperatives.xp` in sync
//
// `cooperatives.xp` stays the cached total the UI already reads; it is
// always equal to `SUM(xp_events.delta)`, which makes the ledger
// replayable and the level reconstructable from events.

import { getCoopDb } from "@/db/coopDb";
import { getRegistryDb } from "@/db/registry";
import { newId } from "@/db/repository";
import { XP_SOURCES } from "./xp-core";

/** Internal action recorded when a co-op's pre-ledger XP is reconciled. */
const BASELINE_ACTION = "xp_baseline";

export interface XpEvent {
  id: string;
  action: string;
  delta: number;
  totalAfter: number;
  meta: string | null;
  createdAt: string;
}

/**
 * Append an immutable `xp_events` row and keep `cooperatives.xp` equal to
 * the running total.
 *
 * On the first write for a co-op (truly empty ledger), a `xp_baseline`
 * reconciliation event is written from the co-op's existing registry XP.
 * This keeps the feed honest for co-ops created before the ledger existed
 * (e.g. demo seed at xp 12/45/82) — the starting balance shows as one
 * baseline row rather than a phantom gap.
 */
async function appendXp(coopId: string, action: string, delta: number, meta?: object): Promise<number> {
  const coopDb = await getCoopDb(coopId);

  // Gate the baseline on the ledger being *truly empty* (zero rows), NOT on
  // the sum netting to 0 — otherwise an external registry.xp write combined
  // with a net-zero ledger would inject a phantom baseline and desync.
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
    }
  }

  const rows = await coopDb.select<Array<{ total: number }>>("SELECT COALESCE(SUM(delta), 0) AS total FROM xp_events;");
  const currentTotal = rows[0]?.total ?? 0;
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
 * Award XP for an in-app action. Looks up the action in `XP_SOURCES`
 * (throws on unknown action) and appends the event, keeping
 * `cooperatives.xp` in sync. Returns the new total.
 */
export async function awardXp(coopId: string, action: string, meta?: object): Promise<number> {
  const source = XP_SOURCES[action];
  if (!source) throw new Error(`Unknown XP action: ${action}`);
  return appendXp(coopId, action, source.xp, meta);
}

/**
 * Revert XP when a reversible subject leaves. `member_joined` is
 * `reversible`, so removing a member emits a negative event; the level
 * recomputes from the new total (supports multi-level de-level).
 *
 * Guard: only revert XP that was actually awarded for this member.
 * Pre-ledger (demo-seeded) members never got a `member_joined` event, so
 * removing one must NOT subtract XP that was never granted.
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

/** Read the full, chronological XP event ledger for a co-op. */
export async function getXpEvents(coopId: string): Promise<XpEvent[]> {
  const coopDb = await getCoopDb(coopId);
  return coopDb.select<XpEvent[]>(
    "SELECT id, action, delta, total_after AS totalAfter, meta, created_at AS createdAt FROM xp_events ORDER BY created_at ASC, id ASC;",
  );
}
