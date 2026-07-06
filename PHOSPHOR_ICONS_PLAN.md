# Phosphor Icons Migration Plan

Replace `lucide-react` with `@phosphor-icons/react` across the entire PAKDE codebase.

---

## Why Phosphor?

| Dimension | Lucide | Phosphor |
|-----------|--------|----------|
| Icon count | ~1,000 | **1,248+** |
| Weights | 1 (single stroke) | **6** (Thin, Light, Regular, Bold, Fill, Duotone) |
| Design size | 24×24 | **16×16** — reads better at our `h-3 w-3`/`h-3.5` sizes |
| Consistency | Variable stroke widths | Uniform 16px grid, all icons same optical weight |
| Tree-shaking | ✅ | ✅ |
| Bundle impact | Similar | Similar |
| License | ISC | MIT |

The **6-weight system** is the killer feature. With lucide we had one visual weight for everything. With Phosphor we can use `Bold` for navigation/section headers and `Regular` for inline content — creating visual hierarchy without changing icon sets.

---

## Weight Decision

| Context | Phosphor Weight | Rationale |
|---------|----------------|-----------|
| Sidebar nav icons | **Bold** | Navigation needs visual weight to anchor the page |
| Feature page headers | **Bold** | Section titles need presence |
| Action buttons (primary) | **Bold** | Save, Create, Delete — need to pop |
| Toast icons | **Bold** | Error/warning/success need visibility |
| Inline form field icons | **Regular** | Subtle companions to input labels |
| Card content icons | **Regular** | Supporting visual, not primary |
| List item indicators | **Regular** | Small dots, checks, arrows |
| Toolbar tool icons | **Bold** | Store Layout canvas tools need clarity |
| Template picker icons | **Regular** | Cards already have visual weight |
| Table cell icons | **Regular** | Dense data, avoid visual noise |

**Rule of thumb:** If the icon is the ONLY visual element in a button or label, use Bold. If it's accompanying text, use Regular.

---

## Complete Migration Map

Each lucide icon mapped to its Phosphor equivalent with weight.

### Direct Matches (same name in both libraries)

