# Review: Start (Boot), Onboarding, and Profile Loading

**Scope:** `src/main.tsx`, `src/App.tsx`, `src/db/*`, `src/features/System/ProfileSelect/*`, `src/features/System/Sidebar.tsx`, `src/types/index.ts`
**Date:** 2026-07-09
**Reviewer:** Senior Implementation Engineer
**Companion doc:** `REVIEW-profile-select.md` (title-screen state model — referenced where overlapping)

---

## 1. Executive Summary

The three flows are individually *functional on the happy path*, but they share one systemic theme: **the app bootstraps state eagerly and incompletely, then never reloads the live data the shell promises.** Two of the shell's headline features (member count, EWS critical-alert badge) are wired to state that is **never populated**. And the user is forced through the full selection + PIN gate on **every launch** because nothing is resumed from `localStorage`.

| Area | Score | One-line verdict |
|------|-------|------------------|
| **Start (boot/startup)** | **5.5 / 10** | Works, but no session resume and a silent total-data-wipe on schema bump. |
| **Onboarding (create profile / user / sign-in / demo)** | **6.5 / 10** | Solid visual flow; recovery data is dead and lockout has no escape hatch. |
| **Profile Loading (active coop + live data into shell)** | **4.5 / 10** | Cooperative row loads; member count + EWS alerts are hardcoded empty. |

**Overall: ~5.5 / 10.** The fastest path to 10/10 is fixing the two "live data never loads" bugs (PL-1, PL-3) and adding boot resume (ST-1) — all low/medium effort, high impact.

---

## 2. Scoring Aspects

Each area is scored across 7 aspects (1–10):

- **Correctness** — does it do what it claims without bugs?
- **First-run UX** — is the first-launch experience clear and frictionless?
- **Data Integrity / Persistence** — is user data safe, resumed, and complete?
- **Security** — auth, lockout, secrets.
- **Performance** — boot time, redundant work, races.
- **Maintainability** — state model, dead code, fragility.
- **Visual Polish** — loading states, feedback, consistency.

### Aspect scorecard

| Aspect | Start | Onboarding | Profile Loading |
|--------|------:|-----------:|----------------:|
| Correctness | 6 | 7 | 3 |
| First-run UX | 6 | 7 | 5 |
| Data Integrity / Persistence | 4 | 6 | 4 |
| Security | 7 | 6 | 6 |
| Performance | 7 | 8 | 6 |
| Maintainability | 6 | 6 | 5 |
| Visual Polish | 6 | 7 | 5 |
| **Mean** | **6.0** | **6.7** | **4.9** |

> Scores trimmed to the headline numbers in §1 (Start 5.5, Onboarding 6.5, Profile Loading 4.5) after weighting the most user-visible defects.

---

## 3. Detailed Findings

### 3.1 START (boot / startup)

