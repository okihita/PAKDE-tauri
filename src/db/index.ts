// ── Database entry points ──────────────────────────────────────
//
// Two logical databases:
//   • registry.db  — `cooperatives` metadata (cross-coop). See registry.ts.
//   • coops/<id>.db — one file per cooperative (operational data). See coopDb.ts.
//
// `getDb()` returns the ACTIVE cooperative's DB for backward compatibility with
// feature hooks, which only ever run inside an active-coop context. Functions
// that target a specific cooperative must call `getCoopDb(coopId)` directly.

export { initDb } from "./init";
export { getRegistryDb, initRegistryDb, REGISTRY_SCHEMA_VERSION } from "./registry";
export { getCoopDb, initCoopDb, getDb, coopDbPath, invalidateCoopDb } from "./coopDb";
