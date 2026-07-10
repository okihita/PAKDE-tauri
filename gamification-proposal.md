# Co-op Leveling & XP — Implementation-Ready Plan (reconciled with the existing system)

> This document replaces the earlier "MVP review" draft. The original draft
> assessed a *hypothetical* greenfield MVP and recommended an architecture that,
> on inspection, **this repo already largely has**. This rewrite reconciles the
> intent (event-sourced, multi-source, auditable progression) with the system
> that actually exists, and scopes the concrete work that is still missing.

---

## 0. Reconciliation: what already exists vs. what the draft assumed

The earlier draft treated leveling as greenfield and recommended making "XP the
single source of truth" and adding "tiers." Both already exist:

| Draft recommendation | Reality in this repo | Status |
|---|---|---|
| R1 — "XP is the single source of truth" | `getCurrentLevel(xp)` in `src/data/leveling.ts:52` derives the level **only** from `cooperatives.xp`. Member count never drives the level. | ✅ Already true |
| R5 — "tier structure over the XP axis" | `LevelDef.tier` (1–10) already exists on every level (`src/data/leveling-data.ts:7`). | ✅ Already true |
| R2 — multi-source XP table | Absent. `cooperatives.xp` is a bare integer, set only by demo seeding (`src/db/seed-demo.ts`) and `Settings.tsx`. No action awards XP. | ❌ Missing |
| R3 — churn / demotion via events | Absent. No event history; member add/delete in `src/hooks/useMembers.ts` never touches XP. | ❌ Missing |
| R4 — event-sourced ledger + abuse guards | Absent. `xp` is a stored total with no provenance. | ❌ Missing |

**Critical correction to the draft:** it recommended `Level = floor(totalXP / XP_PER_LEVEL)`.
That formula is **wrong for this app**. The level curve is the existing
per-level `minXp`/`maxXp` threshold table (`leveling-data.ts`), not a flat
1,000-XP-per-level scale. The plan below **keeps that curve** and only adds
*how XP is acquired and audited*.

**Also resolved:** the draft's "Level 0 / unranked" concern is already solved —
a new co-op starts at `rintisan` (tier 1, `minXp: 0`), never "Level 0".

---

## 1. Target architecture (end state)

```
member add / remove            (src/hooks/useMembers.ts)
        │  awardXp(coopId, "member_joined", +N)
        ▼
┌──────────────────────────────────────────────────────┐
│  xp_events  (per-coop DB, append-only)   [NEW]       │
│  id · coop_id · action · delta · total_after          │
│  · meta(json) · created_at                            │
└───────────────────────┬──────────────────────────────┘
                         │ recompute: SUM(delta)
                         ▼
        cooperatives.xp  (registry.db, cached total)    [EXISTING]
                         │
                         ▼
   getCurrentLevel(xp) → LevelDef (tier, quests)        [EXISTING, unchanged]
                         │
                         ▼
   tier badge · activity feed · progress bar            [EXISTING UI + NEW feed]
```

- **XP events live in the per-coop DB** (`coops/<id>.db`), per `coopDb.ts:3`
  ("All operational per-cooperative data lives in its own `coops/<id>.db`").
- **`cooperatives.xp` in `registry.db` stays the read path**, so `Dashboard`,
  `Sidebar`, and `Leveling` UI need no change — it is simply kept in sync as
  the recomputed `SUM` of events. This is what makes churn/de-level correct by
  construction (R3) and the ledger replayable/auditable (R4).

---

## 2. Concrete changes (file-by-file)

### A. New module `src/data/xp.ts` (pure, unit-testable)
- `XP_SOURCES: Record<action, { xp: number; labelEn: string; labelId: string; reversible: boolean }>`
   — the data-driven source table (R2). Ships `member_joined: 5` (scaled to
  the existing 0–100 xp curve; see §6); future
  actions are rows, not code.
- `awardXp(coopId: string, action: string, meta?: object): Promise<number>`
  — appends an `xp_events` row, computes `total_after`, writes
  `cooperatives.xp` in registry, returns the new total.
- `revertXp(coopId, eventId)` / `removeMemberXp(coopId, memberId)`
  — negative event (R3); recompute supports multi-level de-level.
