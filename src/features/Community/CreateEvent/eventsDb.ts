// ── Kegiatan (community events) data access ─────────────────────────────
//
// Coop-scoped event archive backed by the SQL `events` table. Replaces the
// old `localStorage` "pakde-events" array, so events now survive profile
// switching and live alongside every other entity.

import { getCoopDb } from "@/db";
import { getActiveCoopId } from "@/db/active-coop";

export type EventType = "member_meeting" | "arisan" | "social" | "training" | "other";

export interface EventFileMeta {
  /** Relative path (coop-relative), e.g. "coop_id/events/evt-…/file.pdf". */
  path: string;
  name: string;
  mime: string;
  size: number;
}

export interface Kegiatan {
  id: string;
  coop_id: string;
  type: EventType;
  title: string;
  date: string;
  location: string;
  duration_min: number | null;
  participant_ids: string[];
  proposal: EventFileMeta | null;
  report: EventFileMeta | null;
  social_links: string[];
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface NewEventInput {
  type: EventType;
  title: string;
  date: string;
  location: string;
  duration_min: number | null;
  participant_ids: string[];
  proposal: EventFileMeta | null;
  report: EventFileMeta | null;
  social_links: string[];
  description: string;
  notes: string;
}

interface EventRow {
  id: string;
  type: EventType;
  title: string;
  date: string;
  location: string | null;
  duration_min: number | null;
  participant_ids: string | null;
  proposal_path: string | null;
  proposal_name: string | null;
  proposal_mime: string | null;
  proposal_size: number | null;
  report_path: string | null;
  report_name: string | null;
  report_mime: string | null;
  report_size: number | null;
  social_links: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToKegiatan(r: EventRow, coopId: string): Kegiatan {
  return {
    id: r.id,
    coop_id: coopId,
    type: r.type,
    title: r.title,
    date: r.date,
    location: r.location ?? "",
    duration_min: r.duration_min,
    participant_ids: r.participant_ids ? JSON.parse(r.participant_ids) : [],
    proposal:
      r.proposal_path && r.proposal_name
        ? { path: r.proposal_path, name: r.proposal_name, mime: r.proposal_mime ?? "", size: r.proposal_size ?? 0 }
        : null,
    report:
      r.report_path && r.report_name
        ? { path: r.report_path, name: r.report_name, mime: r.report_mime ?? "", size: r.report_size ?? 0 }
        : null,
    social_links: r.social_links ? JSON.parse(r.social_links) : [],
    description: r.description ?? "",
    notes: r.notes ?? "",
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function listEvents(coopId: string = getActiveCoopId()): Promise<Kegiatan[]> {
  const db = await getCoopDb(coopId);
  const rows = await db.select<EventRow[]>("SELECT * FROM events ORDER BY date DESC, created_at DESC");
  return rows.map((r) => rowToKegiatan(r, coopId));
}

export async function createEvent(
  coopId: string,
  data: NewEventInput,
  id: string = `evt-${crypto.randomUUID()}`,
): Promise<Kegiatan> {
  const db = await getCoopDb(coopId);
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO events (
       id, type, title, date, location, duration_min,
       participant_ids, proposal_path, proposal_name, proposal_mime, proposal_size,
       report_path, report_name, report_mime, report_size, social_links, description, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.type,
      data.title,
      data.date,
      data.location,
      data.duration_min,
      JSON.stringify(data.participant_ids),
      data.proposal?.path ?? null,
      data.proposal?.name ?? null,
      data.proposal?.mime ?? null,
      data.proposal?.size ?? null,
      data.report?.path ?? null,
      data.report?.name ?? null,
      data.report?.mime ?? null,
      data.report?.size ?? null,
      JSON.stringify(data.social_links),
      data.description,
      data.notes,
      now,
      now,
    ],
  );
  const rows = await db.select<EventRow[]>("SELECT * FROM events WHERE id = ?", [id]);
  return rowToKegiatan(rows[0], coopId);
}

export async function deleteEvent(coopId: string, id: string): Promise<void> {
  const db = await getCoopDb(coopId);
  await db.execute("DELETE FROM events WHERE id = ?", [id]);
}

/**
 * One-time migration of legacy `localStorage` "pakde-events" into the SQL
 * table, scoped to the currently active cooperative. Idempotent: the source
 * key is cleared on success, so a second call is a no-op.
 *
 * @returns true if any legacy events were migrated.
 */
export async function migrateLocalStorageEvents(coopId: string): Promise<boolean> {
  const raw = localStorage.getItem("pakde-events");
  if (!raw) return false;
  try {
    const legacy = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      date: string;
      time: string;
      location: string;
      description: string;
      createdAt: string;
    }>;
    const db = await getCoopDb(coopId);
    const now = new Date().toISOString();
    for (const e of legacy) {
      await db.execute(
        `INSERT OR IGNORE INTO events (
           id, type, title, date, location, duration_min, participant_ids,
           social_links, description, notes, created_at, updated_at
         ) VALUES (?, 'other', ?, ?, ?, NULL, '[]', '[]', ?, ?, ?, ?)`,
        [e.id, e.name, e.date, e.location ?? "", e.description ?? "", "", now, now],
      );
    }
  } catch (err) {
    console.error("[events] migration failed, leaving localStorage intact:", err);
    return false;
  }
  localStorage.removeItem("pakde-events");
  return true;
}
