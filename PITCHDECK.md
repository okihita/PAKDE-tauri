# PAKDE — Pitch Deck

Platform Aplikasi & Keuangan Koperasi Desa. An offline-first, SAK EP compliant desktop application to digitize and empower Indonesian Village Cooperatives.

---

## The Problem

Indonesia has over 127,000 village cooperatives (*Koperasi Desa*). Most still run on paper ledgers, manual stock counts, and verbal agreements. Audits uncover billions of rupiah in unaccounted inventory every year. The root cause is not corruption — it's **the absence of tools designed for rural conditions**: unstable internet, low digital literacy, and time-poor managers who cannot afford hours-long training.

Existing solutions fail because:
- **Cloud SaaS** requires always-on internet — non-negotiable in remote villages
- **Excel templates** require training, get corrupted, and offer no audit trail
- **Enterprise ERP** costs millions and demands dedicated IT staff

---

## Our Solution

PAKDE is a **desktop application** (Windows + macOS) that acts as an offline-first local node. It handles the complete cooperative workflow:

1. **Member Management** — KTP/NIK registration, savings tracking, loan portfolio
2. **Business Units** — Waserda, fertilizer shops, water supply, apothecary
3. **Store Layout Designer** — Visual 2D shelf planner with inventory bin assignment
4. **Point of Sale** — Cash and credit (Yarnen) checkout with journal linking
5. **SAK EP Accounting** — Double-entry ledger, balance sheet, income statement
6. **Financial Feasibility** — ENPV, EIRR, EBCR calculators for expansion planning
7. **Gamified Leveling** — Aspect-based tier progression across 6 operational dimensions

All data lives in a local SQLite database. No cloud dependency. No sign-up. No latency.

---

## Why We Win

### 1. Built for the Actual User
Rural cooperative managers are not accountants. They are farmers, shopkeepers, and community leaders who happen to run a cooperative. PAKDE's interface uses:

- **Visual metaphors** over spreadsheets — drag shelves, not edit cells
- **Indonesian-first** UI with full English fallback (switchable at runtime)
- **15-minute task windows** — every interaction is a micro-quest that completes in a coffee break
- **Sound feedback** — procedural 8-bit tones confirm actions without reading text
- **No external training** — the Home Dashboard serves quests that link directly to each feature; completing a quest *is* learning the feature

### 2. Offline-First Is Not a Feature; It's a Requirement
In Indonesian villages, internet is a luxury. PAKDE operates entirely offline. All modules — accounting, inventory, member records, floor plan editor — work with zero connectivity. The sync layer queues changes and pushes anonymized aggregates when the network returns. No loading spinners. No "connection lost" modals. Ever.

### 3. Gamification Drives Adoption
Enterprise software has a 70% adoption failure rate. Cooperative managers don't have the patience for "change management." So we designed PAKDE as a game.

**Aspect-Based Leveling**: Cooperatives advance across 6 operational dimensions, each with 5 tiers:

| Tier | Name | Unlocks |
|------|------|---------|
| 1 | Pioneer (*Rintisan*) | Basic member registration, cash journal |
| 2 | Beginner (*Pemula*) | POS checkout, business unit creation |
| 3 | Growing (*Bertumbuh*) | Store layout editor, feasibility calculator |
| 4 | Productive (*Produktif*) | Advanced SAK EP reports, ratio analysis |
| 5 | Established (*Mapan*) | Sync to national dashboard, federated ranking |

**Aspects**: Membership, Financial, Governance, Compliance, Business Units, Technology

Every action — adding a member, completing a journal entry, placing a shelf in the floor plan — generates XP. XP thresholds unlock new tiers. The system auto-detects completion and triggers a chime. No manager needs to "learn the software" — they play it.

### 4. The 15-Minute Quest Design
Every feature is decomposed into micro-quests that complete in **15 minutes or less**. This is deliberate. Rural managers have unpredictable schedules. A task that takes 2 hours will be abandoned. A task that rewards them in minutes becomes habit.

**Example: Store Layout Editor**

| Quest | Time | Action | Reward |
|-------|------|--------|--------|
| Create Store | 3 min | Name layout, set room size, pick grid | Soft-thud SFX, layout card appears |
| Draw Zones | 5 min | Paint product areas (produce, hardware) | Color-coded zones snap to grid |
| Place Shelves | 4 min | Drop racks, configure rows/columns | Green/amber/red stock indicators |
| Assign Items | 3 min | Link inventory to shelf bins via dropdown | Items populate slots, XP awarded |

Total: 15 minutes. The cooperative now has a visual floor plan with live inventory positions. No manual. No training video. Just play.

### 5. Cryptographic Integrity Without Trust
Offline software is vulnerable to tampering. PAKDE uses three layers:

- **HMAC-SHA256 progress signing** — Level XP and lesson completion are signed via Web Crypto API. Tampered values are detected and reset.
- **SQLCipher encryption** — The local SQLite database is encrypted on disk. Without the runtime-derived key (hardware ID + compiled salt), the file is binary noise.
- **Deterministic replay validation** — When syncing to the national dashboard, the client sends action logs, not scores. The server replays actions and recalculates achievements. Anomalous timing (e.g., 10-question quiz in 0.2 seconds) is flagged as tampered.

