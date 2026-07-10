# Ranking Leaderboard Redesign — Implementation Plan

**Status:** Planned (not yet implemented)
**Target file:** `src/features/Finance/Ranking/Ranking.tsx`
**Goal:** Convert the current full-width spreadsheet-style leaderboard into a 10/10 gamified dashboard by introducing a left-side **Podium Hero Panel** and constraining the table into a balanced two-column layout.

---

## 1. Problem Statement

The current leaderboard (`src/features/Finance/Ranking/Ranking.tsx`) renders inside the screen's root `<div className="flex-1 overflow-auto space-y-4">` with **no max-width**. The result:

- The data table stretches to the full content width — rows feel sparse and the score column floats far from the name.
- The top 3 winning cooperatives are only distinguished by a 4px medal glyph in the `#` column. There is no podium, no avatar/profile, and no celebration of winners.
- No score visualization (bare `94%` text), no motion, and no tie-in to the broader gamification loop (XP / badges / Leveling).

**Current gamified-dashboard score: ~2.8/10.**

### Known bug to fix alongside this work
`rankMedal()` (`Ranking.tsx:45-50`) returns a **gold** icon for both rank 1 **and** rank 3 — bronze is missing. Third place incorrectly reads as champion.

---

## 2. Direction (validated)

Two-column split — **left = podium + winner profiles, right = ranked list**. This is the proven leaderboard pattern (Duolingo, Strava, sports apps) and directly resolves the width complaint by constraining the table. Refinements:

- **Podium = top 3 only.** Showing 10 full profiles on the left would recreate the table we are escaping. Use a compact "honorable mentions" strip for ranks 4–5.
- **Scope-reactive.** Podium must re-animate when the user switches `kabupaten` / `provinsi` / `nasional`.

---

## 3. Target Layout

```
<main>  (add max-w-[1120px] mx-auto to the ranking view wrapper)
  ├─ Status / connectivity banner        (unchanged)
  ├─ 3 scope summary cards               (unchanged)
       └─ grid lg:grid-cols-[42fr_58fr] gap-6
        ├─ LEFT  (42%)  → <Podium />  (NEW)
        └─ RIGHT (58%)  → Ranked list card (upgraded Table)
```

On `lg` and below, fall back to a single column (podium on top, list below).

**Integration with the existing tabs (resolves the structural question):** keep both existing tab sets exactly as they are today — the metric `Tabs` (health / growth / membership / impact) wraps the scope `Tabs` (kabupaten / provinsi / nasional), and each scope `TabsContent` currently renders `renderTable(items)`. The two-column grid **replaces that single `renderTable` call inside each scope `TabsContent`**. Concretely, inside every `TabsContent` for scope `sc`, render:

```
<div className="grid lg:grid-cols-[42fr_58fr] gap-6">
  <Podium items={boards[sc][metric].items} ourRank={boards[sc][metric].ourRank} scope={sc} metric={metric} />
  {renderTable(boards[sc][metric].items)}   {/* upgraded in §4.3 */}
</div>
```

The podium is therefore always scoped to the **active scope + active metric**, and it re-mounts for free whenever either tab flips (see §4.4) — no new state plumbing required. The three scope summary cards at the top stay as-is.

