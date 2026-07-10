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
export async function awardXp(coopId: string, action: string, meta?: object): Promise<number> {
  const source = XP_SOURCES[action];
  if (!source) throw new Error(`Unknown XP action: ${action}`);
  const delta = source.xp;

  const coopDb = await getCoopDb(coopId);

  const rows = await coopDb.select<Array<{ total: number }>>("SELECT COALESCE(SUM(delta), 0) AS total FROM xp_events;");
  let currentTotal = rows[0]?.total ?? 0;

  // Reconcile a pre-ledger co-op: seed one baseline event from registry XP.
  if (currentTotal === 0) {
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

/** Read the full, chronological XP event ledger for a co-op (R4). */
export async function getXpEvents(coopId: string): Promise<XpEvent[]> {
  const coopDb = await getCoopDb(coopId);
  return coopDb.select<XpEvent[]>(
    "SELECT id, action, delta, total_after AS totalAfter, meta, created_at AS createdAt FROM xp_events ORDER BY created_at ASC, id ASC;",
  );
}