| Lucide | Phosphor | Files |
|--------|----------|-------|
| `ArrowLeft` | ArrowLeft · Regular | StoreLayout, CreateEvent, Learn |
| `ArrowRight` | ArrowRight · Regular | Learn |
| `MapPin` | MapPin · Bold/Regular | Sidebar(B), StoreLayout(B), CreateEvent(R), DashboardCalendar(R), ProfileSelect(R) |
| `Calendar` | Calendar · Regular | Participation, AccountingJournal |
| `CalendarPlus` | CalendarPlus · Bold | Sidebar, CreateEvent |
| `CalendarDays` | CalendarDays · Regular | CreateEvent, DashboardCalendar, AccountingJournal |
| `Clock` | Clock · Regular | CreateEvent, DashboardCalendar, EventTemplatePicker |
| `Users` | Users · Bold/Regular | Sidebar(B), Leveling(B), CreateEvent(R), Participation(R), Impact(R) |
| `Plus` | Plus · Regular | Dashboard, Members, Units, SalesInventory, AccountingJournal, AccountingCoa, ProfileSelect, CreateProfileDialog (R for all) |
| `X` | X · Regular | ShelfPanel, Dialog, Toast (⚠️ Toast's XCircle stays as XCircle) |
| `Check` | Check · Regular | Select |
| `Trash2` → | Trash · Regular | Members, StoreLayout, ShelfPanel, Sales, SalesInventory, AccountingJournal |
| `FileText` | FileText · Regular | SalesHistory, Planners, CreateEvent, Development |
| `Sparkles` → | Sparkle · Regular | StoreLayout, SalesInventory, Accounting, Units, CreateEvent (⚠️ no plural form) |
| `Trophy` | Trophy · Bold | Sidebar, Leveling, Ranking, Learn |
| `Medal` | Medal · Bold | Sidebar, Ranking |
| `TrendingUp` → | TrendUp · Regular | Sidebar, Accounting, Leveling, CreateEvent, EventPredictionPanels, Impact |
| `TrendingDown` → | TrendDown · Regular | Ranking |
| `Wallet` | Wallet · Bold/Regular | Sidebar(B), Accounting(B), Participation(R) |
| `ShoppingCart` | ShoppingCart · Bold/Regular | Sales(B), EventTemplates(R) |
| `Building2` → | Buildings · Bold/Regular | Sidebar(B), Leveling(B), Units(B), ProfileSelect(B), Development(B), EventTemplates(R) |
| `Shield` | Shield · Bold/Regular | Sidebar(B), ProfileSelect(R) |
| `Lock` | Lock · Regular | Leveling, Learn |
| `Star` | Star · Regular | Leveling, Ranking, Learn |
| `BookOpen` | BookOpen · Bold/Regular | Sidebar(B), Learn(B) |
| `GraduationCap` | GraduationCap · Regular | EventTemplates |
| `Leaf` | Leaf · Regular | EventTemplates, Participation, Impact |
| `Bus` | Bus · Regular | EventTemplates |
| `Stethoscope` | Stethoscope · Regular | EventTemplates |
| `Footprints` | Footprints · Regular | EventTemplates |
| `Music` → | MusicNotes · Regular | EventTemplates |
| `Play` | Play · Regular | Accounting, Development, Impact |
| `Globe` | Globe · Regular | Development |
| `Database` | Database · Regular | Development |
| `Printer` | Printer · Regular | Planners |
| `Flame` → | Fire · Bold | Participation |
| `Sun` | Sun · Bold | Sidebar |
| `Moon` | Moon · Bold | Sidebar |
| `LogOut` → | SignOut · Bold | Sidebar |
| `Power` | Power · Regular | Units |
| `Wrench` | Wrench · Bold/Regular | Sidebar(B), Equipment(B) |
| `ShieldCheck` | ShieldCheck · Bold | Leveling |
| `ShieldAlert` → | ShieldWarning · Bold | Accounting |
| `AlertTriangle` → | Warning · Bold/Regular | Sidebar(B), Statistics(R), Development(B), DbError(B), Toast(B) |
| `Info` | Info · Regular | Statistics, SalesHistory, Feasibility |
| `Activity` | Activity · Regular | Units, Impact, Development |
| `CreditCard` | CreditCard · Regular | Sales |
| `Package` | Package · Regular | Sales, SalesInventory |
| `Minus` | Minus · Regular | ShelfPanel, Ranking |
| `MinusCircle` | MinusCircle · Regular | Sales |
| `PlusCircle` | PlusCircle · Regular | Sales |
| `Lightbulb` | Lightbulb · Regular | CreateEvent |
| `CheckSquare` | CheckSquare · Regular | Accounting, CreateEvent, Participation |
| `Square` | Square · Bold | LayoutCanvas |
| `Eraser` | Eraser · Bold | LayoutCanvas |
| `Coins` | Coins · Bold | EventPredictionPanels |
| `ListChecks` | ListChecks · Bold | EventPredictionPanels |
| `CheckCircle2` → | CheckCircle · Regular/Bold | Dashboard(R), Leveling(R), Impact(R), Learn(R), Development(R), Toast(B) |
| `Circle` | Circle · Regular | Dashboard |
| `XCircle` | XCircle · Bold | Toast |
| `Newspaper` | Newspaper · Regular | Dashboard |
| `Search` → | MagnifyingGlass · Regular | Members, Sales |
| `Bell` → | Bell · Bold | (future use — notification system) |
| `Download` → | DownloadSimple · Regular | Planners |
| `RefreshCw` → | ArrowsClockwise · Regular | Development |
| `History` → | ClockCounterClockwise · Regular | Sales, SalesHistory |
| `FileDown` → | FileArrowDown · Regular | Accounting |
| `Zap` → | Lightning · Regular | (not yet used, keep for future) |
| `Handshake` | Handshake · Regular | Sidebar (was `HeartHandshake`, simpler match) |
| `ShoppingBag` → | ShoppingBagOpen · Regular | EventTemplates |
| `Box` → | Cube · Regular | ShelfPanel, LayoutCanvas |
| `MousePointer2` → | Cursor · Bold | LayoutCanvas |
| `Edit2` → | PencilSimple · Regular | Members |
| `Volume2` → | SpeakerLow · Regular | ProfileSelect |
| `VolumeX` → | SpeakerX · Regular | ProfileSelect |
| `ZoomIn` → | MagnifyingGlassPlus · Bold | LayoutCanvas |
| `ZoomOut` → | MagnifyingGlassMinus · Bold | LayoutCanvas |
| `Maximize` → | ArrowsOut · Bold | LayoutCanvas |
| `ChevronDown` → | CaretDown · Bold/Regular | Sidebar(B), Leveling(R), Select(R) |
| `ChevronUp` → | CaretUp · Bold/Regular | Sidebar(B), Leveling(R), Select(R) |
| `ChevronLeft` → | CaretLeft · Regular | DashboardCalendar |
| `ChevronRight` → | CaretRight · Regular | Sidebar, DashboardCalendar |
| `BarChart3` → | ChartBar · Bold/Regular | Sidebar(B), Participation(B) |
| `LineChart` → | ChartLine · Bold | Sidebar |
| `Cog` → | Gear · Bold | Sidebar |
| `Settings2` → | GearSix · Regular | Accounting |
| `Grid` → | GridFour · Bold | SalesInventory |
| `List` → | List · Bold | SalesInventory |

### Near Matches / Renamed

| Lucide | Phosphor | Rationale | Files |
|--------|----------|-----------|-------|
| `LayoutDashboard` | **SquaresFour** · Bold | Closest 4-square grid layout for "dashboard" | Sidebar |
| `Receipt` | **Note** · Bold | No receipt icon; note/document is closest for accounting records | Sidebar |
| `LayoutGrid` | **GridFour** · Bold | Renamed, same concept | SalesInventory |
| `GripHorizontal` | **DotsSixVertical** · Regular | Standard drag handle pattern (rotated by parent CSS) | Dashboard |
| `UserCheck` | **UserCheck** · Bold | Same name, available in Phosphor | Sidebar |
| `CalendarCheck` | **CalendarCheck** · Regular | Same name, available in Phosphor | (future) |
| `ListTodo` → | **Checklist** · Regular | Closest match | (future) |
| `SlidersHorizontal` → | **Sliders** · Regular | Shorter name, same icon | (future) |

### Problematic — No Direct Phosphor Match

| Lucide | Best Approximation | Rationale | Files |
|--------|-------------------|-----------|-------|
| `FileSpreadsheet` | **Table** · Regular | No spreadsheet icon in Phosphor. `Table` is closest structural match for financial data grids. | EventTemplates |
| `Sprout` | **Plant** · Regular | Phosphor has no sprout/sapling. `Plant` is the closest botanical icon for growth/member activity. | Members |
| `HeartHandshake` | **Handshake** · Bold | Phosphor has `Handshake` and `Heart` as separate icons. `Handshake` alone captures the partnership/social meaning. | Sidebar, Participation, Impact |
| `Shovel` | **Hammer** · Regular | No shovel in Phosphor. `Hammer` conveys manual work/tools for gotong royong context. | EventTemplates |
| `MessageSquare` | **Chat** · Regular | Slightly different name, same concept | Impact |
| `GripVertical` | **DotsSixVertical** · Regular | Same as GripHorizontal solution | (not currently used) |

---

## Files to Migrate (32 files)

### Batch 1 — Sidebar + App Shell (4 files)
- `src/App.tsx` — no icons directly (just renders components)
- `src/features/Sidebar.tsx` — 28 icons, all Bold weight
- `src/components/ui/select.tsx` — Chevrondown, ChevronUp, Check → Regular
- `src/components/ui/dialog.tsx` — X → Regular

### Batch 2 — Dashboard + Home (2 files)
- `src/features/Home/Dashboard/Dashboard.tsx` — 5 icons, Regular
- `src/features/Home/Dashboard/DashboardCalendar.tsx` — 5 icons, Regular

### Batch 3 — Members + Community (5 files)
- `src/features/Community/Members/Members.tsx` — 5 icons, Regular
- `src/features/Community/Participation/Participation.tsx` — 8 icons, Bold + Regular
- `src/features/Community/Impact/Impact.tsx` — 8 icons, Regular
- `src/features/Community/CreateEvent/CreateEvent.tsx` — 11 icons, Bold + Regular
- `src/features/Community/CreateEvent/EventTemplatePicker.tsx` — 3 icons, Regular
- `src/features/Community/CreateEvent/EventPredictionPanels.tsx` — 4 icons, Bold

### Batch 4 — Business (6 files)
- `src/features/Business/StoreLayout/StoreLayout.tsx` — 5 icons, Regular
- `src/features/Business/StoreLayout/ShelfPanel.tsx` — 4 icons, Regular
- `src/features/Business/StoreLayout/LayoutCanvas.tsx` — 7 icons, Bold
- `src/features/Business/Sales/Sales.tsx` — 8 icons, Bold + Regular
- `src/features/Business/Sales/SalesInventory.tsx` — 6 icons, Regular
- `src/features/Business/Sales/SalesHistory.tsx` — 3 icons, Regular
- `src/features/Business/Units/Units.tsx` — 5 icons, Bold + Regular
- `src/features/Business/Equipment/Equipment.tsx` — 1 icon, Bold
- `src/features/Business/Development/Development.tsx` — 9 icons, Regular

### Batch 5 — Analytics (3 files)
- `src/features/Analytics/Leveling/Leveling.tsx` — 6 icons, Bold + Regular
- `src/features/Analytics/Ranking/Ranking.tsx` — 6 icons, Regular
- `src/features/Analytics/Statistics/Statistics.tsx` — 2 icons, Regular

### Batch 6 — Finance (4 files)
- `src/features/Finance/Accounting/index.tsx` — 8 icons, Bold + Regular
- `src/features/Finance/Accounting/AccountingJournal.tsx` — 3 icons, Regular
- `src/features/Finance/Accounting/AccountingCoa.tsx` — 1 icon, Regular
- `src/features/Finance/Feasibility/Feasibility.tsx` — 1 icon, Regular

### Batch 7 — System (4 files)
- `src/features/System/ProfileSelect/ProfileSelect.tsx` — 5 icons, Bold + Regular
- `src/features/System/ProfileSelect/CreateProfileDialog.tsx` — 1 icon, Regular
- `src/features/System/Settings/Settings.tsx` — no icons (text-only)
- `src/features/System/DbErrorScreen/DbErrorScreen.tsx` — 1 icon, Bold
- `src/hooks/useToast.tsx` — 3 icons, Bold

### Batch 8 — Education (2 files)
- `src/features/Education/Learn/Learn.tsx` — 7 icons, Regular
- `src/features/Education/Planners/Planners.tsx` — 3 icons, Regular

### Batch 9 — Data (1 file)
- `src/data/eventTemplates.ts` — 14 icons (type references only), Regular

---

## Implementation Steps

1. **Install** `@phosphor-icons/react`
   ```bash
   pnpm add @phosphor-icons/react
   ```

2. **Create icon mapping alias file** at `src/components/icons.ts` that re-exports Phosphor icons with our preferred weights, and maps our problematic cases:
   ```ts
   // Re-exports from Phosphor with our default weights
   export { ArrowLeft, MapPin, Users, Plus, X, Check, Trash, FileText, ... } from "@phosphor-icons/react";
   
   // Problematic mappings
   export { SquaresFour as LayoutDashboard } from "@phosphor-icons/react";
   export { Table as FileSpreadsheet } from "@phosphor-icons/react";
   export { Plant as Sprout } from "@phosphor-icons/react";
   export { Handshake as HeartHandshake } from "@phosphor-icons/react";
   export { Hammer as Shovel } from "@phosphor-icons/react";
   export { Chat as MessageSquare } from "@phosphor-icons/react";
   ```

   Actually, we should use Phosphor's native names everywhere (clean cut). No aliases — just fix the imports to use the correct Phosphor icon name.

3. **Migrate in batches** (order above) — each batch is a separate commit

4. **Remove** `lucide-react` from dependencies

5. **Verify** `npx tsc --noEmit` after each batch

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Phosphor icons render slightly different sizes than lucide | Low | Both use SVG with viewBox. Phosphor's 16×16 base means slightly sharper at `h-3 h-3.5` sizes. We may need minor `className` adjustments on a few icons. |
| Missing icon causes compile error | Low | All 79 icons have been mapped. 6 problematic ones have chosen approximations documented above. |
| Bundle size increase | Very Low | Both are tree-shakable. Phosphor may actually be slightly smaller due to simpler SVG paths. |
| Phosphor Bold weight looks too heavy | Low | Phosphor Bold is comparable to lucide's default weight (lucide is already chunky). If anything, Phosphor Regular may look too light — we can bump to Bold where needed. |

---

## Estimated Effort

- Install + alias file: **10 min**
- Batch 1-9 migration: **~2 hours** (each batch ~10-15 min)
- Fixing import paths and cleanup: **20 min**
- Testing visual consistency: **30 min**

**Total: ~3 hours**