- **ST-1 — No session resume on launch.** `App.tsx:60` always initializes `appState` to `"profile_select"`. `localStorage["pakde-active-profile-id"]` *is* written (`App.tsx:242`, `:167`) but **never read at boot** (only read as a fallback inside the `main` load effect, `App.tsx:159`, which never runs until you've already manually re-selected). **Impact:** every cold launch forces full re-select + re-PIN. For a desktop app this is the single biggest day-to-day friction. *Effort: Med. Impact: High.*

- **ST-2 — `getDb()` singleton has no init guard.** `src/db/index.ts:5` opens `Database.load` on first call with no promise memo. `initDb` memoizes *its own* work, but any other module calling `getDb()` before `initDb` resolves can trigger a second `Database.load` (double connection → `SQLITE_BUSY` risk). *Effort: Low. Impact: Med (latent race).*

- **ST-3 — Schema bump silently DROPs all user tables.** `src/db/init.ts:64-74` does `DROP TABLE IF EXISTS` on **every** table when `currentVersion < SCHEMA_VERSION`, then recreates empty. No migration, no backup, no warning. Fine in dev, **catastrophic in production** — any schema change (e.g., adding a column) wipes every cooperative, member, journal, and sale. *Effort: High. Impact: High.*

- **ST-4 — Title screen doubles as the loading screen (acceptable, minor gap).** `ProfileSelect.tsx:87-110` runs `initDb()` and dims the three cards (`opacity-60`) with a spinner while the slideshow + footer still render. No progress % or error affordance until DB is ready (errors route to `db_error` screen — fine). *Effort: Low. Impact: Low.*

- **ST-5 — Audio resume fires on every click.** `handleUserInteraction` (`ProfileSelect.tsx:133-136`) calls `sfx.resume()` + `bgMusic.resume()` on every interaction, including the background `div` `onClick`. Wasteful and risks audio stutter. *(Flagged previously as REVIEW-profile-select #9.)* *Effort: Low. Impact: Low–Med.*

### 3.2 ONBOARDING (create coop / create user / sign-in / demo)

- **OB-1 — Recovery question/answer is dead data; no self-service unlock.** `CreateUserProfile.tsx:65` collects `recoveryQuestion`/`recoveryAnswer` and `userDb.ts:25,37` persists `recovery_answer_hash`. But **nothing ever reads it**: `UserSignIn.tsx` has no "lupa PIN" path, and `validatePin` (`userDb.ts:57`) only checks the lockout/PIN. Combined with the 15-minute lockout (`userDb.ts:83-89`), a user who forgets their PIN and **didn't** set a recovery question is fully locked for 15 min; a user who **did** set one has no way to use it. *Effort: Med. Impact: High.*

- **OB-2 — `emblem` picker is dead UI.** `CreateProfileDialog.tsx:177-197` lets users pick an emblem, but `CreateCooperativeInput` has no `emblem` field and `handleLaunch` never passes it → silently discarded. *(REVIEW-profile-select #1.)* *Effort: Low. Impact: Low–Med (visual honesty).*

- **OB-3 — Weak minimum validation on "launch cooperative."** `CreateProfileDialog.tsx:72` `isValid = name && province`. Regency/address/contact optional, yet the coop is "launched" and immediately drives downstream modules (sales, accounting, ranking). `RegionPicker` may leave `regency` empty, and `cooperativeDb.ts:54` inserts `regency.trim()` (NOT NULL, empty string passes). *Effort: Low. Impact: Med.*

- **OB-4 — Demo seeding error leaves the dialog stuck.** `ProfileSelect.tsx:536-544` `onStart` does `await handleDemoEnter(...)` then `setSeeding(false); setSelectedTier(null)` — if `handleDemoEnter` throws, the lines after `await` never run, so `CampaignBriefingDialog` stays open with a perpetual spinner (error only surfaces in the separate `devResult` dialog). Wrap in `try/finally`. *(REVIEW-profile-select #10.)* *Effort: Low. Impact: Med.*

- **OB-5 — "Real Account" card overloads three affordances.** `ProfileSelect.tsx:276-335` — card body toggles the coop list, inner "Daftar" opens Create, and a "login" link toggles the list. The `data-login-link`/`closest()` guard (`:281`) is a symptom of the mixed metaphor. *(REVIEW-profile-select #6/#8.)* *Effort: Med. Impact: Med.*

- **OB-6 — Lockout shows no countdown / no recovery path.** Generic error string; user doesn't know *when* they can retry, and (per OB-1) has no alternate route. *Effort: Low. Impact: Med.*

- **OB-7 — No first-run guidance.** After create, the user lands on the Dashboard with no welcome/tour, despite the "Mulai dengan 5 Poin" reward badge implying progression. *Effort: Med. Impact: Med.*

### 3.3 PROFILE LOADING (active coop + live data into the shell)

- **PL-1 — `ewsAlerts` and `memberCount` are never loaded.** `App.tsx:78-79` initialize `useState([])` / `useState(0)` with the setters prefixed `_` (unused), and **no code anywhere** populates them (verified: only `App.tsx` and `Sidebar.tsx` reference them; `ews_alerts`/`members` COUNT is queried nowhere). The Sidebar therefore **permanently shows 0 members and no critical-alert badge** (`Sidebar.tsx:90,277`) even though the DB may hold data. The shell advertises live data it doesn't show. *Effort: Low. Impact: High.* ← top fix.

- **PL-3 — "Profile loading" stops at the cooperative row.** Even the `main` load effect (`App.tsx:155-174`) only re-fetches the `cooperatives` row (for `xp`/`health_score`). EWS, member count, and (per PL-1) anything else the shell needs are not part of profile loading. *Effort: Low–Med. Impact: High.*

- **PL-2 — No auto-resume (same as ST-1).** Profile loading starts from zero every launch.

- **PL-4 — `currentUser` never persisted.** `App.tsx:64` `currentUser` is only set during sign-in/create. On reload it's `null`; combined with ST-1 the whole session is lost. Any "remember me" needs `currentUser` persistence (or a lightweight trusted re-auth). *Effort: Med. Impact: Med.*

- **PL-6 — `getActiveCoopId()` magic default `"kdp-001"`.** `src/db/active-coop.ts:3` returns `"kdp-001"` when nothing is stored. Used by `useMembers`, `useSales`, `useAccounting`, `useSync`, `useUnits`, `CreateEvent` (`App.tsx:389`). If `coopProfile` is ever null, these hooks silently query a non-existent coop → empty screens with no error. *Effort: Low. Impact: Med.*

- **PL-5 — No loading state when switching profile.** `handleSwitchProfile` (`App.tsx:191-195`) resets `coopProfile` and jumps to `profile_select`; acceptable, but the re-select → re-PIN → re-load cycle has no cached shortcut. (Covered by ST-1.)

---

## 4. Roadmap to 10/10 — Prioritized by **Lowest Effort → Highest Impact**

| # | ID | Fix | Effort | Impact | Aspect win |
|---|----|-----|:------:|:------:|------------|
| 1 | **PL-1** | In `App.tsx` `main` effect, query `SELECT COUNT(*) FROM members WHERE cooperative_id=?` and `SELECT * FROM ews_alerts WHERE cooperative_id=? AND is_active=1`; wire to `setEwsAlerts`/`setMemberCount` (rename the `_` setters). | Low | **High** | Correctness, Data Integrity |
| 2 | **ST-1** | At `App.tsx` mount, read `localStorage["pakde-active-profile-id"]`; if present, `getCooperativeById` → set `coopProfile` + jump straight to `main` (demo → auto-login; real → `user_signin`). Add a visible "switch profile" affordance. | Med | **High** | First-run UX, Persistence |
| 3 | **OB-1** | Add a "Lupa PIN?" flow in `UserSignIn`: if `recovery_question` set, challenge `recovery_answer_hash`; else link to contact/admin. Surfaces the already-stored data. | Med | **High** | Security, Correctness |
| 4 | **PL-6** | Change `getActiveCoopId()` to throw / return `null` when unset; guard callers or pass `coopProfile.id` explicitly (already done at `App.tsx:389`). Removes silent empty-state lies. | Low | Med | Correctness, Data Integrity |
| 5 | **OB-3** | Require `regency` (and ideally `address`) in `isValid`; disable "Mulai Kelola" until a full region is picked via `RegionPicker`. | Low | Med | Data Integrity, First-run UX |
| 6 | **OB-6** | Show lockout remaining time (`locked_until - now`) + recovery CTA in `UserSignIn` error. | Low | Med | Security, UX |
| 7 | **OB-4** | Wrap `handleDemoEnter` call in `try/finally` so `setSeeding(false)` + `setSelectedTier(null)` always run. | Low | Med | Correctness, Maintainability |
| 8 | **ST-2** | Memoize `getDb()` with a module-level `Promise` (same pattern as `initDb`'s `dbInitPromise`). | Low | Med | Performance, Maintainability |
| 9 | **OB-2** | Either persist `emblem` → `logo_path` in `createCooperative`, or remove the picker. Pick one. | Low | Low–Med | Visual Polish, Correctness |
| 10 | **PL-4** | Persist a trusted session token (e.g., `localStorage["pakde-session-user-id"]`) and re-hydrate `currentUser` via `getUserById` on boot (tie to ST-1). | Med | Med | Persistence, First-run UX |
| 11 | **OB-5** | Split the "Real Account" card into explicit "Masuk" and "Daftar" actions (or convert sub-views to a single `View` union — REVIEW-profile-select #6). | Med | Med | First-run UX, Maintainability |
| 12 | **OB-7** | Add a one-time first-run tour / checklist card on the Dashboard (`ProfileCompletion` already exists — extend it). | Med | Med | First-run UX |
| 13 | **ST-5** | Resume audio once on first gesture (flag `audioResumed`); stop calling `resume()` on every click. | Low | Low–Med | Performance, Polish |
| 14 | **ST-3** | Replace destructive `DROP` versioning with additive `ALTER TABLE`/backfill migrations (or at minimum, export a `.sqlite` backup before wipe). | High | **High** | Data Integrity (ship-blocker) |
| 15 | **ST-4** | During `initDb`, show a dedicated boot overlay (title + progress) instead of dimmed cards. | Low | Low | Visual Polish |

### What "10/10" requires
- **Must-fix (blockers to a great score):** PL-1, ST-1, OB-1, ST-3. These cover "the shell lies about live data," "every launch is a cold start," "locked-out users are stuck," and "a schema change nukes everything."
- **Quick wins that move the needle most per hour:** PL-1 (1 change, highest visible correctness gain), PL-6 (1-line default change), OB-4 + ST-2 + OB-3 + OB-6 + ST-5 (all Low effort, each removes a real defect).
- After items 1–13 land, the three areas each clear ~9/10. Item 14 (ST-3) is the only remaining architectural gap and is gated on shipping.

---

## 5. Verification Notes (for the implementer)

- **PL-1 proof:** grep confirms `ewsAlerts`/`memberCount` only touched at `App.tsx:78-79,351-352` and `Sidebar.tsx:36-37,79-80,90,277`; no `SELECT` populates them.
- **ST-1 proof:** `App.tsx:60` hardcodes `"profile_select"`; `pakde-active-profile-id` written at `:167,:242` but only read at `:159` (inside `main`, unreachable pre-select).
- **OB-1 proof:** `recovery_answer_hash` written at `userDb.ts:25,37`; read **nowhere** (grep returns only write sites + type decls).
- **ST-3 proof:** `src/db/init.ts:64-74` unconditional `DROP TABLE` on version change.

*Files to edit for the top 3 fixes:* `src/App.tsx` (PL-1, ST-1, PL-6 caller), `src/db/active-coop.ts` (PL-6), `src/features/System/ProfileSelect/UserSignIn.tsx` (OB-1, OB-6), `src/db/init.ts` (ST-3).
