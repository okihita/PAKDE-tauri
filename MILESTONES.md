# Milestones & Future Development

Scratchpad for feature ideas, backlog items, and development direction. Not a spec — a living brainstorm.

---

## In Progress

- [x] Store Layout floorplan editor (Konva.js canvas, shelf bins, inventory assignment)
- [x] DevDocStripe and DevConsole removal (prod cleanup)

---

## Backlog

### Purchase Order Module

A dedicated purchase order (PO) workflow for cooperative procurement. Complements the existing Sales (POS) and Inventory modules.

**Scope:**
- Create POs linked to suppliers/vendors (reuse vendor data from Sales?)
- Line items with product, quantity, unit price, total
- PO status lifecycle: `draft` → `submitted` → `approved` → `received` → `closed`
- Approval workflow (single-step for hackathon; multi-tier later)
- Receive goods: auto-increment inventory stock quantities on PO receipt
- Link to accounting journal entries on receipt (debit inventory, credit accounts payable)
- Printable PO document export (PDF)

**Why:**
- Current Sales module handles checkout but not procurement
- Cooperatives regularly order fertilizer, seeds, equipment in bulk
- PO → Receipt → Inventory is a natural workflow gap
- Completes the procurement-to-sales cycle

**Open Questions:**
- Reuse vendor list from Sales or create dedicated supplier table?
- Approval: role-based (manager/treasurer) or simple toggle?
- Should PO link to Business Units for unit-specific procurement?

---

## Architecture: Local Server & Multi-Cashier Sync

### Problem

A cooperative store (Waserda) on market day has 3–5 staff serving customers simultaneously. One desktop running PAKDE becomes a bottleneck. But there is no reliable internet in the village, and setting up a full server rack is absurd. The solution must work over **LAN/WiFi only**, with zero cloud dependency, on commodity hardware already in the cooperative office.

### Simple Plan

```
                     ┌─────────────────────┐
                     │   Local PAKDE Node   │
                     │  (acts as "server")  │
                     │   Tauri + embedded   │
                     │   HTTP + SQLite      │
                     └──────────┬──────────┘
                                │ LAN / WiFi
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
        ┌──────────┐      ┌──────────┐       ┌──────────┐
        │ Cashier 1│      │ Cashier 2│       │ Cashier 3│
        │ (thin UI)│      │ (thin UI)│       │ (thin UI)│
        │ Browser  │      │ Browser  │       │ Browser  │
        └──────────┘      └──────────┘       └──────────┘
```

**Node (Server):**
- One machine runs PAKDE in "server mode" — a lightweight embedded HTTP server (Actix-web or tiny_http inside Tauri)
- Serves SQLite database as the single source of truth
- Exposes a REST API for POS transactions, inventory lookups, member queries
- Runs on `http://192.168.1.x:9876` (local IP, discoverable via mDNS broadcast)

**Cashier Clients (Thin UI):**
- Any device with a browser (cheap laptops, tablets, even phones)
- Loads a minimal POS-only web UI served by the node
- No installation. No app. Just a URL.
- Performs checkout, stock lookups, member credit checks
- All writes go to the node's SQLite via REST calls

**Why This Works for Rural Conditions:**
- Only ONE machine needs PAKDE installed — the cooperative's existing office desktop
- Cashiers use whatever devices are available (BYOD, zero setup)
- No internet required — everything runs on the local LAN
- All data stays on one SQLite file — no distributed consistency headaches
- If the WiFi router dies, the desktop still works as a single-cashier fallback

### Transaction Queue (Offline Cashier Mode)

What if a cashier's device disconnects mid-transaction? Two-tier resilience:

**Tier 1 — LAN Reconnect (seconds):**
- Thin client queues the transaction in browser LocalStorage
- Retries POST to node every 2 seconds
- On reconnect, flushes queue in order

**Tier 2 — Node Failover (minutes):**
- If the node itself goes down (power outage, reboot), cashier browsers cache 50–100 transactions in IndexedDB
- Display a yellow banner: "Offline — transactions queued locally"
- On node recovery, bulk-upload the queue via `/sync/bulk` endpoint
- Conflict resolution: node's timestamp wins for inventory stock; cashier's timestamp wins for sales records (sales happened, even if server didn't see them)

### Implementation Phases

| Phase | Deliverable | Effort |
|-------|------------|--------|
| **1 — Embedded Server** | Tauri sidecar or in-process HTTP server (Actix-web on a separate thread). Serves static POS UI and REST API. | 1–2 days |
| **2 — Thin POS Client** | Standalone HTML/JS page served by the node. Login-less (trust LAN). Product search, cart, checkout, receipt print. | 2–3 days |
| **3 — mDNS Discovery** | Node advertises `_pakde._tcp.local.` Cashiers open browser, see auto-discovered node URL. | 0.5 day |
| **4 — Offline Queue** | LocalStorage queue + IndexedDB fallback. Bulk sync endpoint on node. Conflict resolution rules. | 1–2 days |

### Open Questions

- Should the thin client support the full PAKDE UI or only POS checkout?
- Auth model for thin clients: trust LAN vs. PIN vs. member login?
- Printer integration: receipt printing from browser via `window.print()` or ESC/POS raw?
- Does SQLite handle 3–5 concurrent writers over REST without WAL issues? (Probably fine with WAL mode + serialized writes at the API layer.)
- Should the node auto-elect on LAN if two machines run PAKDE? (Later — start with manual designation.)

---

## Ideas

- Barcode/QR scanner integration for inventory (camera-based)
- Member loan repayment schedule with amortization table
- SMS/WhatsApp notification bridge for overdue loans
- Mobile companion app (read-only member dashboard)
- Multi-cooperative mode (manage several koperasi from one desktop)
- Dark pattern detection — flag rapid-fire actions that suggest tampering
- RAT (Annual Member Meeting) agenda builder with voting
- Weather/crop data integration for agricultural cooperative forecasting
- **Visual Post Builder** — lightweight Canva-style template editor for creating WhatsApp-ready share images (product promos, event announcements, meeting invites). Drag-and-drop text/photo elements, pre-built templates for common cooperative posts, export as square/portrait image optimized for WhatsApp sharing. Boosts community engagement via visually polished, easy-to-share content.
- **Beranda Tips Pop-up** — every time the app navigates to Beranda (Home), show a contextual tip card. Rotates through a pool of tips covering: quick shortcuts, hidden features, compliance reminders, best practices for each module. Dismissible with a "Got it" button. Reinforces learning passively without interrupting flow. Tips are weighted by the cooperative's current tier and lagging aspects (e.g., a cooperative stuck on Governance gets governance tips more often).
- **Daily Kopdes Quiz** — a single, actionable multiple-choice question that appears on the Beranda each day. Covers cooperative governance (UU 25/1992 trivia), SAK EP accounting rules, operational best practices, and module-specific knowledge. Completing the quiz maintains the **daily streak** (alongside quest completion). Correct answers grant bonus XP; incorrect answers show a one-line explanation and let you retry. Keeps the Duolingo-style habit loop tight — 30 seconds, one question, streak preserved.
- **Offline-First Bug Reporter** — accessible from any screen via a small bug icon (bottom-right floating button or settings menu). User attaches one screenshot (auto-captured or selected) and writes a short commentary. Report is saved locally as a queued item. When internet is available, the user can manually sync/push all queued reports to the central server. Keeps the offline-first philosophy intact — no report is ever lost, and no internet dependency blocks feedback.
