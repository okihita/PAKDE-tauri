import Database from "@tauri-apps/plugin-sql";
import { resolveResource, appDataDir, join } from "@tauri-apps/api/path";
import { copyFile, exists } from "@tauri-apps/plugin-fs";

let _wilayahDb: Database | null = null;
let _loadPromise: Promise<Database> | null = null;

async function ensureWilayahInAppData(): Promise<void> {
  const appData = await appDataDir();
  const targetPath = await join(appData, "wilayah.sqlite");
  const alreadyExists = await exists(targetPath);
  if (alreadyExists) return;

  try {
    const resourcePath = await resolveResource("resources/wilayah.sqlite");
    await copyFile(resourcePath, targetPath);
  } catch {
    // In dev mode, resolveResource gives a URL. Use a direct path fallback.
    // The file is at src-tauri/resources/wilayah.sqlite relative to project root
    // In dev, cwd is project root; in prod, file is in bundle resources
    const devPath = "src-tauri/resources/wilayah.sqlite";
    try {
      await copyFile(devPath, targetPath);
    } catch {
      console.error("[wilayah] Failed to locate wilayah.sqlite. The region picker will not work.");
    }
  }
}

/** Load the prebuilt wilayah reference database (lazy, cached). */
export async function getWilayahDb(): Promise<Database> {
  if (_wilayahDb) return _wilayahDb;
  if (!_loadPromise) {
    _loadPromise = (async () => {
      await ensureWilayahInAppData();
      const db = await Database.load("sqlite:wilayah.sqlite");
      _wilayahDb = db;
      return db;
    })();
  }
  return _loadPromise;
}

/** Preload during initDb() so the first query is instant. */
export async function initWilayah(): Promise<void> {
  await getWilayahDb();
}
