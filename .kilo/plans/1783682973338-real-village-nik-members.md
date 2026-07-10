# Plan: Real Village IDs, Valid NIK, and Indonesian-Grade Member Management

## Goal
Make the Anggota (members) feature use **real Indonesian village identifiers** and **valid NIK numbers**, wire the existing region picker into the member form, show human-readable regions, and ensure all seeded members belong to their cooperative's actual village.

## Context & Root Causes (verified in code)
- The `35.01.01.001` the user saw is **hardcoded** in `src/db/seed-demo.ts:359` (`seedDemoMembers`) — a 3-digit suffix that matches no real village.
- A second seeder, `src/data/seed-members.ts:190` (`seedMockMembers`, invoked from `Members.tsx:48`), generates random `35.XX.XX.XXX` codes — also invalid (3-digit suffix, random regency/district).
- Real village codes use a **4-digit suffix** (e.g. `35.01.01.2001`). Confirmed by both the bundled `src-tauri/resources/wilayah.sqlite` (38 provinces / 514 regencies / 7,265 districts / 83,345 villages) and the live `anggota_koperasi.csv` (`33.74.14.1010`, `35.23.18.2016`).
- A complete, searchable region DB is **already bundled** and lazy-loaded: `src/db/wilayah-init.ts` + `src/features/System/ProfileSelect/wilayahDb.ts` + `RegionPicker.tsx`. It is only wired into `CreateProfileDialog`, **not** the member form.
- The member form (`MemberFormDialog.tsx:163`) uses a free-text `<Input>` for `kode_wilayah` — the entry point for invalid codes.
- The cooperative registry (`src/db/registry.ts`) stores region **names only** (`village`, `district`, `regency`, `province`) and **no village code**. `CreateProfileDialog` receives codes from `RegionPicker` but **discards them**.
- Members list (`Members.tsx:190`) shows the raw `kode_wilayah` string, not a readable name.

### NIK structure (target, official Indonesian KTP format — 16 digits)
`PPRRDD` + `DDMMYY` + `NNNN`
- `PP` province (2) + `RR` regency (2) + `DD` district (2) = **first 6 digits of the village code** (dots stripped, take `substr(kode,1,8)` → remove dots).
- `DDMMYY` birth date; **for females add 40 to the day** (e.g. born 5th → `45`).
- `NNNN` sequential registration number within the area, starting `0001`.

### Concrete real village codes for the three demo tiers (verified present in wilayah.sqlite)
- `pemula` → **`18.02.01.2001`** Sri Way Langsep, Kec. Kalirejo, Kab. Lampung Tengah, Lampung (matches narrative "Lampung").
- `menengah` → **`64.74.01.1002`** Bontang Baru, Kota Bontang, Kalimantan Timur (exact match to narrative).
- `lanjutan` → **`73.71.01.1001`** Bontorannu, Kec. Mariso, Kota Makassar, Sulawesi Selatan (matches narrative "Makassar").

## Design Decisions
1. **Single source of truth for a member's location = `kode_wilayah`** (a real level-4 village code). All display names are derived from `wilayah.sqlite`, never stored redundantly on the member.
2. **Cooperative owns a village code.** All seeded members inherit the coop's village code (satisfies "all members from THAT village"). New members default to the coop's village.
3. **Reuse `RegionPicker`** in the member form instead of free text.
4. **NIK is generated from the village code + birth date + gender** in seeds, and **validated** in the form.
5. **Skip** `hackathon_data/referensi_wilayah.csv` — the bundled `wilayah.sqlite` is the reference.

## Implementation Tasks (ordered)

### 1. Shared wilayah lookup helpers
Create `src/db/wilayahLookup.ts` (usable by seeds, hooks, and display — outside the ProfileSelect feature folder):
- `resolveWilayah(villageCode: string): Promise<{ province_code, province_name, regency_code, regency_name, district_code, district_name, village_code, village_name } | null>` — one query joining on `substr(kode,1,2)`, `substr(kode,1,5)`, `substr(kode,1,8)` against `wilayah`.
- `formatWilayahShort(res)` → `"Desa X, Kec. Y"` and `formatWilayahFull(res)` → `"Desa X, Kec. Y, Kab. Z, Prov."`.
- `pickRandomVillageInRegency(regencyCodePrefix)` and/or `getVillageByCode` for seeds.
- Add a small in-memory `Map` cache keyed by `villageCode` (village codes repeat heavily across members).
- Reuse `getWilayahDb()` from `src/db/wilayah-init.ts`. Optionally move/re-export the existing `wilayahDb.ts` search functions here so there is one module; keep `RegionPicker`'s imports working (re-export from the old path or update the import).