### 3.1 — ASCII wireframe (target)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ● LIVE · updated 2m ago            [↻ Refresh]        [⤒ Submit Stats]         │  status banner
├──────────────────────────────────────────────────────────────────────────────┤
│  KABUPATEN        PROVINSI         NASIONAL                                           │  3 scope cards
│   #3 / 20          #2 / 14          #5 / 20                                            │
├───────────────────────────────────┬──────────────────────────────────────────────┤
│  PODIUM HERO PANEL  (left 42%)      │  RANKED LIST  (right 58%)                       │
│                                      │                                                  │
│      ┌─────┐   ┌─────┐   ┌─────┐     │  #   COOPERATIVE              SCORE   RAG  ▲▼    │
│      │ 2nd │   │ 1st │   │ 3rd │     │ ─────────────────────────────────────────────  │
│      │ 🥈  │   │ 🥇  │   │ 🥉  │     │  1  KUD Sumber Makmur    ▓▓▓▓▓▓▓▓ 94  Hijau ▲   │  promotion
│      │ KSU │   │ KUD │   │ KOP │     │  2  KSU Guyub Rukun      ▓▓▓▓▓▓▓░ 91  Hijau ▲   │  zone tint
│      │G.Ruk│   │S.Mak│   │ Tani│     │  3  Koperasi Tani Jaya  ▓▓▓▓▓▓▓░ 88  Hijau ▼   │
│      │ 91  │   │ 94  │   │ 88  │     │ ─────────────────────────────────────────────  │
│      └─────┘   └─────┘   └─────┘     │  4  KSP Mitra Usaha     ▓▓▓▓▓▓▓░ 85  Hijau ▲   │
│        ╲ glow ╱  ★radial             │  5  KUD Tani Subur      ▓▓▓▓▓▓▓░ 82  Hijau ▼   │
│         ╲___╱  behind #1             │  6  KSU Bina Sej.       ▓▓▓▓▓▓░░ 79  Hijau ▲   │
│                                      │  7  KSU Mapan           ▓▓▓▓▓▓░░ 76  Kuning ▼  │
│   ┌──────────────────────────┐       │  ·  ·  (scroll, top 10)  ·  ·  ·  ·  ·  ·  ·   │
│   │ YOUR POSITION  #7 / 20    │       │  ⋯                                                  │
│   │ 12 pts from the podium ▮→ │       │  [ see all 20 ]                                     │
│   └──────────────────────────┘       │                                                  │
│   honorable: 4th ▮ KSP Mitra  5th ▮… │                                                  │
└───────────────────────────────────┴──────────────────────────────────────────────┘

  legend: ▓ = score bar fill (width = score%)   ▲▼ = trend   ★ = glow behind champion
```

Stacked (mobile / `< lg`) layout = podium block on top, then the ranked list below it.

---

## 4. Implementation Steps

### 4.1 — Width guard (root cause of "table too big")
In `Ranking.tsx`, the root `<div className="flex-1 overflow-auto space-y-4">` stays as the scroll surface, but its **inner** content is wrapped so the cap is stable and centering never fights the scroll container:
- Keep `overflow-auto` on the outer root div.
- Insert an inner wrapper `<div className="max-w-[1120px] mx-auto space-y-4">` as the direct child, moving all existing children (status banner, scope cards, metric+scope tabs) inside it.
This keeps the table from stretching on wide screens and gives the two-column grid (`lg:grid-cols-[42fr_58fr]`, see §4.3) a stable reference width. (Do **not** put `max-w`+`mx-auto` on the same element as `overflow-auto` — `mx-auto` cannot center under scroll overflow.)

### 4.2 — New `Podium.tsx` component (left column)
Props: `items: RankedCoop[]` (the *current scope+metric* leaderboard), `ourRank: number | null` (from `boards[scope][metric].ourRank`), `scope: RankingScope`, `metric: RankingMetric`.

> **Metric-scoping note:** `useRanking` only pre-computes `ourRank` for the `health` metric, but the screen lets the user switch metrics. Do **not** reuse that memo — always read `ourRank` directly from `boards[scope][metric].ourRank` (it exists per `Leaderboard`) and derive `ourScore` from `items.find(i => i.isOurs)?.score` so the podium stays correct on every metric tab.

- Layout: classic **2-1-3** podium — rank 2 (left) / rank 1 (center, tallest) / rank 3 (right).
- Each podium card:
  - Gold / silver / bronze **gradient ring** (`bg-warning`, `slate-300`, bronze tone).
  - **Avatar / crest circle**: deterministic monogram derived from `name`, on a tinted circular badge (no new image assets required). Use the **first two words' initials** (e.g. `KUD Sumber Makmur` → `KS`, `KSU Guyub Rukun` → `KG`) so Indonesian prefixes like `KUD`/`KSU`/`Koperasi` don't collide into identical avatars. Cache nothing — it's a pure function of `name`.
  - `name`, `village`, **animated count-up score** (CSS/keyframe or lightweight `requestAnimationFrame`), RAG chip, trend icon.
  - Subtle **radial glow** behind rank 1.
  - **Micro-animation:** a 1-shot confetti / particle burst on mount. Implement with **pure CSS keyframes** (absolutely-positioned spans translated + faded over ~700ms, then `display:none` via `animationend`), gated behind a single `mounted` state so the effect fires once per mount. No new dependency. If the CSS-only burst proves visually weak, the accepted fallback is a single inline `<canvas>` particle loop with `requestAnimationFrame` and cleanup on unmount — still zero deps.
  - **"Your Position" card** (pinned beneath podium) when `ourRank` is outside top 3:
  - `total` = `items.length`. `ourScore` = `items.find(i => i.isOurs)?.score ?? 0`. Shows `#ourRank`, `total`, and **"X pts from the podium"** gap computed as `podium[2].score - ourScore` to create stakes/motivation. **Guard:** only compute the gap when `podium.length >= 3` (a board with fewer than 3 coops must never index `podium[2]`). (When `isOurs` is absent from `items`, hide this card rather than showing a bogus gap.)
