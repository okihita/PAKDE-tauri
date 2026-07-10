# Plan: Real Village IDs, Valid NIK, and Indonesian-Grade Member Management

## Goal
Make the Anggota (members) feature use **real Indonesian village identifiers** and **valid 16-digit NIK numbers**, wire the existing region picker into the member form, show human-readable regions, and ensure all seeded members belong to their cooperative's actual village.

## Context & Root Causes (verified in code)
- `35.01.01.001` is **hardcoded** in `src/db/seed-demo.ts:359` (`seedDemoMembers`) — a 3-digit suffix matching no real village.
- `src/data/seed-members.ts:190` (`seedMockMembers`, invoked from `Members.tsx:48`) generates random `35.XX.XX.XXX` — invalid suffix + random regency/district.
- Current seed NIKs are the wrong length: `seed-demo.ts:352` = 12 digits; `seed-members.ts:180` = 14 digits. Neither is 16.
- Real village codes use a **4-digit suffix** (e.g. `35.01.01.2001`), confirmed in the bundled `src-tauri/resources/wilayah.sqlite` (`wilayah` table: `kode`, `nama`, `level`; 38 provinces / 514 regencies / 7,265 districts / 83,345 villages) and in the live `anggota_koperasi.csv` (`33.74.14.1010`, `35.23.18.2016`).
- The region DB is already bundled & lazy-loaded (`src/db/wilayah-init.ts` + `src/features/System/ProfileSelect/wilayahDb.ts` + `RegionPicker.tsx`), but wired **only** into `CreateProfileDialog`, not the member form.
- Member form (`MemberFormDialog.tsx:163–167`) uses a free-text `<Input>` for `kode_wilayah` — the entry point for invalid codes.
- The cooperative registry (`src/db/registry.ts:52–62`) stores region **names only**, no code. `CreateProfileDialog` receives `village_code` from `RegionPicker` (`RegionPicker.tsx:42`) but **discards** it (`CreateProfileDialog.tsx:161–169`).
- Members list (`Members.tsx:190`) renders the raw `kode_wilayah` string.

### NIK structure (target — official Indonesian KTP, 16 digits)
`PPRRDD` + `DDMMYY` + `NNNN`
- `PPRRDD` = province(2)+regency(2)+district(2) = **first 6 digits of the village code** = `substr(kode,1,8)` with dots removed (e.g. `35.01.01.2001` → `35.01.01` → `350101`).
- `DDMMYY` birth date; **females add 40 to the day** (day range 41–71).
- `NNNN` sequential number within area, from `0001`.

### Verified real village codes for the three demo tiers (CONFIRMED via `sqlite3` against the bundled DB)
Query used: `SELECT v.kode, v.nama, d.nama, r.nama, p.nama FROM wilayah v JOIN wilayah d ON d.kode=substr(v.kode,1,8) JOIN wilayah r ON r.kode=substr(v.kode,1,5) JOIN wilayah p ON p.kode=substr(v.kode,1,2) WHERE v.kode IN (...)` — output:

| tier | villageCode | village (`nama`) | district | regency | province |
|---|---|---|---|---|---|
| `pemula` | `18.02.01.2001` | Sri Way Langsep | Kalirejo | Kabupaten Lampung Tengah | Lampung |
| `menengah` | `64.74.01.1002` | Bontang Baru | Bontang Utara | Kota Bontang | Kalimantan Timur |
| `lanjutan` | `73.71.01.1001` | Bontorannu | Mariso | Kota Makassar | Sulawesi Selatan |

This run also confirms the `resolveWilayah` 8/5/2 substr-JOIN scheme returns correct hierarchy names.

## Design Decisions
1. **A member's location = `kode_wilayah`** (a real level-4 village code). Display names are derived from `wilayah.sqlite`, never stored redundantly on the member.
2. **Cooperative owns a village code.** Seeded members inherit the coop's village code; new members default to it.
3. **Reuse `RegionPicker`** in the member form instead of free text.
4. **NIK generated from village code + birth date + gender** in seeds; **validated** in the form.
5. **Skip** `hackathon_data/referensi_wilayah.csv` — the bundled `wilayah.sqlite` is the reference.

## Implementation Tasks (ordered)