### 2. NIK utilities
Create `src/data/nik.ts`:
- `generateNik(villageCode: string, birthDateISO: string, gender: "L"|"P", seq: number): string`
  - area = digits of `substr(villageCode,1,8)` with dots removed (6 digits).
  - day = `birthDay + (gender === "P" ? 40 : 0)`, zero-padded; `MM`, `YY`.
  - `seq` → 4-digit, `String(seq).padStart(4,"0")`.
- `isValidNik(nik: string): boolean` — 16 digits, plausible DDMMYY (accounting for +40 female day), non-zero sequence.
- `parseNik(nik)` (optional) for showing derived birth/gender/area in the form as a sanity hint.

### 3. Cooperative gains a village code
- `src/db/registry.ts`: **migration needs care — `registry.ts` is NOT structured like `coopDb.ts`.** Its version guard only runs `CREATE TABLE IF NOT EXISTS cooperatives` and there is **no `addColumnIfAbsent` helper in this file** (that helper is defined only in `coopDb.ts`). Steps:
  1. Bump `REGISTRY_SCHEMA_VERSION` (1 → 2).
  2. Add `village_code TEXT` to the `CREATE TABLE` statement (for fresh installs).
  3. Add an `ALTER TABLE cooperatives ADD COLUMN village_code TEXT` guarded by a column-existence check (via `PRAGMA table_info(cooperatives)`), executed **outside/after** the `CREATE TABLE IF NOT EXISTS` so existing installs (where the table already exists and CREATE is a no-op) actually get the column. Either add a local `addColumnIfAbsent` helper here or export the one from `coopDb.ts` and reuse it.
  4. Keep the existing name columns (`village`, `district`, `regency`, `province`).
- `src/types` `CooperativeProfile`: add `village_code?: string`.
- `src/features/System/ProfileSelect/cooperativeDb.ts` (`CreateCooperativeInput` + `createCooperative`): accept and persist `village_code` (plus keep district/regency/province names).
- `src/features/System/ProfileSelect/CreateProfileDialog.tsx`: in the `RegionPicker` `onChange`, also store `region.village_code` (currently discarded) and pass it through `handleLaunch` → `createCooperative`.

### 4. Rework demo seeding (`src/db/seed-demo.ts`)
- `src/features/System/ProfileSelect/demoTiers.ts`: add `villageCode: string` to `DemoTier` with the three verified codes above.
- In `seedDemoCooperativeAtLevel`: call `resolveWilayah(tier.villageCode)` and write the **resolved** `village`, `district`, `regency`, `province` names **and** the new `village_code` into the registry row (keeps registry, members, and picker consistent). Keep narrative text as-is.
- Replace `seedDemoMembers` hardcoded `'35.01.01.001'`:
  - Set every member's `kode_wilayah = tier.villageCode`.
  - Generate realistic `gender`, `date_of_birth` (age 22–65), then a **valid NIK** via `generateNik(tier.villageCode, dob, gender, i+1)`.
  - Populate the fuller member fields (place_of_birth, occupation, education, rt/rw zero-padded) so demo data looks Indonesian and complete (align with `seed-members.ts` field set).

### 5. Rework `seedMockMembers` (`src/data/seed-members.ts`)
- Note: this seeder currently **hardcodes `getCoopDb(DEMO_COOP_UUID)`** (line 132) — it always writes to the demo coop, not necessarily the active one. Resolve that same demo coop's `village_code` from the registry (fallback to a fixed real code, e.g. `35.01.01.2001`) and assign it to **all 50** members. If this dev seeder should instead target the active coop, treat that as a separate decision.
- Replace `kode_wilayah` line 190 with the coop village code.
- Replace NIK line 180 with `generateNik(villageCode, dob, gender, i)`.
- Keep names/occupations lists; ensure gender-aware NIK.