### 6. Federated Architecture for National Impact
Individual cooperatives use PAKDE as a standalone desktop app. But the long-term architecture connects them:

```
National Dashboard (aggregate analytics)
       ↑
Central API Server (cooperative registry, sync endpoint)
       ↑
┌──────┼──────┬──────┬──────┐
Kop A  Kop B  Kop C  Kop D  Kop N
(Local SQLite — offline-first)
```

- **No PII in the cloud** — Only anonymous aggregates (RAG score, member count, asset volume) leave the device
- **Zero-knowledge backups** — AES-256-GCM encrypted full-DB backup sent to cloud for disaster recovery; decryption key held only by the cooperative
- **National leaderboard** — Regional rankings show cooperative health without exposing individual financial data

### 7. The App Is the Training. The App Is the Deck. The App Is the Guide.

Conventional software ships with three external artifacts: a **training manual** (how to use it), a **pitch deck** (why to buy it), and a **progress report** (what you've achieved). Cooperatives never read any of them. So we built all three into the application itself.

**Home Dashboard = Quest Hub**

The home screen is not a blank landing page. It is a daily command center with three quest tiers:

| Quest Type | Cadence | Examples | Links To |
|-----------|---------|----------|----------|
| **Daily** | Resets every 24h | "Assign 3 inventory items to shelf bins" | Store Layout editor |
| **Weekly** | Resets every 7 days | "Create a new journal entry for this week's sales" | Accounting module |
| **Main** | Persistent milestones | "Reach Level 3 by completing your first feasibility study" | Feasibility calculator |

Every quest card has a **one-click link** that navigates directly to the relevant feature page. The cooperative manager doesn't search for a menu item — the quest tells them where to go and what to do when they get there.

**No Manual. No Training Video. No Consultant.**

The onboarding flow is self-contained:

1. Manager opens PAKDE → sees the Home Dashboard
2. Three quests are displayed: one daily, one weekly, one main
3. Manager clicks the daily quest: *"Register 5 new members"*
4. App navigates to the Members page, pre-focused on the Add Member button
5. Manager completes the task → XP awarded → chime plays → next quest unlocks
6. After 15 minutes, they've learned the Members module without reading a single instruction

This pattern repeats for every module. The **sense of direction** comes from the quest queue always showing the next recommended action. The **sense of progress** comes from the Aspect Leveling panel showing tier advancement across all 6 dimensions. The **pitch** is self-evident: the app demonstrates its value by letting the manager achieve real work in their first session.

**Why This Matters for Adoption**

Rural cooperative digitization consistently fails because of the "training gap" — the assumption that someone will read a PDF manual or watch a YouTube tutorial before using software. PAKDE eliminates that assumption. The app is the pitch deck because it proves its value immediately. The app is the training because every quest is a guided tour. The app is the progress report because every completed task visibly advances the cooperative's level.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS v4 |
| State | Zustand |
| Canvas | Konva.js (react-konva) |
| Desktop Runtime | Tauri v2 (Rust backend) |
| Database | SQLite (SQLCipher binding) |
| Icons | Lucide, Radix UI primitives |
| Typography | JetBrains Mono, Space Grotesk |

---

## Competitive Landscape

| | PAKDE | Cloud SaaS | Excel | Enterprise ERP |
|--|-------|-----------|-------|---------------|
| Offline | ✅ Full | ❌ | ✅ Limited | ❌ |
| SAK EP Compliance | ✅ Automated | ⚠️ Template | ❌ Manual | ✅ |
| Indonesian UI | ✅ Native | ⚠️ Partial | ❌ | ❌ |
| Gamified Adoption | ✅ Quests | ❌ | ❌ | ❌ |
| Shelf-Level Inventory | ✅ Visual | ❌ | ❌ | ❌ |
| Built-in Training/Guide | ✅ In-app quests | ❌ External docs | ❌ | ❌ |
| Cost | Free (open) | Subscription | Free | Millions |
| Training Required | None (play) | Days | Weeks | Months |

---

## Roadmap to National Deployment

1. **Phase 1 — Hackathon Demo** (Current)
   - Working desktop app with 18 feature modules
   - SQLite offline persistence across all modules
   - Store layout editor with Konva.js canvas

2. **Phase 2 — Pilot Villages**
   - 5–10 cooperative pilot deployments in Mojokerto Regency
   - SQLCipher encryption enabled
   - Federated sync with basic national dashboard

3. **Phase 3 — Network Rollout**
   - Anonymous aggregate sync live
   - National leaderboard with RAG rankings
   - Zero-knowledge encrypted backup pipeline

---

*PAKDE was built for the [Tauri 2.0 Hackathon](https://tauri.app/). It runs on Windows and macOS with a single codebase, using React for the UI and Rust for the native backend.*