### 1. Shared wilayah lookup helpers
Create `src/db/wilayahLookup.ts` (usable by seeds, hooks, and display — outside the ProfileSelect feature folder):
- `resolveWilayah(villageCode)` → `{ province_code/name, regency_code/name, district_code/name, village_code/name } | null` via one query joining on `substr(kode,1,2)` (province), `substr(kode,1,5)` (regency), `substr(kode,1,8)` (district). NOTE: the existing `wilayahDb.ts:59–60` `searchVillages` uses `substr(...,1,6)`/`substr(...,1,4)` which is **wrong for dotted codes** (silently yields empty regency/district labels) — implement the correct 8/5/2 scheme here and consider reusing it to fix `searchVillages`.
- `formatWilayahShort(res)` → `"Desa X, Kec. Y"`; `formatWilayahFull(res)` → `"Desa X, Kec. Y, Kab. Z, Prov."`.
- `getVillageByCode(code)` and `pickRandomVillageInRegency(prefix)` for seeds.
- In-memory `Map` cache keyed by `villageCode` (codes repeat heavily). Reuse `getWilayahDb()`.
- **DECIDED: fix `searchVillages` here.** Replace the buggy `substr(w.kode,1,6)`/`substr(w.kode,1,4)` JOIN (`wilayahDb.ts:59–60`) with the correct `substr(w.kode,1,8)` (district) / `substr(w.kode,1,5)` (regency) so the direct-search branch shows real district/regency labels. In scope for this change (small, adjacent).

### 2. NIK utilities
Create `src/data/nik.ts`:
- `generateNik(villageCode, birthDateISO, gender, seq)` — area = 6 digits from `substr(villageCode,1,8)` (dots removed); day = birthDay + (gender==="P" ? 40 : 0); + `MM` + `YY` + `seq.padStart(4,"0")`.
- `isValidNik(nik)` — 16 digits; day 1–31 (male) or **41–71 (female)**; valid MM; non-zero sequence.
- `parseNik(nik)` (optional) to show derived birth/gender/area as a read-only integrity hint.

### 3. Cooperative gains a village code
- `src/db/registry.ts`: **migration needs care — `registry.ts` is NOT structured like `coopDb.ts`.** Its version guard (`:50–67`) only runs `CREATE TABLE IF NOT EXISTS cooperatives` and has **no `addColumnIfAbsent` helper** (that helper is only in `coopDb.ts:62–67`). Steps:
  1. Bump `REGISTRY_SCHEMA_VERSION` (1 → 2).
  2. Add `village_code TEXT` to the `CREATE TABLE` statement (fresh installs).
  3. Add a guarded `ALTER TABLE cooperatives ADD COLUMN village_code TEXT` using a `PRAGMA table_info(cooperatives)` existence check, executed **after** the `CREATE TABLE IF NOT EXISTS` so existing installs (where CREATE is a no-op) actually get the column. Add a local `addColumnIfAbsent` here or export/reuse the one from `coopDb.ts`.
  4. Keep existing name columns (`village`, `district`, `regency`, `province`).
- `src/types` `CooperativeProfile`: add `village_code?: string`.
- `cooperativeDb.ts` (`CreateCooperativeInput` + `createCooperative`): accept and persist `village_code`.
- `CreateProfileDialog.tsx`: add a `village_code` slot to `formData` (`:49–70`), capture `region.village_code` in the `RegionPicker` `onChange` (`:161–169`, currently discarded), and pass it through `handleLaunch` → `createCooperative` (`:88–108`).

### 4. Rework demo seeding (`src/db/seed-demo.ts`)
- `demoTiers.ts`: add `villageCode: string` with the three verified codes above. **DECIDED: the village code is the source of truth — set the `village`/`regency`/`province` literals to the confirmed resolved names** (so registry, tier metadata, and narrative agree). Exact values:
  - `pemula`: `villageCode: "18.02.01.2001"`, village `"Sri Way Langsep"`, regency `"Kabupaten Lampung Tengah"`, province `"Lampung"` (was `"Desa Air Hitam"` / `"Lampung Tengah"`).
  - `menengah`: `villageCode: "64.74.01.1002"`, village `"Bontang Baru"`, regency `"Kota Bontang"`, province `"Kalimantan Timur"` (village already matches).
  - `lanjutan`: `villageCode: "73.71.01.1001"`, village `"Bontorannu"`, regency `"Kota Makassar"`, province `"Sulawesi Selatan"` (was `"Kelurahan Tanjung Bunga"`).
  - Update narrative prose only where it names the specific village; province/city references already hold.