### 6. Wire `RegionPicker` into the member form
- `MemberFormDialog.tsx`: replace the free-text `kode_wilayah` `<Input>` (lines 159–168) with `RegionPicker`.
- `RegionPicker.tsx`: add **optional initial-value props** (province/regency/district/village codes+names) so **edit mode** pre-fills from the member's existing `kode_wilayah` (resolve via `resolveWilayah`). If adding full prefill is too large, at minimum keep the stored code when the user doesn't touch the picker.
- `MemberFormDialog` should default a **new** member's region to the active cooperative's `village_code` (fetch coop via `getActiveCoopId` + `getCooperativeById`).
- Persist only `kode_wilayah` (village_code) on the member; ignore the name fields for storage.
- Add **NIK validation** feedback in the form using `isValidNik` (block submit or show inline error). Optionally auto-suggest area digits from the selected village.
- `src/hooks/useMembers.ts`: no schema change needed (`kode_wilayah` already saved); ensure default form value can be seeded with the coop's village code.

### 7. Readable region in the members list
- `Members.tsx:190`: replace raw `mbr.kode_wilayah` with the resolved short name (`formatWilayahShort`), showing the raw code as a `title`/tooltip. Batch-resolve codes for the visible list (dedupe via the cache in task 1) to avoid N queries.
- Update `members.tableHeaders` label if needed (e.g. "Desa" instead of a code header) in `src/i18n/locales/{id,en}.json`.

### 8. Indonesian-context polish (member management "perfect")
- Ensure `rt`/`rw` are zero-padded 2–3 digits in form + seeds.
- Keep membership class (`status_keanggotaan`) — already present and correct.
- Validate: NIK unique (DB already `UNIQUE`), 16 digits, structurally valid; show friendly error on duplicate/invalid.
- Optional (note, not required): display derived birth date + gender parsed from NIK as a read-only hint to reinforce data integrity.

## Files to Touch
- New: `src/db/wilayahLookup.ts`, `src/data/nik.ts`.
- Edit: `src/db/registry.ts`, `src/db/seed-demo.ts`, `src/data/seed-members.ts`, `src/types/index.ts`, `src/features/System/ProfileSelect/demoTiers.ts`, `src/features/System/ProfileSelect/cooperativeDb.ts`, `src/features/System/ProfileSelect/CreateProfileDialog.tsx`, `src/features/System/ProfileSelect/RegionPicker.tsx`, `src/features/Community/Members/MemberFormDialog.tsx`, `src/features/Community/Members/Members.tsx`, `src/hooks/useMembers.ts`, `src/i18n/locales/id.json`, `src/i18n/locales/en.json`.

## Risks & Notes
- **Registry migration (highest risk)**: `registry.ts`'s version guard only does `CREATE TABLE IF NOT EXISTS`; bumping the version alone will NOT add `village_code` to existing installs. A guarded `ALTER TABLE` (with `PRAGMA table_info` check) must be added, and there is no reusable `addColumnIfAbsent` in this file today. See task 3 for exact steps.
- **Existing demo data**: users who already seeded a demo coop will keep the old `35.01.01.001` until they re-seed. `clearDemoCooperative` + re-seed fixes it; consider a one-time note. No destructive auto-migration of member rows required.
- **RegionPicker prefill**: it currently has no controlled initial value; adding prefill for edit mode is the largest UI change. If deferred, document that editing a member re-selects region from scratch.
- **Performance**: resolving village names for large member lists — mitigate with the cache; village codes are highly repeated (often one per coop).
- **Name/code drift**: storing only `kode_wilayah` on members and deriving names avoids stale duplicated names.

## Validation
- Type-check / lint: `pnpm lint` (repo uses custom eslint rules) and `pnpm tsc`/build.
- Manual: re-seed each demo tier → confirm all members share the tier's real village code, names render as "Desa …, Kec. …", and every NIK is 16 digits with correct area prefix + female +40 day rule.
- Spot-check a female member: NIK day field = birth day + 40.
- Create a new cooperative via `CreateProfileDialog` → confirm `village_code` persisted; add a member → region defaults to coop village; invalid NIK is rejected.
- Confirm `seedMockMembers` (dev button in Members) produces 50 members all in the coop's village with valid NIKs.

## Out of Scope
- Importing the live `anggota_koperasi.csv` / `simpanan_anggota.csv` datasets.
- Changing the bundled `wilayah.sqlite` contents.
- KTP photo upload, address geocoding, or additional demographic fields beyond those listed.
