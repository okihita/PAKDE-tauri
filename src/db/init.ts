// ── Database initialisation ──────────────────────────────────────
//
// Runs once per app launch (App.tsx / ProfileSelect mount). Guarantees the
// registry and every cooperative's data file exist, without destroying data.
//
// On first launch after this refactor, any legacy shared `kdkmp.db` is backed
// up (timestamped) and removed — fresh start, no data splitter. Each
// cooperative thereafter owns its own `coops/<id>.db` file.

import { appDataDir, join } from "@tauri-apps/api/path";
import { copyFile, exists, remove } from "@tauri-apps/plugin-fs";
import { getRegistryDb, initRegistryDb } from "./registry";
import { initCoopDb, getCoopDb } from "./coopDb";
import { initWilayah } from "./wilayah-init";

let dbInitPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    // ── 1. Retire legacy shared database (fresh start) ──
    const dataDir = await appDataDir();
    const legacyPath = await join(dataDir, "kdkmp.db");
    if (await exists(legacyPath)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = await join(dataDir, `kdkmp.legacy.${stamp}.db`);
      try {
        await copyFile(legacyPath, backupPath);
      } catch {
        // Non-fatal: proceed even if the backup copy fails.
      }
      await remove(legacyPath);
    }

    // ── 2. Registry (cooperatives metadata) ──
    await initRegistryDb();

    // ── 3. Ensure every cooperative has its own data file ──
    const regDb = await getRegistryDb();
    const coops = await regDb.select<Array<{ id: string }>>("SELECT id FROM cooperatives");
    for (const coop of coops) {
      await initCoopDb(coop.id);

      // Safety-net backfill (mirrors legacy behaviour): a coop with no
      // local_users gets a default admin (Slamet Riyadi / PIN 123456). The
      // demo coop seeds its own admin, so it is never double-created.
      const cdb = await getCoopDb(coop.id);
      const users = await cdb.select<Array<{ id: string }>>("SELECT id FROM local_users LIMIT 1");
      if (users.length === 0) {
        const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const defaultPinHash = "8d969ee56701d853af7b830aef854b3c7b288d60c9329ee3073a56657a8c462a"; // SHA-256 "123456"
        await cdb.execute(`INSERT INTO local_users (id, name, role, pin_hash) VALUES (?, ?, ?, ?)`, [
          userId,
          "Slamet Riyadi",
          "admin",
          defaultPinHash,
        ]);
      }
    }

    // ── 4. Reference data (Indonesian regions lookup) ──
    await initWilayah();
  })();

  try {
    await dbInitPromise;
  } catch (err) {
    dbInitPromise = null;
    throw err;
  }
  return dbInitPromise;
}
