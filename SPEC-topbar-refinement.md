# Top Bar & Beranda Layout Refinement

**Branch:** `feature/topbar-refinement`
**Status:** Plan (approved to implement)

## Goal

Make Beranda feel like a focused command center instead of a full-width
dashboard, and align the global TopBar's settings zone to a fixed right rail so
it visually "owns" the same horizontal band as the Beranda **Berita** column.

Confirmed decisions:
- **"Rata-rata SHU"** = `SHU bersih ÷ jumlah anggota aktif` (IDR per member).
- **TopBar settings zone alignment** = a single shared fixed-width **right rail**
  token, referenced by both the TopBar settings cluster and the Berita column.
  No per-tab layout coupling: the TopBar stays a global component; it just
  reserves a right-rail-width block on its right side.

---

## ASCII Drafts

### Current layout (before)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TopBar (global, full width)                                               │
│  [💰 NetWorth]│[🔥 Liveliness]│[⚠ Alerts] …………………… [⚙ 🌙 ☁] [👤 user] [⇆ ✕] │
├──────────────────────────────────────────────────────────────────────────┤
│ CampaignStrip — FULL WIDTH illustrated/animated kopdes scene              │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │  tier track + RPG dialogue / crowd scene (too wide, heavy)          │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│ DnD 12-col grid (reorderable):                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│ │mainquest │ │ tugas    │ │ calendar │ │  news    │  ← all equal width  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Target layout (after)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TopBar (global)                                                            │
│  ┌── vitals cluster (left, grows to calendar right edge) ──────────────┐  │
│  │ [💰 NetWorth]│[🔥 Liveliness]│[⚠ Alerts]│[📊 Rata-rata SHU]      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                     ┌─ right rail (fixed) ┐ │
│                                                     │ [⚙ 🌙 ☁][👤][⇆ ✕] │ │
│                                                     └─────────────────────┘ │
├───────────────────────────────────────────┬──────────────────────────────┤
│ CampaignStrip — 3-COL WIDTH ONLY            │ Berita (right rail, full    │
│ (illustrated/animated scene, no longer      │ height, rises to top)       │
│ full-width — capped to campaign cols)       │ ┌────────────────────────┐  │
│ ┌────────┐ ┌────────┐ ┌────────┐            │ │ news card (tall)       │  │
│ │mainquest│ │ tugas  │ │calendar│  ← fixed  │ │                        │  │
│ └────────┘ └────────┘ └────────┘  3-col row │ │                        │  │
│                                            │ │                        │  │
│                                            │ └────────────────────────┘  │
└───────────────────────────────────────────┴──────────────────────────────┘
```

Notes:
- The **vitals cluster** (left) fills horizontally up to the *left edge of the
  right rail* (i.e. the right edge of the calendar column). Vitals are evenly
  distributed within that space.
- The **right rail** is a fixed width (e.g. `w-[360px]`) used by BOTH the TopBar
  settings cluster and the Berita column, so they line up vertically.
- The **CampaignStrip** is capped to the 3-column campaign width (it no longer
  stretches full-width).
- **No drag-and-drop.** Card order is fixed: mainquest → tugas → calendar → news.

---

## Changes by file

### 1. `src/features/System/ProfileSelect/cooperativeDb.ts`
- Add `avgShu: number` to `TopBarStats`.
- In `getTopBarStats()`: compute `shuBersih` (net surplus) and divide by active
  member count. Reuse the existing COA read (`getNetWorth` sibling path) for
  revenue/expense, and `getCoopMemberCount()` for the denominator. Return
  `avgShu`. (One extra cheap query; parallelize with the existing `Promise.all`.)

  Implementation detail: add a small `getNetShu(cooperativeId)` helper that reads
  `pendapatan`/`beban` account balances (mirrors `getNetWorth`'s COA read) and
  applies `shuBersih = (revenue - expense) * 0.9`. Then
  `avgShu = memberCount > 0 ? shuBersih / memberCount : 0`.

### 2. `src/features/System/TopBar.tsx`
- Add a **right-rail-width** constant for the settings cluster container, e.g.
  wrap the existing utility-controls `<div>` in a `w-[360px] shrink-0`
  block (shared token — keep in sync with the Berita column width; define the
  literal once at top of file as `const RIGHT_RAIL_W = "w-[360px]"`).
- Visually **separate** the vitals cluster from settings: keep a divider gap;
  the vitals cluster uses `flex-1` so it grows to the right-rail's left edge.
- Add the **"Rata-rata SHU"** vital (4th stat slot) with icon `ChartBar` (or
  `Coins` variant). Use `idr.format(topStats.avgShu)` and label
  `t("topbar.avgShu")`. Insert it after the Alerts slot, before the right rail.
- Distribute vitals uniformly: the left cluster is `flex items-center gap-1`
  with `flex-1`; each stat slot already `shrink-0`. To make them "occupy
  uniformly", wrap the cluster in `flex-1 justify-between` (or give each slot
  `flex-1` with centered content) so they spread across to the calendar edge.

### 3. `src/features/Home/Dashboard/Dashboard.tsx`
- **Remove DnD**: delete `DndContext`, `SortableContext`, `useSortable`,
  `SortableCard`, `useCardOrder`, and the `@dnd-kit/*` imports. Render cards in
  fixed order `['mainquest','tugas','calendar','news']`.
- Replace the single 12-col DnD grid with a **two-region layout**:
  - Region A (campaign row): `grid grid-cols-3 gap-4` holding mainquest, tugas,
    calendar. Capped width (not full-bleed) — wrap in a container that does not
    span the right rail.
  - Region B (right rail): the `"news"` card placed in a `w-[360px] shrink-0`
    column that spans the full height of Region A (so it "moves upward").
  - Use a flex row: `<div className="flex gap-4">` → left `flex-1` (campaign
    grid) + right `w-[360px] shrink-0` (news).
- Keep `cardContents` map; render without sortable wrappers.

### 4. `src/features/Home/Dashboard/CampaignStrip.tsx`
- Cap width to the 3-column campaign area. The strip should no longer be
  `w-full`. Easiest: leave `CampaignStrip` as-is internally but the parent
  (`Dashboard.tsx`) places it inside the `flex-1` left region (not full width).
  No internal change required unless we want to reduce the illustrated scene
  scale — out of scope; just constrain via parent width. (Verify the scene
  looks acceptable at ~3-col width; if too tall, reduce `KopdesBuilding` size
  via its existing `className` prop.)

### 5. i18n — `src/i18n/locales/{id,en}.json`
- Add under `"topbar"`:
  - `id`: `"avgShu": "Rata-rata SHU"`
  - `en`: `"avgShu": "Avg SHU"`
  - Add `avgShuDesc` tooltip strings (id/en) describing "SHU bersih per anggota".

---

## Out of scope
- No change to the animated campaign scene internals (only its container width).
- No change to other tabs' TopBar behavior (global component unchanged in API).
- Version files untouched (no release).

## Verification
1. `pnpm check` passes (lint + tsc + prettier).
2. `pnpm build` succeeds.
3. Manual: on `home` tab, vitals cluster (4 stats) spans to calendar right edge;
   settings cluster aligns with Berita column right edge; Berita column is tall
   and top-aligned; CampaignStrip is ~3-col wide; no drag handles on cards.
4. Other tabs (e.g. `anggota`, `settings`) still render the TopBar correctly
   with the right-rail settings block.
