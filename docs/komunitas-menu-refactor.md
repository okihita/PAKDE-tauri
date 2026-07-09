# Komunitas Menu Refactor — Plan Review

> Review of the proposed consolidation of the `Komunitas` sidebar group into
> three menus: **Anggota**, **Kegiatan**, **Dampak Sosial**. No code changed —
> this document reviews and scores the plan only.

## Proposed change (as stated)

| New menu | Intended scope |
| --- | --- |
| **Anggota** | Complete member-management suite (today: `members`). |
| **Kegiatan** | Full event hub: past events incl. *rapat anggota*, proposal/LPJ file management, social-media links, participants, duration, notes, plus a "New Kegiatan" flow with prep templates. |
| **Dampak Sosial** *(name TBD)* | Merge of `participation` + `impact`; measures member activity, employment, and how lively the coop is. |

## Current state (verified in code)

- `Komunitas` group = `participation`, `members`, `event`, `impact`
  (`Sidebar.tsx:135-139`).
- **`members` → `Members.tsx`** — real member CRUD against the coop-scoped SQL DB
  (`cooperativeDb` / `useMembers`).
- **`event` → `CreateEvent.tsx`** — already has `list | templates | create`
  modes, but persists to **`localStorage`** (key `pakde-events`), *not* the SQL DB.
  Its `CalendarEvent` model is thin: `id, name, date, time, location,
  description, createdAt`. No participants linkage, duration, files, social
  links, notes, or event *type*.
- **`participation` → `Participation.tsx`** — **hardcoded mock metrics**
  (`VAL_ATTENDANCE`, `HEATMAP_DAYS`, …); links to `members` via `onTabChange`.
- **`impact` → `Impact.tsx`** — **hardcoded mock feedback** + a fake SROI audit
  animation. No real data source.
- Unlock thresholds (`moduleUnlock.ts`): `members: 0`, `participation: 20`,
  `event: 50`, `impact: 50`.

## What's strong

- 4 → 3 items is a cleaner mental model; the group reads as
  *people → activities → outcomes*.
- Promoting `event` to a real **Kegiatan** archive (history + files + links)
  closes a genuine gap — today it's effectively a creator with throwaway storage.
- Merging `participation` + `impact` removes overlap (both describe community
  vitality).
- Event **templates already exist** (`eventTemplates.ts` / `EventTemplatePicker`)
  — the "New Kegiata with templates" ask is mostly wiring, not net-new work.

## Score: 7 / 10

Strong information-architecture direction, but the plan is conceptual. It lacks
(a) a concrete **Kegiatan data model + storage decision**, (b) a **merge spec**
for what lands in Dampak Sosial, (c) the **#3 menu name**, (d) **unlock
threshold** reassignment, and (e) a **migration plan** for the nav-id rename.

## Gaps & open questions

1. **Storage architecture (biggest risk).** Events live in `localStorage`, which
   is not coop-scoped, not synced, and not multi-device safe — unlike every other
   entity. For Kegiatan to hold files/participants and survive profile switching,
   it should move to the SQL DB scoped by `cooperative_id`. The plan doesn't
   address this; it's a prerequisite, not a nice-to-have.
2. **Kegiatan data model undefined.** Proposed fields: `id, coop_id, type`
   (rapat anggota / arisan / sosial / …), `date, duration, participant_member_ids,
   proposal_file_path, lpj_file_path, social_links[], notes`. Also: does
   "New Kegiatan" replace `CreateEvent` entirely (CreateEvent becomes the
   *create* sub-view inside Kegiatan)?
3. **Dampak Sosial merge spec undefined.** Both source screens are currently
   mock. Need to decide which metrics survive and where real data comes from:
   - From *Participation*: attendance %, voting %, loyalty, activity streak,
     heatmap → derive from `members` + `events` attendance.
   - From *Impact*: employment count, SROI, gender balance, member feedback →
     derive from `members` (jobs) + `events`.
   Consolidating two static screens without a real data source just relocates the
   demo.
