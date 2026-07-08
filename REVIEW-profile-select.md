# Review: Title / Profile Selection Screen

**Scope:** `src/features/System/ProfileSelect/*`, `src/App.tsx`, `src/db/seed-demo.ts`, `src/db/init.ts`
**Date:** 2026-07-09
**Reviewer:** Senior Implementation Engineer

## Score: 6.5 / 10

Solid feature completeness and good visual polish, but the state model and a few
dead/misleading data paths drag it down. The *happy path* works; the *edge cases
and secondary flows* are where it leaks.

---

## Data Flow — workable, with real leaks

### What's good
- Clean separation: `cooperativeDb` / `userDb` / `seed-demo` are focused modules.
  `createCooperative` is the single write path for both "Create" and "Join"
  (Join just clones a mock → `createCooperative`). No duplicate writers.
- `is_demo` flag cleanly partitions demo vs real coops; `listCooperatives`
  correctly filters it out.
- Demo auto-login (`isDemoCooperative` → skip PIN) is a sensible shortcut.

### Issues

1. **`emblem` selection is dead UI**
   (`CreateProfileDialog.tsx:177-197`, `handleLaunch` 84-108; schema `init.ts:43`
   has `logo_path`). The UI lets the user pick an emblem, but
   `CreateCooperativeInput` has no `emblem` field and `handleLaunch` never passes
   it → silently discarded on every create. Either persist it or remove the picker.

2. **Raw DB `id` (UUID) shown as a badge**
   (`CooperativeCardList.tsx:65-67`). Leaks an internal UUID to the user as a
   "badge." Should show something meaningful (or nothing). User-facing noise.

3. **Demo re-seed always wipes prior demo data with no warning**
   (`seed-demo.ts:46` → `clearDemoCooperative`). Every tier pick nukes all demo
   transactions/journal/inventory. A user who played a demo and re-enters loses
   everything, silently. `localStorage.setItem("pakde-demo-tier", level)` is
   written (`ProfileSelect.tsx:158`) but **never read** — dead state.

4. **`seedDemoCoaAccounts` guard is dead**
   (`seed-demo.ts:136-140`). Checks `existing.length > 0` to skip, but
   `clearDemoCooperative()` (called first) already deleted all COA rows, so the
   guard never fires. Harmless but indicates clear/seed ordering wasn't thought
   through.

5. **Unknown unit labels render blank chips**
   (`CooperativeCardList.tsx:113-126`). `unit_apotek` / `unit_pemasaran` (used by
   demo seeds) fall through to an empty `label` → invisible chips. Dead label enum.

---

## Interaction Architecture — fragile

### What's good
- Escape-to-quit and per-view Escape handling show intent to be keyboard-friendly.

### Issues

6. **Sub-view state is 4 independent booleans that must manually reset each other**
   (`ProfileSelect.tsx:64-68`, e.g. lines 261-262, 326-327):
   `showCoopList`, `showDemoTiers`, `showJoinExisting`, `showCreateModal`. This is
   an implicit "exactly one active sub-view" modeled as 4 flags. Nothing prevents
   two being true. A discriminated union —
   `type View = "hero" | "coopList" | "demo" | "join" | "create"` — would make
   "only one open" structurally guaranteed and delete ~6 lines of `setShowX(false)`
   noise per click handler.

7. **Escape handling relies on React effect-registration order** *(most fragile)*
   (`ProfileSelect.tsx:97-115` capture listener + `JoinExistingCoop.tsx:112-127`
   + `App.tsx:136-163`). Three global `keydown` listeners on `document`,
   coordinated only by `e.stopImmediatePropagation()` and the hope that the child's
   capture listener registers *before* App's. If a refactor reorders mount or
   parent/child effect timing changes, the Quit dialog fires when it shouldn't (or
   vice-versa). Recommend a single Escape coordinator (e.g., pass an `onRequestExit`
   down, or a small navigation-stack in `App.tsx`).

8. **The "Real Account" card overloads three affordances**
   (`ProfileSelect.tsx:252-311`): the card body toggles the coop list, an inner
   "Daftar" button opens Create, and a "login" link toggles the list. A single
   card is simultaneously a "Masuk" trigger and a "Daftar" CTA. Mixed metaphor →
   unpredictable clicks (the `data-login-link`/closest guard at line 257 is a
   symptom).

9. **`handleUserInteraction` resumes audio on *every* click**
   (`ProfileSelect.tsx:117-120, 180`). Calls `bgMusic.resume()` on every single
   click across the whole screen, including the background `div` `onClick`. At
   minimum wasteful; potential to restart/stutter audio. Should resume once on first
   gesture, not on every interaction.

10. **Demo seed error leaves the dialog stuck**
    (`ProfileSelect.tsx:516-521`). `onStart` does
    `await handleDemoEnter(...)` then `setSeeding(false); setSelectedTier(null)` —
    but if `handleDemoEnter` throws, the lines after `await` never run, so the
    briefing dialog stays open with a perpetual spinner (the error is only shown in
    the separate `devResult` dialog). Wrap in try/finally.

11. **No way to delete/remove a profile** from the selection screen. Once created, a
    coop is permanent unless the DB is wiped. Minor, but expected on a "profile
    selection" screen.

12. **"Join" is really "create from mock template," not a join**
    (`JoinExistingCoop.tsx:82` → `createCooperative`). The registration code is only
    a static gate against `MOCK_ONLINE_COOPS[i].registrationCode`; no link to the
    "online" coop is stored. Fine for an offline mock, but the naming/IA implies a
    network relationship that doesn't exist. Worth a comment so future devs don't
    assume a sync relationship.

---

## Top fixes by priority

| # | Issue | Effort | Impact |
|---|-------|--------|--------|
| 6 | Convert sub-view booleans to a single `View` union | Low | Kills "two panels open" bug class |
| 7 | Centralize Escape handling | Med | Removes fragile listener ordering |
| 1 | Persist or remove emblem | Low | Removes dead UI |
| 10 | `try/finally` around demo seeding | Low | Unblocks stuck dialog |
| 2 / 3 / 9 | Raw id badge, demo-wipe warning, audio-resume-once | Low | Polish + correctness |

> **Biggest architectural win:** issues #6 + #7 together. They convert an implicit,
> order-dependent state machine (4 booleans + 3 competing global key listeners)
> into an explicit, structurally-safe one. Lowest risk, highest leverage.
