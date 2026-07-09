# Plan: True per-cooperative DB isolation + removal of `kdp-001`

## Goal
Replace the single shared `kdkmp.db` (discriminator-column multi-tenancy) with **one SQLite file per cooperative**, so cross-coop data leakage is structurally impossible and `kdp-001` disappears entirely.

Decisions (confirmed with user):
- **Fresh start** — existing `kdkmp.db` is backed up then removed on next launch (no legacy splitter).
- **Registry** — current `kdkmp.db` becomes `registry.db`, holding only the `cooperatives` table (+ `_schema_meta`).

## Design

### Two databases
1. **`registry.db`** — `cooperatives` (metadata, `is_demo` flag) + `_schema_meta`. One row per coop. No `cooperative_id` column needed (it *is* the registry).
2. **`coops/<coopId>.db`** — all operational data for one coop. **No `cooperative_id` / `coop_id` column anywhere** (tenant is implied by the file). Demo coop = `coops/<DEMO_COOP_UUID>.db`.

### Access API (`src/db/`)
- `getRegistryDb()` → memoized `sqlite:registry.db` (PRAGMA foreign_keys).
- `getCoopDb(coopId?)` → memoized map `coopId → sqlite:coops/<id>.db`. Defaults to `getActiveCoopId()` when omitted.
- `getDb()` stays for **backward compatibility** = `getCoopDb()` (active coop). Used by all feature hooks (they only ever run in an active-coop context).
- `initRegistryDb()` — create `cooperatives` + `_schema_meta`; bump `SCHEMA_VERSION`.
- `initCoopDb(coopId, { seedDefaultAdmin = true })` — ensure `coops/` dir exists; create all operational tables (no `cooperative_id`); optional default-admin backfill (`Slamet Riyadi` / pin `123456`) when `local_users` empty and `seedDefaultAdmin`.
- `initDb()` — backup+remove legacy `kdkmp.db`; `initRegistryDb()`; for each coop in registry `initCoopDb(id)`; `initWilayah()`.

### Schema deltas (per-coop file)
- Drop `cooperative_id` from: `members`, `local_users`, `coa_accounts`, `journal_entries`, `journal_lines`, `financial_analyses`, `sensitivity_analyses`, `ews_alerts`, `ews_metrics`, `sync_history`, `sync_audit`, `categories`, `store_layouts`, `layout_zones`, `inventory_items`, `sales_transactions`, `sales_transaction_items`, `events`.
- Composite PKs collapse to single column: `coa_accounts PK(code)`, `categories PK(id)`, `inventory_items PK(id)`.
- FKs repoint to single-column parents: `journal_lines→coa_accounts(code)`, `inventory_items→categories(id)`, `sales_transactions→categories(id)`, `sales_transaction_items→inventory_items(id)`.
- Remove all `DEFAULT 'kdp-001'` (init.ts + useStoreLayout).
- `members.nik` remains `UNIQUE` (now per-coop, correct).

### `cooperatives` cross-boundary rule
Any query on the `cooperatives` table MUST use `getRegistryDb()`, never `getDb()`. Affected: `cooperativeDb.ts`, `userDb` (no—local_users is per-coop), `settingsDb.ts`, `seed-demo.ts`, `useUnits.ts` (3 queries).

### Files to change (enumerated)
**New:**
- `src/db/registry.ts` — registry db + `initRegistryDb`.
- `src/db/coopDb.ts` — `getCoopDb`, `initCoopDb` (operational schema), dir ensure.

**Rewritten:**
- `src/db/index.ts` — re-export; `getDb()=getCoopDb()`.
- `src/db/init.ts` — legacy wipe + registry + per-coop loop + wilayah (no more monolithic schema; no `local_users` backfill here).

**Data-access modules:**
- `cooperativeDb.ts` — all `cooperatives` queries → `getRegistryDb`; `createCooperative` calls `initCoopDb(newId)`; `getMemberCount`/`getActiveEwsAlerts` → `getCoopDb(id)`, drop `cooperative_id`.
- `userDb.ts` — `getCoopDb(cooperativeId)`; drop `cooperative_id`.
- `settingsDb.ts` — `getRegistryDb` for coop row; `deleteCooperative` removes `coops/<id>.db` via plugin-fs + deletes registry row (no per-table DELETE).
- `seed-demo.ts` — `cooperatives` → `getRegistryDb`; `initCoopDb(DEMO_COOP_UUID,{seedDefaultAdmin:false})`; drop `cooperative_id` everywhere; `clearDemoCooperative` deletes coop file + registry row.
- `eventsDb.ts` — `getCoopDb(coopId)`; drop `coop_id` column (keep `coop_id` passthrough in `Kegiatan` from param).
- `seed-members.ts` — `getCoopDb(DEMO_COOP_UUID)`; drop `cooperative_id`.

**Hooks (drop `cooperative_id`/`coop_id` from every SQL; `cooperatives` reads in `useUnits` → `getRegistryDb`):**
- `useMembers.ts`, `useSales.ts`, `useUnits.ts`, `useStoreLayout.ts`, `useSync.ts`, `useAccounting.ts`, `useEventForm.ts`.

**Types (`src/types/index.ts`):** remove `cooperative_id` from `LocalUser`, `EwsAlert`, `SyncHistoryItem`, `JournalEntryRow`, `StoreLayout`, `SalesTransaction`.

**Reset paths:** `Settings.handleFactoryReset` → remove `registry.db` + `coops/` dir.

## Verification
- `pnpm tsc --noEmit` (primary gate) + `eslint .`.
- Manual reasoning: demo coop seeded into its own file; new coop into its own file; member reads scoped by file → leak impossible; `kdp-001` fully removed.
- Cannot run Tauri runtime here; rely on static checks + targeted grep that `cooperative_id` / `kdp-001` no longer appear in SQL or `DEFAULT`.

## Risks / notes
- 94 `cooperative_id` refs + 48 `getDb()` call sites → mechanical but large; tsc is the safety net.
- `useUnits` is the one hook touching `cooperatives` from a coop-db context → must redirect to registry.
- Legacy `kdkmp.db` removal only triggers on next launch; safe backup retained.