- `getXpEvents(coopId): Promise<XpEvent[]>` — for the activity feed (R4).
- `getTierBadge(xp: number): { bandEn; bandId; tier }` — maps the current
  level's `tier` onto named bands **Bronze/Perunggu · Silver/Perak · Gold/Emas**
  (R5 overlay; does **not** alter `minXp`/`maxXp`).

### B. Schema — per-coop `xp_events` table
- Add to `initCoopDb` (`src/db/coopDb.ts:106`) via
  `CREATE TABLE IF NOT EXISTS xp_events (...)`.
- No `REGISTRY_SCHEMA_VERSION` bump needed — `xp_events` is per-coop and
  `cooperatives.xp` already exists in the registry schema.

### C. Hook wiring — `src/hooks/useMembers.ts`
- After successful `membersRepo.insert` (`useMembers.ts:207`) →
  `awardXp(activeCoopId, "member_joined", { memberId })`.
- In `deleteMember` (`useMembers.ts:234`), after the delete succeeds →
  `removeMemberXp(activeCoopId, member.id)` (guarded so a member whose join
  was already reverted is not double-counted).

### D. UI
- `Leveling.tsx` / `Dashboard.tsx`: render a tier badge via `getTierBadge(xp)`
  next to the level label (R5).
- New **Activity feed** component `src/features/Home/Leveling/XpFeed.tsx`
   rendering `getXpEvents` — satisfies visual verification for Phases 2/3 and
  the audit requirement (R4). Each row: `timestamp · action label · ±delta · total`.
- Verification gate + daily cap (R4/R5) as **flagged constants** in `xp.ts`
  (`REQUIRE_VERIFICATION`, `DAILY_XP_CAP`), surfaced as toast strings (en/id).

### E. i18n — `src/i18n`
- Add en/id strings: tier band names (Perunggu/Perak/Emas),
  "Daily XP cap reached", "Verification required", and activity-feed row
  labels. Follow the bilingual pattern already used in `leveling-data.ts`.

### F. Tests — add `vitest`
- No test runner exists (`pnpm check` = lint + `tsc` + prettier only).
  **Decision: add `vitest`** as a devDependency and a `src/data/xp.test.ts`
  covering: Σevents == total (A3/A4), level derived solely from `xp` (A1),
  de-level on revert (A3). The XP math is pure and trivially testable; this is
  the cheapest way to satisfy acceptance criteria A1–A4. Wire `pnpm test`
  into CI/`pnpm check` is optional but recommended.

---

## 3. Phased rollout (4 phases, each manually verifiable)

Each phase is **independently shippable** and ends in a **manually confirmable
UI state** — a human can verify the behavior on screen without reading logs or
code. Phases 1–3 also gain automated coverage from `xp.test.ts`.

| Phase | Delivers | Files touched | Acceptance |
|---|---|---|---|
| 1 | `xp.ts` + `xp_events` table + `awardXp` wired to member add; Level 1 start already `rintisan` | `xp.ts` (new), `coopDb.ts`, `useMembers.ts`, `vitest` + `xp.test.ts` | A1, A6 |
| 2 | `XP_SOURCES` data table + Activity feed (`XpFeed`) rendering events | `xp.ts`, `XpFeed.tsx`, i18n | A2, A4 |
| 3 | Churn / de-level: `removeMemberXp` negative event | `useMembers.ts`, `xp.ts` | A3 |
| 4 | Tier badge + verification gate + daily cap (flagged) | `xp.ts`, `Leveling.tsx`, i18n | A5 |

### Phase 1 — XP ledger foundation (A1, A6)
**Build:** new `src/data/xp-core.ts` (pure, dependency-free:
`XP_SOURCES`, `computeTotal`) + `src/data/xp.ts` (DB I/O: `awardXp`,
`getXpEvents`); add the `xp_events` table in `initCoopDb` (bump
`COOP_SCHEMA_VERSION` 5→6); wire `awardXp("member_joined")` into
`useMembers.handleMemberFormSubmit` after the insert; keep `cooperatives.xp`
as the cached total. Add `vitest` + `xp.test.ts` (pure core only).
**Manually verifiable:**
- Open/create a co-op → UI shows **Level 1 (`rintisan`)**, progress bar at `xp / next threshold`.
- Add 1 member → `cooperatives.xp` increases by 5; the level bar advances; no "Level 0" state ever appears.
- Inspect the DB/feed → one `member_joined` event row exists with `delta = 5` and correct `total_after`.
- Manual check: `getCurrentLevel(xp)` matches the level shown on screen.