- In `seedDemoCooperativeAtLevel`: `resolveWilayah(tier.villageCode)` and write resolved `village/district/regency/province` names **and** the new `village_code` into the registry row.
- `seedDemoMembers`:
  - **Extend the INSERT column list** (currently `id, nik, name, status, registered_at, kode_wilayah, status_keanggotaan, savings_pokok, savings_wajib` at `:357–360`) to also include `gender` and `date_of_birth` — required to generate a valid NIK.
  - Set every member's `kode_wilayah = tier.villageCode`.
  - Generate `gender`, `date_of_birth` (age 22–65), then `generateNik(tier.villageCode, dob, gender, i+1)`.
  - Populate fuller fields (place_of_birth, occupation, education, zero-padded rt/rw) for realism.

### 5. Rework `seedMockMembers` (`src/data/seed-members.ts`)
- **DECIDED (fixes a live bug): target the ACTIVE coop.** This seeder currently **hardcodes `getCoopDb(DEMO_COOP_UUID)`** (`:132`), but `Members.tsx:45–54` (`handleSeed`) calls it from any coop's view — so clicking "Seed" while viewing coop B silently writes 50 rows into the invisible demo coop. Change line 132 to use the active coop via `getActiveCoopId()` (already imported in `useMembers.ts:4`); also update the `DELETE FROM members WHERE id LIKE 'seed-%'` cleanup to run against that same coop.
- Resolve the active coop's `village_code` (fallback to a fixed real code, e.g. `35.01.01.2001`, if the coop has `NULL`) and assign it to **all 50** members.
- Replace the invalid `kode_wilayah` (`:190`) and NIK (`:180`) with the coop village code and `generateNik(...)`.
- Keep NIK disjoint from any demo members in the same DB (different area/seq → safe; note it).