4. **Name for menu #3.** See recommendation below.
5. **Unlock thresholds for the 3 new ids.** Today `members:0, participation:20,
   event:50, impact:50`. Proposal: `anggota:0, kegiatan:50, dampak:20` (keep
   participation's earlier unlock) — needs a decision.
6. **Rename blast radius.** Changing nav ids cascades through: `TabId` (auto, via
   `moduleUnlock`), `App.tsx:388-391` routing, `Units.tsx:103`
   (`onTabChange("members")`), `Participation` `onTabChange`, and i18n
   `sidebar.nav.*`. ⚠️ The ranking metric `"impact"` (`rankingService.ts`,
   `useRanking.ts`) is **unrelated** to the nav id and must NOT be renamed.
7. **"Anggota = complete suite"** — define what's added vs current `Members`
   (e.g. pengurus/role linkage, joining-date visibility). Joining dates are
   already coop quests (L2), so confirm there's no duplication.

## Recommendations

**Naming (menu #3).** Avoid "Masyarakat" — it's redundant under the group
"Komunitas" (community-inside-community). Recommended, lowest-risk first:

| Option | Pros | Cons |
| --- | --- | --- |
| **Dampak Sosial** | Already the established Impact title + i18n key; zero new terminology | Long |
| **Dampak** | Short, consistent with `impact` i18n | Loses "social" nuance |
| **Pemberdayaan** | Captures employment/liveliness well | New term, not yet in i18n |

→ Recommend **Dampak Sosial** (or **Dampak** if space-constrained).

**Phasing (de-risks the work):**

- **Phase 1 — Restructure nav (low risk, compiler-guided).** Rename ids in
  `moduleUnlock.ts` (`anggota, kegiatan, dampak`), let `tsc` force updates across
  `App.tsx`, `Units.tsx`, `Participation`, and i18n. Re-point `event`→`kegiatan`,
  fold `participation`+`impact`→`dampak`. No behavior change yet.
- **Phase 2 — Kegiatan data model.** Define the SQL `events` table (coop-scoped),
  migrate existing `localStorage` `pakde-events` into it, expand `CalendarEvent`
  → full Kegiatan schema, make `CreateEvent` the *create* sub-view.
- **Phase 3 — Dampak Sosial.** Merge Participation + Impact into one screen with
  sections; wire metrics to real `members` / `events` data (replace mocks).

**Migration note.** Because `TabId = keyof typeof TABS_LEVEL_REQUIREMENTS`,
renaming keys there makes the compiler enumerate every stale reference — use that
as the migration harness rather than grep-and-pray.

## Risks

- Moving events `localStorage` → SQL DB risks losing already-created demo events
  unless a one-time migration runs.
- Merging two mock screens without real metric sources yields a prettier demo,
  not a measured feature — Phase 3 must land real data, not just UI.

---

## Path to 10/10 (what makes this plan implementation-ready)

The 7 → 10 gap is **not** architectural — it's missing *decisions and specs*.
Resolve the items below and the plan is executable without further questions.

### 1. Finalized decisions (single source of truth)

| Item | Decision |
| --- | --- |
| Menu #1 id / label | `anggota` — "Anggota" |
| Menu #2 id / label | `kegiatan` — "Kegiatan" |
| Menu #3 id / label | `dampak` — "Dampak Sosial" |
| Unlock thresholds | `anggota: 0`, `kegiatan: 20`, `dampak: 50` |
| `CreateEvent` fate | Becomes the **create / "New Kegiatan"** sub-view inside `Kegiatan` |
| Ranking metric `"impact"` | **Untouched** — unrelated to the nav id |

Rationale for `kegiatan: 20` / `dampak: 50`: matches the stated menu order
(Anggota → Kegiatan → Dampak Sosial) since the sidebar auto-sorts by threshold,
and gives a clean people → activities → outcomes progression (`kegiatan` inherits
`participation`'s early unlock; `dampak` inherits `impact`'s 50).

### 2. Kegiatan data model (SQL, coop-scoped)

```sql
CREATE TABLE events (
  id            TEXT PRIMARY KEY,
  coop_id       TEXT NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,          -- 'rapat_anggota' | 'arisan' | 'sosial' | 'pelatihan' | 'other'
  title         TEXT NOT NULL,
  date          TEXT NOT NULL,          -- ISO date
  duration_min  INTEGER,                -- was missing
  participant_ids TEXT,                 -- JSON array of member ids (was 'attendees: number')
  proposal_path TEXT,                   -- proposal/LPJ file (see §3)
  lpj_path      TEXT,
  social_links  TEXT,                   -- JSON array of URLs (was missing)
  notes         TEXT,                   -- commentary (was missing)
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX idx_events_coop ON events(coop_id, date);
```

- Replaces the `localStorage` `pakde-events` array. A **one-time migration**
  reads `localStorage`, maps `CalendarEvent → events` (participants become
  `[]`, files/links/notes empty), writes rows, then clears the key.
- `CreateEvent.tsx` keeps its `list | templates | create` modes; `create` writes
  a row instead of pushing to `localStorage`.

### 3. File storage for proposal / LPJ

Tauri offline app → store files on disk, not the DB. Use the coop's app-data
subfolder (`appDataDir` + `coop_id`):

- Save as `<appDataDir>/<coop_id>/events/<event_id>/proposal.pdf` (and `lpj.pdf`).
- Persist only `proposal_path` / `lpj_path` (relative) + `filename` + `mime` +
  `size` in the row. Keeps the DB lean and portable.

### 4. Dampak Sosial — metric map (mock → real)

Both source screens are mock today. Define every metric with a real source so
Phase 3 deletes the constants:

| Metric | Source | Computation |
| --- | --- | --- |
| Attendance % | `events.participant_ids` | attended / total members (rolling 90d) |
| Voting % | `events` where `type='rapat_anggota'` | RAT attendees / eligible voters |
| Loyalty % | `members` + accounting | members with active savings/loan |
| Activity streak / heatmap | `events.participant_ids` | consecutive active days per member |
| Employment count | `members.employment` (new field, §5) | members with a job role |
| Gender balance | `members.gender` | M / F / other ratio |
| Member feedback | new `member_feedback` table | free-text feed linked to member |
| SROI | events + financials | **derived estimate**, keep as guided indicator (not precise) |

Merge layout: **Participation** section (activity/attendance/streak) on top,
**Impact** section (employment/gender/feedback/SROI) below — one screen, two
cards, same nav id `dampak`.

### 5. Members schema additions (to feed Dampak)

`members` table gains: `gender TEXT`, `employment TEXT` (role/status),
`joining_date TEXT` (already a coop quest at L2 — surface here, don't duplicate
the quest). No new table needed beyond `member_feedback`.

### 6. Cross-references to keep consistent

- `docs/quests/coop.md`: L2 "Member registration & joining dates" ↔ **Anggota**;
  L3 "Business unit" unaffected. Add a note that Anggota is the UI for those
  quests. No quest id changes required.
- `dashboardTasks.ts`: references "modul Belajar" only — no change, but verify no
  "Partisipasi"/"Dampak" task text exists to rename.
- i18n: add `sidebar.nav.anggota/kegiatan/dampak`; the deep screen sections
  (`members`, `event`, `participation`, `impact`) can stay keyed by feature and
  be re-pointed, or renamed for clarity.

### 7. Complete migration checklist (blast radius)

- [ ] `moduleUnlock.ts`: replace `members/participation/event/impact` keys with
      `anggota/kegiatan/dampak` + new thresholds. (`TabId` updates automatically.)
- [ ] `Sidebar.tsx`: `komunitas` group items → `anggota, kegiatan, dampak`.
- [ ] `App.tsx:388-391`: re-map `activeTab` → `Anggota/Members`, `Kegiatan/CreateEvent`,
      `Dampak/(Participation|Impact)`; import the three components once.
- [ ] `Units.tsx:103`: `onTabChange("members")` → `onTabChange("anggota")`.
- [ ] `Participation.tsx`: `onTabChange("members")` → `("anggota")`; component
      merged into `Dampak`.
- [ ] i18n `id.json`/`en.json`: new `sidebar.nav.*` keys; update `beaconLocked`
      phrasing if it references old labels.
- [ ] SQL migration file: `events` table + `members` columns + `member_feedback`.
- [ ] `localStorage` → DB event migration (one-time, idempotent).
- [ ] **Do NOT rename** ranking metric `"impact"` (`rankingService.ts`,
      `useRanking.ts`).

### 8. Definition of Done (per phase)

- **Phase 1:** `tsc` + `eslint` green; app builds; nav shows Anggota / Kegiatan /
  Dampak with identical names+order across profiles; old ids absent from code.
- **Phase 2:** events persist in SQL scoped by `coop_id`; switching profiles
  isolates events; proposal/LPJ upload + social links + notes work; "New
  Kegiatan" templates functional; no `localStorage` events remain.
- **Phase 3:** Dampak Sosial renders real metrics from `members`/`events`; mock
  constants removed; employment/gender/feedback populated from data.

### 9. Verification

- Typecheck + lint in CI; manual: create event in coop A, switch to coop B,
  confirm isolation; confirm Dampak metrics move when members/events change;
  confirm `ranking` still computes its `impact` metric unchanged.