### Phase 2 — Extensible sources + Activity feed (A2, A4)
**Build:** ship the full `XP_SOURCES` table (`member_joined = 5`, future
stubs as rows); new `XpFeed.tsx` rendering `getXpEvents`
(`timestamp · action label · ±delta · running total`).
**Manually verifiable:**
- Activity feed lists the `member_joined` event with its exact XP (+5) and the running total.
- Flip a `XP_SOURCES` value (e.g. `5 → 7`) and add a member → feed shows **+7**; no code edit beyond the table row.
- Manual check: **sum of all feed deltas == displayed total XP**.

### Phase 3 — Churn / de-level (A3)
**Build:** `removeMemberXp` emits a negative event; level recomputes (multi-level
drop supported).
**Manually verifiable:**
- At a level with accumulated XP, remove a member → feed shows **−5 XP**, bar drops.
- Remove enough to cross a threshold → co-op visibly **de-levels** with a downgrade indicator.
- Manual check: `Σevents == totalXP`; `getCurrentLevel(totalXP)` matches the level shown.

### Phase 4 — Tiers, abuse guards & caps (A5)
**Build:** `getTierBadge(xp)` overlay (Bronze/Perunggu · Silver/Perak ·
Gold/Emas); flagged `REQUIRE_VERIFICATION` + `DAILY_XP_CAP` constants
surfaced as toasts (en/id).
**Manually verifiable:**
- Cross a tier threshold → a **tier badge** appears/updates next to the level.
- With verification required, attempt to award XP → XP **not** granted; UI shows "Verification required."
- Hit the daily cap → further actions show "Daily XP cap reached" and the bar stays pinned (resets next day / via manual reset).

---

## 4. Acceptance criteria — what "done" measurably means

| # | Criterion | How verified |
|---|-----------|--------------|
| A1 | Level is driven only by `xp`, never by raw member count (no double-count) | `xp.test.ts`: given N events, `getCurrentLevel(Σxp)` matches; member-count path is unused |
| A2 | ≥2 distinct XP sources exist via the source table | Flip a `XP_SOURCES` value → awarded XP changes; no code edit |
| A3 | Removing a member reverts XP and can de-level | Phase 3 visual + test: `Σevents == totalXP`; level matches `getCurrentLevel` |
| A4 | Every XP change is an auditable, replayable event | Phase 2 visual (`XpFeed` reconstructs total on replay) + test asserts sum |
| A5 | Tier badge updates at thresholds; abuse gate blocks unverified XP | Phase 4 visual (flagged gate) |
| A6 | Founder starts at Level 1 (no "unranked" state) | Already `rintisan` (minXp 0); Phase 1 visual confirms |
| A7 | Each phase ships a manually verifiable UI state | Per-phase checklist above |

A phase is "done" only when its row in §4 is green.

---

## 5. Decisions locked in (from the earlier open questions)

1. **Test harness:** add `vitest` + `src/data/xp.test.ts` for A1–A4.
 2. **Verification gate (R4):** ship as a **flagged stub** in Phase 4
   (`REQUIRE_VERIFICATION` constant; enforcement light, hook present for later
   hardening). Not blocking.
3. **Tier bands:** introduce **Bronze/Perunggu · Silver/Perak · Gold/Emas** as
   a *named overlay* on the existing `tier` field (recommended). The existing
   `minXp`/`maxXp` curve is untouched.

---

## 6. What was dropped from the original draft

- The "2 members = 1 level / 1,000 XP per level" MVP mechanic — it never
  matched this codebase and is superseded by the existing 10-level threshold
  model. `member_joined: 5 XP` (scaled to the existing 0–100 curve) is retained
  as a single `XP_SOURCES` row and
  composes with that curve.
- The `floor(totalXP / XP_PER_LEVEL)` formula (R1/R6) — contradicted the
  existing `minXp`/`maxXp` structure and the "Level 1 start" goal
  simultaneously. Resolved by keeping the threshold model.

**Net result:** a simple, already-mostly-built MVP that is architected as if
advanced features already existed — XP as the single ledger, actions as data,
events as the source of truth, tiers as an overlay. The remaining work is
event-sourcing + action wiring, not a rewrite.