### 6. Wire `RegionPicker` into the member form
- **DECIDED: implement edit-mode prefill now** (leaving it out silently drops `kode_wilayah` on edit).
- `RegionPicker.tsx`: props are currently only `{ onChange }` (`:16–18`) with four internal `useState`s; `ComboboxField.query` initializes once from `selected?.nama` (`:131`). Prefill therefore requires passing **full `WilayahRow` objects** (each with `kode` + `nama`, not just codes/names) as the initial `province/regency/district/village` state, so both the displayed `query` and the initial `emit` are correct. Add prop `initial?: { province?: WilayahRow; regency?: WilayahRow; district?: WilayahRow; village?: WilayahRow }` and seed the `useState` initializers + `ComboboxField key`s from it.
- `MemberFormDialog.tsx`: replace the free-text `kode_wilayah` `<Input>` (`:159–168`) with `RegionPicker`; persist only `kode_wilayah` (village_code). For **edit** mode, build the `initial` objects via `resolveWilayah(member.kode_wilayah)`. For **add** mode, default the region to the active coop's `village_code`.
- **Coop-default fetch location (pinned):** do the async `getActiveCoopId()` + `getCooperativeById()` (and, for edit, `resolveWilayah`) inside a `useEffect` in `MemberFormDialog` keyed on dialog `open` + `memberFormType`, storing the resolved `initial` in local state with a loading guard so the picker doesn't render before data is ready. `openAddMemberModal` (`useMembers.ts:120`) still resets `MEMBER_DEFAULT`; the dialog overlays the coop default on top.
- **NIK:** the form keeps a free-text NIK `<Input>` (`MemberFormDialog.tsx:44`); `useMembers.ts:176` already checks `length === 16` and the DB enforces `UNIQUE`. **DECIDED: auto-generate the NIK** in add mode from region + `date_of_birth` + gender via `generateNik(...)`, populated into the field once those three are set, but keep the field **editable** (some NIKs predate the member's coop registration). Run `isValidNik` (area/day/month structural check) on submit with an inline error; surface a friendly duplicate error on the UNIQUE violation.

### 7. Readable region in the members list
- `Members.tsx:190`: render `formatWilayahShort(...)` with the raw code as `title`/tooltip. Batch-resolve the visible list's unique codes in a `useEffect` (dedupe via task-1 cache); show a placeholder while pending.
- Update `members.tableHeaders` label (e.g. "Desa") in `src/i18n/locales/{id,en}.json` if the column meaning changes.

### 8. Indonesian-context polish
- Zero-pad `rt`/`rw` in form + seeds; keep `status_keanggotaan` (already correct).
- Optional: display birth date + gender parsed from NIK as a read-only integrity hint.

## Phased Rollout (4 manually-verifiable phases)

The 8 implementation tasks above are grouped into four phases. Each phase ends at a
point that can be **manually verified in isolation** (with a clear "how to test"
checklist) before the next phase begins. A phase should NOT be considered done
until its verification checklist passes.

### Phase 1 — Core data layer (lookup helpers + NIK utilities)
**Tasks:** #1 (shared wilayah lookup helpers, incl. `searchVillages` substr fix), #2 (NIK utilities).
**Scope:** New pure-logic modules with no UI dependency.
- New: `src/db/wilayahLookup.ts` (`resolveWilayah`, `formatWilayahShort`/`Full`, `getVillageByCode`, `pickRandomVillageInRegency`, `Map` cache).
- New: `src/data/nik.ts` (`generateNik`, `isValidNik`, `parseNik`).
- Fix: `searchVillages` substr(.,1,6)/(.,1,4) → substr(.,1,8)/(.,1,5) in `wilayahDb.ts`.
**Manual verification:**
- Run a small throwaway script (e.g. `tsx`/`vite-node`) that imports the two modules and:
  - `resolveWilayah("18.02.01.2001" | "64.74.01.1002" | "73.71.01.1001")` returns the confirmed hierarchy names from the plan table.
  - `formatWilayahShort`/`Full` produce `"Desa Sri Way Langsep, Kec. Kalirejo"` etc.
  - `generateNik` for a male and a female (birth day 15) yields 16 digits; female day = 55; `isValidNik` true for both and false for a 14-digit / bad-month input.
- `pnpm lint` + type-check pass for the two new files (no unused exports).

### Phase 2 — Cooperative owns a village code + demo seed rework
**Tasks:** #3 (registry migration + types + cooperativeDb + CreateProfileDialog capture), #4 (demoTiers + seedDemoCooperative + seedDemoMembers).
**Scope:** Persist `village_code` on the cooperative and make demo seeds emit real codes + valid NIKs.
**Manual verification:**
- Fresh install: `PRAGMA table_info(cooperatives)` shows a `village_code` column (created via `CREATE TABLE`).
- Upgrade: with an existing registry (no `village_code`), the guarded `ALTER TABLE` adds the column; `PRAGMA table_info` confirms it appears.
- Create a coop through `CreateProfileDialog` → pick a region → `getCooperativeById` returns a non-null `village_code` matching the picked village.
- Re-seed each demo tier → every member in that tier shares `tier.villageCode`; registry row's `village_code` + name columns match the confirmed table; every member NIK is 16 digits with the correct 6-digit area prefix.

### Phase 3 — Member form wiring + seedMockMembers rework
**Tasks:** #5 (seedMockMembers targets active coop), #6 (RegionPicker into MemberFormDialog: add/edit prefill, default to coop village, NIK auto-generate + validation).
**Scope:** Stop free-text `kode_wilayah`; drive the form from `RegionPicker`; fix the silent wrong-coop seed bug.
**Manual verification:**
- Open "Add member" in a coop → `RegionPicker` defaults to the coop's village; once region + DOB + gender are set, the NIK field auto-fills a valid 16-digit NIK and remains editable.
- Submit with an invalid NIK → inline error; submit a duplicate NIK → friendly UNIQUE error.
- Open "Edit member" for an existing member → `RegionPicker` pre-fills the member's village (no blank `kode_wilayah` on save).
- In coop B's Members view, click "Seed" → the 50 generated rows appear in coop B (not the demo coop), all with a real 4-digit-suffix `kode_wilayah` and valid NIKs.

### Phase 4 — Readable region in list + Indonesian polish
**Tasks:** #7 (Members.tsx renders `formatWilayahShort` with code-on-hover + batched/deduped resolve), #8 (zero-pad rt/rw, optional NIK-parse hint), plus i18n label updates.
**Scope:** Presentation only; no schema/logic changes that affect Phases 1–3.
**Manual verification:**
- Members list shows `"Desa …, Kec. …"` (not a raw code) for every row; hovering reveals the `kode_wilayah` in a tooltip; pending rows show a placeholder then resolve.
- `rt`/`rw` render zero-padded; i18n column label (e.g. "Desa") updated in `id.json`/`en.json`.
- `pnpm lint` + type-check/build pass.

## Files to Touch
- New: `src/db/wilayahLookup.ts`, `src/data/nik.ts`.
- Edit: `src/db/registry.ts`, `src/db/seed-demo.ts`, `src/data/seed-members.ts`, `src/types/index.ts`, `src/features/System/ProfileSelect/demoTiers.ts`, `src/features/System/ProfileSelect/cooperativeDb.ts`, `src/features/System/ProfileSelect/CreateProfileDialog.tsx`, `src/features/System/ProfileSelect/RegionPicker.tsx`, `src/features/Community/Members/MemberFormDialog.tsx`, `src/features/Community/Members/Members.tsx`, `src/hooks/useMembers.ts`, `src/i18n/locales/id.json`, `src/i18n/locales/en.json`.
- Optional fix: `src/features/System/ProfileSelect/wilayahDb.ts` (`searchVillages` substr bug).

## Risks & Notes
- **Registry migration (highest risk)**: `registry.ts`'s guard only does `CREATE TABLE IF NOT EXISTS`; a version bump alone will NOT add `village_code` to existing installs. Requires a guarded `ALTER TABLE` (see task 3).
- **Demo-tier name drift**: task 4 must reconcile hardcoded `demoTiers` names with resolved names, or registry ≠ tier metadata ≠ narrative.
- **`seedDemoMembers` column list** must grow to include `gender`/`date_of_birth` for valid NIK generation.
- **RegionPicker edit prefill** is the largest UI change and previously hand-waved — now a committed task with a defined prop shape.
- **`seedMockMembers` target coop** is an explicit decision (active vs demo), not a silent default.
- **NULL `village_code`** on pre-existing coops — new-member default must fall back gracefully.
- **Existing demo data** keeps `35.01.01.001` until re-seeded (`clearDemoCooperative` + re-seed). No destructive auto-migration of member rows.
- **Async region resolution** in the list needs loading/empty handling; mitigate query cost with the cache (codes are highly repeated).

## Validation
- `pnpm lint` (custom eslint rules) + type-check/build.
- Re-seed each demo tier → all members share the tier's real village code; names render as "Desa …, Kec. …"; every NIK is 16 digits with correct area prefix.
- Female member: NIK day = birth day + 40 (41–71); `isValidNik` accepts it.
- Create a new cooperative → `village_code` persisted; add a member → region defaults to coop village; invalid/duplicate NIK rejected; edit a member → picker pre-fills existing region.
- `seedMockMembers` → 50 members in one real village with valid NIKs, written to the intended coop.

## Open Decisions (all resolved)
1. **RegionPicker edit-mode prefill** — RESOLVED: implement now (task 6).
2. **`seedMockMembers` target** — RESOLVED: target the active coop (task 5).
3. **Demo narrative names** — RESOLVED: village code is source of truth; `demoTiers.ts` literals set to confirmed resolved names (task 4).
4. **In-form NIK** — RESOLVED: auto-generate but keep editable (task 6).
5. **`searchVillages` substr bug** — RESOLVED: fix in scope (task 1).

## Acceptance criteria (implementation is done when all pass)
- No `kode_wilayah` in the app matches the pattern `NN.NN.NN.NNN` (3-digit suffix); every seeded member has a real 4-digit-suffix code present in `wilayah.sqlite`.
- Every member NIK is exactly 16 digits, `isValidNik` returns true, and the 6-digit area prefix equals the member's village code first 6 digits; female members' NIK day is 41–71.
- For each demo tier, ALL members share that tier's `villageCode`, and the registry row's `village_code` + name columns match the confirmed table in this plan.
- The members list renders `"Desa …, Kec. …"` (not a raw code), with the code available on hover.
- Creating a coop via `CreateProfileDialog` persists a non-null `village_code`; adding a member defaults its region + auto-fills a valid NIK; editing a member pre-fills the existing region and does not blank `kode_wilayah` on save.
- Clicking "Seed" in Members writes to the currently active coop (verified by the rows appearing in that coop's list).
- Fresh install AND upgrade-from-existing-registry both end with a `village_code` column present (verify via `PRAGMA table_info(cooperatives)`).
- `pnpm lint` and the type-check/build pass.

## Out of Scope
- Importing live `anggota_koperasi.csv` / `simpanan_anggota.csv`.
- Changing bundled `wilayah.sqlite` contents.
- KTP photo upload, geocoding, or extra demographic fields beyond those listed.
