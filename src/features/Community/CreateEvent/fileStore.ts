// ── Event file storage (proposal / LPJ) ────────────────────────────────
//
// Tauri offline app → store uploaded files on disk, not the DB. Files live in
// `<appDataDir>/<coop_id>/events/<event_id>/<filename>`; only the relative
// path + metadata are persisted in the `events` row (see eventsDb.ts).

import { appDataDir, join } from "@tauri-apps/api/path";
import { writeFile, mkdir, exists, remove } from "@tauri-apps/plugin-fs";
import type { EventFileMeta } from "./eventsDb";

function relativePath(coopId: string, eventId: string, fileName: string): string {
  return `${coopId}/events/${eventId}/${fileName}`;
}

/** Persist an uploaded file to disk and return its stored metadata. */
export async function storeEventFile(coopId: string, eventId: string, file: File): Promise<EventFileMeta> {
  const dir = await join(await appDataDir(), coopId, "events", eventId);
  await mkdir(dir, { recursive: true });
  const buffer = new Uint8Array(await file.arrayBuffer());
  await writeFile(await join(dir, file.name), buffer);
  return {
    path: relativePath(coopId, eventId, file.name),
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
  };
}

/** Remove an event's folder (proposal + LPJ) from disk. No-op if absent. */
export async function deleteEventFiles(coopId: string, eventId: string): Promise<void> {
  const dir = await join(await appDataDir(), coopId, "events", eventId);
  if (await exists(dir)) {
    await remove(dir, { recursive: true });
  }
}

/** Absolute on-disk path for a stored relative path. */
export async function absoluteEventFilePath(relative: string): Promise<string> {
  return join(await appDataDir(), relative);
}
