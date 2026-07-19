# Dashboard Screen (Beranda)

This screen serves as the main cockpit for the village cooperative. It supports custom widgets, quick actions, checklist workflows, and a local calendar.

---

### 📦 Features & Widgets
- **Main Quest Checklist**: Main targets (Annual RAT, filing tax reports, auditing outstanding balances).
- **Tasks Board (Harian / Mingguan)**: Local Todo list allowing managers to add and clear harian (daily) and weekly tasks.
- **Calendar Panel**: Renders [DashboardCalendar.tsx](file:///Users/okihita/ArcaneSanctum/PAKDE/PAKDE-tauri/src/features/DashboardCalendar.tsx) for tracking meeting dates.
- **Berita & Info Column**: Renders the cooperative's own `news` table (`@/db/news`), seeded per co-op on creation (and a single welcome item for the demo co-op). Loaded asynchronously with a loading state.

---

### 🛠️ Developer Notes & Operations
- **Drag-and-Drop Order**: Powered by `@dnd-kit/core` and `@dnd-kit/sortable`. The ordering of panels is saved locally inside `localStorage` under the key `pakde-card-order`.
- **Mock State**: Todo lists are persisted client-side in `localStorage` (`pakde-todos-daily`, `pakde-todos-weekly`, `pakde-todos-main`).