- **Honorable mentions strip:** ranks 4–5 as two slim rows (avatar + name + score bar).

### 4.3 — Upgrade the ranked list (right column)
Keep `renderTable` but:
- Add an **inline score bar** inside the Score cell (`score%` rendered as a horizontal fill bar, e.g. `bg-success` width = `score%`) so gaps are scannable at a glance.
- Cap visible rows in a **fixed-height scroll area** with `max-h-[460px] overflow-y-auto` (top 10 + "see all" expander) so the right column height balances the podium (top-3 + our-position + 4–5 honorable ≈ same height). The `max-h` value is a starting reference and should be nudged during implementation so the two columns align without leaving the right column short.
- Add **promotion / relegation bands**: tint the top-3 rows as "Promotion Zone" to add narrative.
- **Fix the bronze medal bug:** `rank === 3` → bronze tone (e.g. `text-amber-700 bg-amber-700/10`), distinct from gold.

### 4.4 — Scope-reactivity
Because the grid lives inside `TabsContent`, switching the **scope** tab unmounts/remounts `Podium` automatically — the confetti fires and the podium re-animates with zero extra wiring. **Also key `Podium` on `metric`** (`key={`${scope}-${metric}`}`) so a metric switch triggers the same re-mount/animation; `boards[scope][metric].items` already drives everything, so no service change is needed.

### 4.5 — Gamification loop tie-in (DEFERRED — not in this pass)
> **Reality check:** the repo has **no** Leveling/XP/badge engine today (verified across `src/features/Finance`). This section is therefore a *future* seam, **not** part of the current implementation. It is documented here so the podium is built with the right extension point, but no toast/badge/state work is done now.

- **Future seam:** when a Leveling/XP engine lands, `Podium` can track previous `ourRank` per `scope`+`metric` (e.g. `useRef<Record<string, number|null>>`) and flash a "promoted" toast when `ourRank` improves. Keep that logic inside `Podium.tsx` (or a `useRankProgress` hook) — do **not** modify `useRanking.ts` or `rankingService.ts`.

---

## 5. Data Model (no changes required)

`RankedCoop` already provides everything needed:

```ts
interface RankedCoop {
  rank: number;
  name: string;
  village: string;
  score: number;
  ragStatus: string;
  trend: "up" | "down" | "stable";
  isOurs: boolean;
}
```

No backend / service edits. `MockRankingService` output is sufficient for the podium, avatar monogram, score bar, and gap calculation.

---

## 6. Files Touched

| File | Change |
|---|---|
| `src/features/Finance/Ranking/Ranking.tsx` | Add width guard; replace single-card block with two-column grid; fix bronze medal; add score bar + bands; mount `<Podium />` |
| `src/features/Finance/Ranking/Podium.tsx` | **NEW** — podium hero panel (left column) |
| `src/features/Finance/Ranking/Ranking.css` | Podio glow / confetti keyframes, count-up helper if needed |

No changes to `rankingService.ts` or `useRanking.ts`. i18n: reuse existing `ranking.*` namespaces and **add** these keys (so the translation ticket is complete):
- `ranking.podium.title`
- `ranking.podium.yourPosition`
- `ranking.podium.gapFromPodium` (interpolates `points`)
- `ranking.podium.honorableMentions`
- `ranking.podium.promotionZone`

---

## 7. Acceptance Criteria

- [ ] Page width capped (no full-bleed table on wide screens).
- [ ] Top 3 winners shown in a dedicated podium with avatar, score, RAG, trend, and glow.
- [ ] "Our coop" shown with a clear gap-to-podium message when outside top 3.
- [ ] Right-column list has visible score bars and promotion-zone tint; capped/scrollable (`max-h` tuned so it balances the podium height).
- [ ] Bronze medal renders correctly for rank 3.
- [ ] Podium re-animates on scope switch.
- [ ] No new runtime dependencies introduced.
- [ ] `pnpm lint` + `pnpm build` pass.

---

## 8. Out of Scope (this pass)

- Real cooperative logos / crests (monogram placeholder used).
- Federated ranking service swap (unchanged — `MockRankingService` stays).
- Participation-page leaderboard (`Participation.tsx`) — separate, smaller widget; not part of this redesign.
