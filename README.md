# 💼 PAKDE (Pemantauan dan Asesmen Koperasi Desa)

> A gamified, offline-first desktop app inspired by Duolingo, Habitica, and TickTick — turning cooperative management into a game so the *Ketua* (guild manager) always knows what quest to complete next to level up their *Koperasi Desa*.

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=flat-square&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![SAK EP Compliant](https://img.shields.io/badge/SAK_EP-Compliant-success?style=flat-square)](#)
[![UU 25/1992](https://img.shields.io/badge/UU_25/1992-Compliant-success?style=flat-square)](#)

---

## Who Is This For?

The primary user is the **Ketua Koperasi Desa (Kopdes Manager)** — the village cooperative chairperson who acts as a **guild manager**. They are not an accountant. They are a farmer, a shopkeeper, a community leader who happens to run a cooperative. They have 15-minute gaps between real-world tasks and no tolerance for manuals.

PAKDE treats the Ketua like a guild leader in an RPG: the app surfaces the next actionable quest, tracks guild (cooperative) XP across 6 aspects, and handles all compliance paperwork automatically in the background.

---

## The Main Feature: Gamified Micro-Actionables

> Think **Duolingo streaks** + **Habitica quests** + **TickTick focus timers** — but for running a village cooperative.

PAKDE's core innovation is not accounting or inventory — it's **direction**. Rural cooperative managers don't need more features; they need to know *what to do next, right now, in the next 15 minutes*.

Every interaction in PAKDE is a **micro-quest** that completes in a coffee break. The Home Dashboard is a quest hub with three tiers:

| Quest Type | Cadence | Inspiration | Purpose |
|-----------|---------|-------------|---------|
| **Daily** | Resets every 24h | Duolingo streaks, TickTick daily checklist | Small, habit-forming actions ("Assign 3 inventory items to shelf bins") |
| **Weekly** | Resets every 7 days | Habitica weekly challenges | Medium tasks that maintain operations ("Create a journal entry for this week's sales") |
| **Main** | Persistent milestones | Habitica boss battles, Duolingo unit completions | Big unlocks that advance the cooperative tier ("Reach Level 3 by completing your first feasibility study") |

Every quest card is a **one-click link** to the relevant feature page. No manual. No training video. The app tells you where to go and what to do.

### Individual Levels (Player/Staff Level)

Staff earn **XP** for every completed action — adding a member, closing a sale, placing a shelf. XP thresholds unlock personal levels that reflect operational mastery. A level 1 cashier can only process basic sales; a level 5 manager can run feasibility studies and generate SAK EP reports. The app tells each staff member exactly which quest will level them up next.

### Cooperative Levels (Guild/Coop Level)

The cooperative itself levels up across **6 operational aspects**, each with 5 tiers:

| Tier | Name | Unlocks |
|------|------|---------|
| 1 | Pioneer (*Rintisan*) | Basic member registration, cash journal |
| 2 | Beginner (*Pemula*) | POS checkout, business unit creation |
| 3 | Growing (*Bertumbuh*) | Store layout editor, feasibility calculator |
| 4 | Productive (*Produktif*) | Advanced SAK EP reports, ratio analysis |
| 5 | Established (*Mapan*) | Sync to national dashboard, federated ranking |

**Aspects:** Membership, Financial, Governance, Compliance, Business Units, Technology

The cooperative's overall level is the aggregate of all 6 aspects. The Ketua can see at a glance which aspect is lagging and which quest will improve it. Progress is visible, measurable, and — critically — always shows the next step.

### Built-in Compliance Engine (Hardcoded)

All Indonesian cooperative governance requirements are **hardcoded** into PAKDE's leveling system. The Ketua doesn't need to read laws — compliance is a questline.

| Regulation | What PAKDE Does | Gamified As |
|-----------|----------------|-------------|
| **UU No. 25 Tahun 1992** (Perkoperasian) | Core cooperative law — legal entity registration, membership rules, capital structure (*simpanan pokok/wajib/sukarela*), dissolution procedures | "Found the Guild" beginner questline |
| **RAT (Rapat Anggota Tahunan)** | Annual Member Meeting — highest cooperative authority, must be held at least once a year | Annual "Guild Summit" main quest |
| **Pengurus & Pengawas** | Management Board (min. 3) and Supervisory Board election, roles, responsibilities | "Form Your Party" governance quest |
| **SHU (Sisa Hasil Usaha)** | Surplus distribution rules — min. 40% to members via jasa usaha, reserve fund allocation, education fund | "Divide the Loot" financial quest |
| **SAK EP / SAK ETAP** | Financial Accounting Standards for Entities Without Public Accountability — double-entry bookkeeping, balance sheet, income statement, cash flow, notes to financial statements | Aspect-based milestone unlocks |
| **Pendidikan Perkoperasian** | Mandatory member education and training | "Train Your Guild" weekly quest |
| **AD/ART** | Articles of Association and Bylaws — must be filed with notarial deed and approved by Kemenkop UKM | "Draft the Charter" one-time quest |
| **Laporan Keuangan Tahunan** | Annual financial report submission to government | "File Your Taxes" annual main quest |
| **Pembinaan & Pengawasan** | Government supervision and grading (RAG: Red-Amber-Green health status) | RAG badge displayed on guild profile |

The Ketua doesn't research regulations. The quest system surfaces the right compliance action at the right time, and completing it **is** complying with the law.

### Why Games Beat Manuals

Enterprise software has a 70% adoption failure rate. Rural cooperative managers are farmers and shopkeepers, not accountants. They don't have hours for training. So PAKDE doesn't use training. It uses play — the same psychological loops that make Duolingo habit-forming, Habitica task-completion rewarding, and TickTick focus sessions satisfying.

The app is simultaneously the **training guide**, the **pitch deck**, and the **progress report** — because every quest teaches a feature while proving its value. A Ketua opens PAKDE, sees their daily quests, clicks one, completes real work, earns XP, and hears a chime. Fifteen minutes later they've learned a module and satisfied a compliance requirement — without reading a single instruction.

---

## The Problem

Indonesia has over 127,000 village cooperatives (*Koperasi Desa*). Most still run on paper ledgers, manual stock counts, and verbal agreements. Billions of rupiah in inventory go unaccounted every year. The root cause is not corruption — it's **the absence of tools designed for rural conditions**: unstable internet, low digital literacy, and time-poor managers.

Existing solutions fail because:
- **Cloud SaaS** requires always-on internet — non-negotiable in remote villages
- **Excel templates** require training, get corrupted, and offer no audit trail
- **Enterprise ERP** costs millions and demands dedicated IT staff

---

## How PAKDE Solves It

PAKDE is a **desktop application** (Windows + macOS) that acts as an offline-first local node. It handles the complete cooperative workflow:

1. **Member Management** — KTP/NIK registration, savings tracking, loan portfolio
2. **Business Units** — Waserda, fertilizer shops, water supply, apothecary
3. **Store Layout Designer** — Visual 2D shelf planner with inventory bin assignment (Konva.js)
4. **Point of Sale** — Cash and credit checkout with journal linking
5. **SAK EP Accounting** — Double-entry ledger, balance sheet, income statement
6. **Financial Feasibility** — ENPV, EIRR, EBCR calculators for expansion planning

All data lives in a local SQLite database. No cloud. No sign-up. No latency.

### Why We Win

- **Visual metaphors over spreadsheets** — drag shelves, not edit cells
- **Indonesian-first UI** with full English fallback (switchable at runtime)
- **Procedural audio feedback** — 8-bit tones confirm actions without reading text
- **Zero training required** — quests link directly to features; completing a quest *is* learning the feature
- **Compliance is automatic** — all UU 25/1992 and SAK EP requirements are hardcoded into the quest system

---

## Architecture: Federated Node Network

The long-term vision is a **Federated Node Network** that bridges individual local operations with regional and national oversight.

```
┌───────────────────────────────────────────────────────────────┐
│                    NATIONAL DASHBOARD                         │
│       (Web app: aggregate analytics across all nodes)         │
│             Hosted on a central API server                    │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTPS (REST API)
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                 CENTRAL API SERVER                            │
│  • Cooperative registration & auth                            │
│  • Accepts periodic sync payloads from each node              │
│  • Computes national aggregates & leaderboards                │
└──────┬──────────┬──────────┬──────────┬──────────┬────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Kop 1 │  │Kop 2 │  │Kop 3 │  │Kop 4 │  │Kop N │
   │Desa A│  │Desa B│  │Desa C│  │Desa D│  │...   │
   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
    SQLite     SQLite     SQLite     SQLite     SQLite
   (Local)    (Local)    (Local)    (Local)    (Local)
```

### Key Pillars

- **Zero PII in the cloud** — Only anonymous aggregates (RAG score, member count, asset volume) leave the device
- **Zero-knowledge backups** — AES-256-GCM encrypted full-DB backup sent to cloud for disaster recovery; decryption key held only by the cooperative
- **National leaderboard** — Regional rankings show cooperative health without exposing individual financial data

### Cryptographic Integrity

- **HMAC-SHA256 progress signing** — Level XP and tier progression signed via Web Crypto API; tampered values are detected and reset
- **SQLCipher encryption** — Local SQLite encrypted on disk with runtime-derived key
- **Deterministic replay validation** — Sync sends action logs, not scores; server replays actions and recalculates achievements

---

## 🚀 Hackathon Quickstart

Please refer to [INSTALLATION.md](INSTALLATION.md) for pre-built installers (macOS Gatekeeper workarounds, Windows SmartScreen bypasses) and instructions on running the development environment from source.

---

## 🛠️ Technology Stack

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

## 💻 Recommended IDE Setup

- **IDE:** [VS Code](https://code.visualstudio.com/)
- **Recommended Extensions:**
  - [Tauri VS Code Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
