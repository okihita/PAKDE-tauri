# Milestones & Future Development

PAKDE is a productivity suite. It helps the *anak muda yang ingin terus berkarya di desanya* — young people who want to keep building and creating in their villages. PAKDE helps them **mengelola dana masyarakat desa, sekaligus mengemban amanah memajukan hajat hidup orang banyak** — managing village community funds while carrying the mandate to advance the people's vital interests.

> **"Hajat hidup orang banyak"** is a constitutional term from Pasal 33 UUD 1945. It refers to the branches of production and services essential to the livelihood of *all* Indonesian people — water, energy, food, natural resources, and other vital sectors. The mandate is that these must be managed for public service, not private profit. Cooperatives (*koperasi*) are uniquely suited to this mission because of their *dual identity*: members are both owners and users, eliminating the profit margin between producer and consumer. By operating *at cost*, cooperatives make life's necessities more affordable and accessible to the entire community. PAKDE is the digital toolkit that makes this possible at the village level.

PAKDE **menghilangkan salah urus, membantu perencanaan, memberikan konsultasi bisnis sekaligus pelatihan akunting lewat in-app, semuanya offline-first.** It eliminates mismanagement, aids planning, and provides business consultation alongside in-app accounting training — all offline-first. A built-in financial calculator **menghitung keuangan, mencegah kredit macet, dan mengingatkan penagihan** — calculating finances, preventing bad debt, and sending collection reminders.

PAKDE helps **menghindari program yang tidak tepat sasaran** — avoiding misdirected programs that miss the community's real needs. AI assists in designing targeted programs, tracking progress, and mitigating any risks recorded along the way.

Data ekonomi desa bisa diupdate lewat koneksi online jika ada internet **ATAU** expansion pack yang bisa diunduh tiap 3 bulan dan diinstall offline lewat USB drive atau bahkan kabel *Android* — village economic data can be updated via online connection when internet is available, **OR** via an expansion pack downloaded every 3 months and installed offline through a USB drive or even an Android cable.

**The old way is broken.** Metode tradisional lambat dan analisis kelayakan dilakukan secara manual sehingga memakan waktu berbulan-bulan — sehingga koperasi kehilangan momentum bisnis. Traditional methods are slow and feasibility analysis is done manually, taking months — causing cooperatives to lose business momentum. Pengambilan keputusan sering didasarkan pada intuisi atau kedekatan pribadi, bukan pada data yang valid dan objektif — decisions are often based on intuition or personal relationships, not on valid and objective data.

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
- **Task Completion Sound Effects** — distinct procedural 8-bit chimes and tones play on completing any quest, leveling up, earning XP, or hitting a streak milestone. Each action type (daily/weekly/main quest, quiz correct, aspect tier-up) gets its own recognizable sound. Audio feedback reinforces the gamification loop without requiring the user to look at the screen. Configurable volume and mute toggle in Settings.
- **Ethnic Music Track Switcher** — a lightweight music player embedded in the app with a curated playlist of instrumental, calming folk music (*lagu daerah*) from various Indonesian ethnicities (Javanese gamelan, Sundanese kacapi suling, Balinese rindik, Batak gondang, Minang saluang, Papuan tifa, etc.). The Ketua can switch tracks from a compact mini-player on the Beranda or Settings. Music is bundled locally (offline-first, no streaming). Designed to make long data-entry sessions more pleasant while celebrating local cultural identity.
- **AHU Legal Document Integration** — two-quest approach for cooperative legal registration under AHU (Badan Hukum). **Quest 1 (one-time onboarding):** Ketua enters AHU number (format-validated), establishment date, notary name, and deed number — all fields transcribed from the physical SK Pengesahan and akta pendirian they must have in hand. Optional document scan upload creates an encrypted local digital backup as the real reward. **Quest 2 (annual reminder):** a document hygiene checklist — "Is the AHU certificate legible? Is the akta accessible? Is AD/ART current? Have you made fresh backups?" Framed as a self-serving reminder, not enforcement. Later: optional online ping to AHU public registry for number validation when internet is available. Abuse is irrelevant — the only beneficiary of good document management is the cooperative itself.
- **Quiz Content: Economies of Scale via Pecel Lele Case Study** — curated learning module built around [Realita Bisnis Pecel Lele: Risiko Besar Dibalik Larisnya](https://www.youtube.com/watch?v=zS5zq9CbdAY) (YouTube). The video dissects how pecel lele street vendors survive razor-thin margins through volume, supply chain efficiency, and communal bulk purchasing. **Quiz bridge:** "Pecel lele sellers pool demand to buy catfish at wholesale prices that solo vendors can never get. What cooperative feature does this most closely resemble?" → Answer: *Pengadaan bersama* (joint procurement) — the cooperative pools member demand to negotiate bulk discounts, the same principle at guild scale. **Design pattern:** short external case study → one bridging quiz question → immediate "why this matters for your cooperative" takeaway. Scoring: 7/10 overall (strong principles, needs explicit cooperative framing in-app; video is about individual UMKM, not cooperatives — the quiz must do the translation work).
