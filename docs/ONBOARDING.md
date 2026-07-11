# Onboarding Review & Planning Document

**Date:** 2025-07-09  
**Status:** Review + Planning — no deletions, no implementation yet.

**Reviewer Agreement:** Antigravity (Google DeepMind) has reviewed this document and fully agrees with the current state diagnosis and proposed 5-phase plan. It establishes a robust foundation for multi-user local authentication, progressive module disclosure, and offline-first cooperative operations. To elevate this from an MVP to a truly elite, production-grade system, we have appended **Section 10** detailing a vision and architectural path to achieve a perfect 10/10 score on all fronts.

---

## 1. Current State: Scorecard

| Concern | Current State | Score (1–5) | Gap |
|---|---|---|---|
| **User Profile Creation** | No user creation flow. `currentUser` is hardcoded (`usr-001`, "Slamet Riyadi"). `local_users` table exists but unused. | **1/5** | Critical. Every coop gets the same hardcoded user. |
| **Coop Profile Creation** | Works: `CreateProfileDialog` → `cooperativeDb.createCooperative()` → `ProfileSelect` onboarding. | **4/5** | Solid but missing user association. |
| **Module Activation on Fresh Coop** | All 16 modules/tabs are always active — no gating, no progressive unlock. | **2/5** | Overwhelming for new users. The gamification system (levels) exists but is cosmetic only. |
| **Main Tasks on Fresh Creation** | Hardcoded defaults (`MAIN_DEFAULTS`, `WEEKLY_DEFAULTS`) — same for every coop. Stored in localStorage per-coop but identical initial state. | **2/5** | Tasks are not context-aware (e.g., a "pemula" coop gets the same SHU-report task as "mapan"). |
| **"Join Existing Coop" Flow** | `CooperativeCardList` shows locally-created coops only. No online database concept. The `parent_id` / `parent_name` fields in schema hint at federation but are unused. | **1/5** | No tenant-user architecture for joining a live coop. |
| **Mock Online Cooperative Database** | None. No API/service layer exists at all — everything is SQLite direct. | **1/5** | No foundation for online features. |
| **Load Existing User Profile from Online** | None. No auth, no remote user lookup, no sign-in. | **1/5** | No multi-device or shared-device story. |

**Overall Onboarding Score: 1.7 / 5** → Needs foundational restructuring.

---

## 2. Architecture Analysis

### 2.1 App State Machine (Current)
```
DB Init → splash → profile_select → main
                              ↓
                         [create new coop]  OR  [select existing local coop]  OR  [demo tier]
```

### 2.2 Proposed: Three-Phase Onboarding State Machine
```
DB Init → splash → mode_select → coop_select → main
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
           Create New Coop    Join Existing    Load Demo Tier
                    ↓               ↓               ↓
           Create User Profile  Load User Profile  Auto-seed + enter
                    ↓               ↓
           Enter Main         Enter Main
```

### 2.3 Tenant-User Architecture (Proposed)
```
┌────────────────────────────────────────────┐
│               App State                    │
│                                            │
│  currentUser: {                            │
│    id, name, role, pin_hash,               │
│    cooperative_id  ← links to tenant       │
│  }                                         │
│                                            │
│  coopProfile: CooperativeProfile           │
│  (from cooperatives table — the tenant)     │
└────────────────────────────────────────────┘

cooperatives (tenant)    ←── 1:N ──→  local_users
       │                                   │
       │  (all data scoped by              │  (multiple users per coop)
       │   cooperative_id)                 │
       ↓                                   ↓
  members, journal_entries, etc.      login with PIN
```

This is already partially modeled in the schema (`local_users.cooperative_id` FK → `cooperatives.id`), but never wired up.

---

## 3. Detailed Answers to Each Question

### Q1: Where should we add the profile/user creation flow?

**Current problem:** `CreateProfileDialog` creates a `cooperative` but never creates a `local_user`. The `currentUser` is hardcoded in `App.tsx`.

**Recommendation:** Insert a **User Setup step** between coop creation and entering main.

**Location:** Two possible insertion points:

| Option | Location | Pros | Cons |
|---|---|---|---|
| **A. In `CreateProfileDialog` (add step 3)** | `features/System/ProfileSelect/CreateProfileDialog.tsx` | Simple, co-located with coop creation | Blurs coop vs user concern; not reusable for "join" flow |
| **B. New `CreateUserProfile` component** | `features/System/ProfileSelect/CreateUserProfile.tsx` | Clean separation, reusable for "Join Existing" flow, can be called independently | Requires state machine changes in App.tsx |

**Recommendation: Option B** — a new `CreateUserProfile` component that:
1. Collects: name, role (admin/operator), PIN (hash + confirmation)
2. Inserts into `local_users` table with the coop's `id`
3. Sets `currentUser` in App state (not hardcoded)
4. Transitions to `main`

**App.tsx changes needed:**
```typescript
// Replace hardcoded user with state + actual lookup
const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
const [userSetupRequired, setUserSetupRequired] = useState(false);

// After coop select/creation: check local_users for this coop
// If none → setUserSetupRequired(true) → show CreateUserProfile
// If found → setCurrentUser from DB
```

### Q2: On fresh coop creation, which modules should be active?

**Current problem:** All 19 tabs are always visible and clickable. The gamification `Levels` system (10 tiers: rintisan→teladan) gates nothing.

**Recommendation:** **Progressive module unlock** tied to the existing `Level` system. The sidebar already shows `Lv.1` badges — make them functional.

| Level | Tier | Unlocked Tabs | Rationale |
|---|---|---|---|
| **Rintisan (1)** | `healthScore ≥ 0` | `home`, `members`, `units`, `settings` | Start with core: dashboard, members, business units, settings |
| **Pemula (2)** | `healthScore ≥ 10` | `sales`, `accounting` (simplified) | Transactions + basic bookkeeping |
| **Bertumbuh (3)** | `healthScore ≥ 20` | `participation`, `equipment` | Community + ops |
| **Produktif (4)** | `healthScore ≥ 30` | `statistics`, `storelayout` | Data insights + layout |
| **Mapan (5)** | `healthScore ≥ 40` | `accounting` (standard), `feasibility` | Full accounting + analysis |
| **Tangguh (6)** | `healthScore ≥ 50` | `event`, `impact` | Community events |
| **Maju (7)** | `healthScore ≥ 60` | `leveling`, `ranking` | Gamification visible |
| **Inovatif (8)** | `healthScore ≥ 70` | `development`, `sync` | Growth + online |
| **Modern (9)** | `healthScore ≥ 80` | `learn`, `planners`, `accounting` (advanced) | Education + advanced finance |
| **Teladan (10)** | `healthScore ≥ 90` | All modules unlocked | Full access |

**Implementation:**
- `Sidebar` already receives `coopProfile` and `getCurrentLevel(healthScore)`.
- Add an `unlockedTabs` set derived from level → filter `GROUPS` rendering.
- Locked tabs show as greyed-out with a lock icon and tooltip: "Unlocked at Level X".
- `App.tsx` guards tab navigation — if `activeTab` is locked, redirect to `home`.

### Q3: On fresh creation, what main tasks should be available?

**Current problem:** `MAIN_DEFAULTS` and `WEEKLY_DEFAULTS` are the same for all coops. Tasks like "Laporan SHU" don't apply to brand-new coops.

**Recommendation:** **Context-aware task seeding** based on coop level + missing data.

**Fresh coop (Level 1 — Rintisan) tasks:**

**Main Quest (`pakde-todos-main`):**
| Priority | Task | Category |
|---|---|---|
| 1 | Lengkapi profil koperasi (alamat, kontak, logo) | profile_completion |
| 2 | Tambahkan minimal 5 anggota koperasi | membership |
| 3 | Daftarkan unit usaha koperasi Anda | business_unit |
| 4 | Siapkan struktur pengurus (ketua, sekretaris, bendahara) | governance |
| 5 | Pelajari dashboard dan fitur-fitur PAKDE | onboarding |

**Weekly Tasks (`pakde-todos-weekly`):**
| Priority | Task | Category |
|---|---|---|
| 1 | Catat transaksi harian koperasi | bookkeeping |
| 2 | Perbarui data anggota (status aktif/nonaktif) | membership |
| 3 | Tinjau saldo simpanan anggota | finance |
| 4 | Hadiri sesi pembelajaran di modul Belajar | education |

**As level increases, tasks evolve:**
- Level 3+: Add "Buat laporan keuangan bulanan"
- Level 5+: Add "Evaluasi kelayakan proyek baru"
- Level 7+: Add "Sinkronisasi data ke kabupaten"

**Implementation:**
- Move `WEEKLY_DEFAULTS` and `MAIN_DEFAULTS` into a `getDefaultTasksForLevel(level: number)` function in `features/Home/Dashboard/`.
- Seed localStorage on first dashboard load if no tasks exist.
- The `ProfileCompletion` component already tracks missing fields — wire its data into task seeding.

### Q4: "Join an Existing Coop" Menu — Tenant-User Architecture

**Current problem:** Only local coops listed. No concept of joining someone else's coop from an online registry.

**Recommendation:** Add a **third option** to the `ProfileSelect` hero screen alongside "Real Account" and "Demo."

**New layout (3-box hero):**
```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  New Cooperative │    │  Join Existing   │    │     Demo         │
│  (Create fresh)  │    │  (Online search) │    │  (Try features)  │
│                  │    │                  │    │                  │
│  Daftar Koperasi │    │ Gabung Koperasi   │    │ Coba Demo       │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

**"Join Existing" flow:**
1. User clicks "Gabung Koperasi" → a search interface appears
2. Search/filter coops from a mock online database (see Q5)
3. Select a coop → prompt: "Enter Registration PIN provided by your cooperative"
4. PIN validation → if matches a `local_user` record → set `currentUser` + `coopProfile`
5. Enter `main` with existing data (members, journal entries, etc.)
6. If offline: show cached/federated coops, or a message "Online diperlukan untuk pencarian koperasi"

**Tenant-User mapping:**
```
┌─────────────────────────────────────────────────┐
│  cooperatives (SELECT * FROM cooperatives        │
│                WHERE id = 'coop-xyz')             │
│                                                   │
│       ↓ 1:N relationship (via cooperative_id FK)  │
│                                                   │
│  local_users (SELECT * FROM local_users           │
│               WHERE cooperative_id = 'coop-xyz'   │
│               AND id = 'usr-002')                  │
│                                                   │
│  Current session = coop-xyz + usr-002             │
└─────────────────────────────────────────────────┘
```

### Q5: Mock Online Cooperative Database

**Current problem:** No mock data for remote coops exists.

**Recommendation:** Create a mock service layer with realistic Indonesian cooperative data.

**File:** `src/features/System/ProfileSelect/onlineCoopDb.ts`

```typescript
interface OnlineCooperative {
  id: string;
  name: string;
  province: string;
  regency: string;
  district: string;
  village: string;
  category: string;      // serba_usaha, konsumsi, etc.
  memberCount: number;
  healthScore: number;
  level: string;         // desa, kecamatan, kabupaten
  businessUnits: string[];
  foundedYear: number;
  registrationCode: string; // code to share with members joining
}

// Mock dataset: ~15 coops across Indonesia
const MOCK_ONLINE_COOPS: OnlineCooperative[] = [
  {
    id: "online-001",
    name: "KUD Makmur Sejahtera",
    province: "JAWA TENGAH",
    regency: "KABUPATEN KLATEN",
    district: "Kecamatan Jogonalan",
    village: "Desa Prawatan",
    category: "serba_usaha",
    memberCount: 245,
    healthScore: 78,
    level: "desa",
    businessUnits: ["unit_pupuk", "unit_simpan_pinjam", "unit_toko_desa"],
    foundedYear: 2015,
    registrationCode: "MKMR-2025",
  },
  // ... 14 more coops across Sumatera, Jawa, Kalimantan, Sulawesi, etc.
];
```

**Search/filter features:**
- Search by name (fuzzy/contains)
- Filter by province, regency
- Filter by category (serba_usaha, konsumen, etc.)
- Sort by member count, health score
- Display as cards in a grid (similar to `CooperativeCardList`)

**Network simulation:**
- Add `simulateNetworkDelay(ms: number)` utility
- Use `setTimeout` to simulate 800–2000ms "server response" time
- Show loading skeleton while "fetching"

### Q6: Load Existing User Profile from Online

**Current problem:** No user lookup or sign-in flow. User is always hardcoded.

**Recommendation:** Two entry points for loading a user profile:

#### A. Join Existing (as above)
1. User finds a coop via online search → enters registration PIN
2. System validates PIN against `local_users` for that coop
3. Loads the matched user profile

#### B. Local Sign-In (multi-user on same device)
1. On `ProfileSelect`, after selecting a local coop, show user login instead of auto-entering
2. Users enter their PIN
3. Validated against `local_users` for that coop
4. Loads user profile + appropriate role-based access

**Implementation:**

**New component:** `UserSignIn` (`features/System/ProfileSelect/UserSignIn.tsx`)
- PIN input (6-digit masked)
- "Lupa PIN?" → recovery question
- Failed attempt counter + lockout (`local_users.failed_attempts`, `locked_until`)
- On success → set `currentUser` in App state

**App.tsx changes:**
```typescript
interface LocalUser {
  id: string;
  name: string;
  role: "admin" | "operator" | "pengawas";
  cooperative_id: string;
}

// Replace hardcoded:
// const [currentUser] = useState({ id: "usr-001", name: "Slamet Riyadi", role: "Ketua Koperasi" });
const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
```

**Database operations needed** (in `cooperativeDb.ts` or new `userDb.ts`):
```typescript
createUser(input: CreateUserInput): Promise<LocalUser>
getUsersByCooperativeId(coopId: string): Promise<LocalUser[]>
validatePin(coopId: string, name: string, pin: string): Promise<LocalUser | null>
loadUserProfile(userId: string): Promise<LocalUser | null>
```

---

## 4. Component Architecture (Proposed)

```
src/features/System/ProfileSelect/
├── ProfileSelect.tsx              # [MODIFIED] 3-box hero (New / Join / Demo)
├── CreateProfileDialog.tsx        # [KEPT] Coop creation wizard
├── CreateUserProfile.tsx          # [NEW] User profile creation after coop creation
├── UserSignIn.tsx                 # [NEW] PIN-based sign-in
├── JoinExistingCoop.tsx           # [NEW] Online coop search + join
├── onlineCoopDb.ts                # [NEW] Mock online cooperative database
├── userDb.ts                      # [NEW] CRUD for local_users table
├── CooperativeCardList.tsx        # [KEPT] Local coop card list
├── onlineCoopCardList.tsx         # [NEW] Online coop search results card list
├── cooperativeDb.ts               # [MODIFIED] Add user-related queries
├── RegionPicker.tsx               # [KEPT] Region selector
├── wilayahDb.ts                   # [KEPT] Region DB queries
├── demoTiers.ts                   # [KEPT] Demo tier definitions
├── CampaignBriefingDialog.tsx     # [KEPT] Demo briefing
├── unitIcons.tsx                  # [KEPT] Unit icon mappings
├── sfx.ts                         # [KEPT] Sound effects
└── music.ts                       # [KEPT] Background music
```

**App.tsx [MODIFIED]:**
```typescript
// New state machine:
// splash → mode_select → coop_select → user_setup? → main

// New states:
// "mode_select"   → 3-box hero (New / Join / Demo)
// "coop_select"   → coop creation or search result selection
// "user_setup"    → CreateUserProfile or UserSignIn (if user needed)
// "main"          → app as today
```

**Sidebar.tsx [MODIFIED]:**
- Accept `userLevel: number` (derived from `currentLevel.tier`)
- Accept `unlockedTabs: Set<string>` derived from level
- Grey out locked tabs with lock icon + tooltip

**Dashboard.tsx [MODIFIED]:**
- `getDefaultTasksForLevel(level: number)` → context-aware seeding
- Tasks reference `ProfileCompletion` gaps

---

## 5. Database Schema Changes

**No schema changes needed.** The `local_users` table already supports everything required:

```sql
-- Already exists in db/init.ts, just needs to be USED:
CREATE TABLE IF NOT EXISTS local_users (
  id TEXT PRIMARY KEY,
  cooperative_id TEXT NOT NULL,      -- FK to cooperatives
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','operator','pengawas')),
  pin_hash TEXT NOT NULL,            -- For PIN validation
  recovery_question TEXT,
  recovery_answer_hash TEXT,
  failed_attempts INTEGER DEFAULT 0, -- For lockout
  locked_until TEXT,                 -- Lockout timestamp
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cooperative_id) REFERENCES cooperatives(id)
);
```

**What we need to ADD:**
1. A simple PIN hashing utility (SHA-256 is fine for a local app)
2. A `userDb.ts` file with CRUD operations on `local_users`
3. Migration: seed a default admin user for existing coops so they don't break

---

## 6. Implementation Phases

### Phase 1: User Profile Foundation (Priority: Critical)
1. Create `userDb.ts` — CRUD on `local_users` table
2. Create `CreateUserProfile.tsx` — PIN + name + role form
3. Modify `App.tsx` — replace hardcoded `currentUser` with DB lookup
4. Wire `CreateUserProfile` into the coop creation flow (after `CreateProfileDialog`)
5. Migration: seed default user for existing coops

### Phase 2: Module Gating (Priority: High)
1. Define `unlockedTabs` mapping in a shared config (`data/moduleUnlock.ts`)
2. Modify `Sidebar.tsx` to grey out locked tabs
3. Modify `App.tsx` to guard locked tab navigation
4. Update `ProfileCompletion` to show "modules unlocked" as incentive

### Phase 3: Context-Aware Tasks (Priority: High)
1. Create `getDefaultTasksForLevel(level: number)` 
2. Modify Dashboard seeding logic to use level-aware defaults
3. Tie tasks to profile completion gaps

### Phase 4: Join Existing Coop (Priority: Medium)
1. Create `onlineCoopDb.ts` with 15+ mock coops
2. Create `JoinExistingCoop.tsx` with search UI
3. Create `UserSignIn.tsx` for PIN entry on join
4. Modify `ProfileSelect.tsx` to 3-box layout
5. Add registration code validation flow

### Phase 5: Online User Profile Load (Priority: Low)
1. Extend mock data to include user records per coop
2. Create "sign in with existing account" flow
3. Add recovery question / PIN reset flow

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Breaking existing coops with no user records | High | Backfill migration: auto-create admin user for each existing coop |
| Overcomplicating the onboarding flow | Medium | Keep the 3-box hero simple; hide complexity behind progressive disclosure |
| PIN security (local only) | Low | SHA-256 is adequate for local desktop app. No network exposure. |
| Offline mode for "Join Existing" | Medium | Cache online coop list locally; show clear "online required" message when fetching |
| Module gating frustrating power users | Low | Add a "Skip" / "Unlock All" developer toggle in Settings |

---

## 8. Summary Scores

| Dimension | Before | After (Planned) | 10/10 Target (Production-Grade) |
|---|---|---|---|
| User profile creation | **1/5** | **5/5** — full PIN-based user system | **10/10** — Biometrics, local hardware encryption, BIP-39 recovery |
| Coop creation flow | **4/5** | **5/5** — seamless + user association | **10/10** — Local AI OCR certificate scanning, pre-configured Chart-of-Accounts (CoA) templates, offline GIS maps |
| Module activation control | **2/5** | **5/5** — progressive unlock via level system | **10/10** — "Practice Dojo" sandbox simulators, dynamic UI scaling, RPG specializations |
| Context-aware task seeding | **2/5** | **5/5** — level-aware tasks | **10/10** — Real-time procedural heuristic quest engine, local AI financial health adviser |
| Join existing coop | **1/5** | **4/5** — mock online DB + tenant-user | **10/10** — Local P2P Wi-Fi/Bluetooth mesh network sync, cryptographic QR handshakes |
| Online user profile loading | **1/5** | **3/5** — mock implementation, foundation for real | **10/10** — Zero-knowledge client-side encrypted cloud backup, DID integration |
| **Overall** | **1.7/5** | **4.5/5** | **10/10** — Enterprise-grade, offline-first ecosystem |

---

## 9. Decisions Needed

1. **PIN complexity:** 4-digit, 6-digit, or alphanumeric? → Recommend **6-digit numeric** (matches Indonesian pattern: like ATM PIN).
2. **Module unlock philosophy:** Strict gating (must hit level) vs. Soft gating (show locked but clickable)? → Recommend **Soft gating** — show as locked, but allow "Explore anyway" for power users.
3. **Multi-user on same device:** Is this a priority for v1? → Recommend **Simple admin-only** for now; multi-role can come later.
4. **Online database mock persistence:** Should the mock online coop list "remember" which coops the user has joined? → Recommend **Yes** — store in localStorage `pakde-joined-coops` for local join history.

---

## 10. Elevating to 10/10: The Ultimate Onboarding Vision

To evolve PAKDE from a highly functional MVP (the 5/5 Phase Plan) into a world-class, production-ready offline-first ecosystem (10/10), we must design for extreme resilience, accessibility, and zero external friction. Below are the concrete architectural and design requirements to achieve a perfect score across each onboarding dimension.

### 10.1 User Profile Creation (10/10 Target)
*   **Hardware-Backed Cryptography:** Instead of simple local PIN hashing, encrypt the local SQLite database using a hardware-bound key from the OS Secure Enclave (TouchID/FaceID via Tauri's authenticator/biometrics plugins). This allows instant, secure passwordless login for rural users.
*   **BIP-39 Mnemonic Passphrase Recovery:** Offline users cannot trigger standard "Forgot Password" email loops. During profile creation, generate a 12-word seed phrase. If a PIN is lost, the user inputs the phrase to cryptographically derive the master key and reset the PIN locally.
*   **DB-Level Access Controls (RBAC):** Restrict read/write privileges at the database layer (using SQL views or custom trigger policies) rather than relying solely on UI-level sidebar gating, preventing accidental data modification by operators.

### 10.2 Coop Profile Creation (10/10 Target)
*   **AI-Powered OCR Registration Scanning:** Implement local WebAssembly OCR (e.g., Tesseract.js running client-side inside Tauri). The Ketua holds up their cooperative's registration deed (*Akte Pendirian / NIK certificate*) to their camera. The system auto-extracts legal name, registration number, address, and board of directors, eliminating data entry errors.
*   **Sector-Specific Chart of Accounts Bootstrapping:** Don't just seed standard financial ledgers. Prompt for the cooperative type (e.g., *Simpan Pinjam* - savings & loans, *Produsen* - agriculture, *Konsumen* - retail shop). The DB bootstrapper instantly configures pre-defined, compliance-ready Chart of Accounts conforming to SAK EP guidelines for that sector.
*   **Offline GIS Boundary Mapping:** Use pre-cached MapLibre vector maps of Indonesia to let the cooperative define its physical operational territory and plot village-level assets (member farms, warehouses, stores) directly on an interactive canvas without internet connectivity.

### 10.3 Module Activation on Fresh Coop (10/10 Target)
*   **"Practice Dojo" Sandbox Simulators:** Gating modules can frustrate or leave users unprepared. When a module (such as Point of Sale) unlocks, offer a "Combat Arena" tutorial. This loads a safe, temporary in-memory database with pre-loaded mock stock and customers. The user practices sales transactions, voids, and cash drawer reconciliations safely before processing real inventory.
*   **Dynamic UI Complexity Scaling:** Introduce an interface scale factor (e.g., Pioneer, Standard, Advanced). If telemetry (such as high transaction times, frequent undos, or help-click rates) indicates the operator is struggling, the app offers to toggle a simplified layout (larger buttons, minimized options, colloquial helper labels).
*   **Cooperative Specialization Trees:** Let the cooperative choose "Tech/Business Talents" as they level up (similar to RPG class specializations). Unlocking "Rice Milling Specialization" configures agricultural logistics and processing sub-modules, while "Waserda Specialization" activates POS and barcode scanning.

### 10.4 Main Tasks on Fresh Creation (10/10 Target)
*   **Procedural Heuristic Quest Engine (PHQE):** Instead of static default task list arrays, run a local database analyzer background task. It evaluates the current ledger and tables to generate dynamic quests:
    *   *No members added yet?* -> Quest: "Enroll your first 5 founding members" (XP: 100).
    *   *Stock item has zero bin location?* -> Quest: "Assign 3 items to shelf locations in the store layout editor" (XP: 150).
    *   *RAT Meeting date is 30 days away?* -> Quest: "Convene Board of Directors to draft RAT invitation" (XP: 500).
*   **Local Heuristic Financial Health Coach:** A local analyzer scans double-entry transaction ledgers, calculating solvency, liquidity, and asset utilization ratios. The app translates weak ratios into quests (e.g., *"Liquidity ratio is below 1.2. Quest: Re-negotiate Rp 5,000,000 in outstanding credit with members"*).
*   **Printable Achievements & Aesthetic Rewards:** Completing major milestones (e.g., first monthly closing under SAK EP compliance) triggers a high-fidelity level-up ceremony, plays custom 8-bit chip tunes, and generates a beautiful, printable PDF certificate of operational excellence that the cooperative can display on their physical wall.

### 10.5 "Join Existing Coop" Flow (10/10 Target)
*   **Zero-Internet Local P2P Sync (Mesh Networks):** In remote villages without cellular connectivity, enable local synchronization. Multiple worker devices running PAKDE discover each other via local Wi-Fi router hotspots or direct ad-hoc WiFi (using Rust `libp2p` via Tauri's backend). SQLite transaction logs are merged using Conflict-Free Replicated Data Types (CRDTs).
*   **Cryptographic Invitation Handshakes (QR-based):** An admin issues a temporary registration QR code containing the cooperative's cryptographic public key and a signed handshake invitation. The joining member scans it, automatically establishing a verified, role-restricted connection profile without requiring external database lookup.
*   **Multi-Tenant Supervisor Dashboard:** Enable regional cooperative auditors (*Pengawas Kabupaten*) to load multiple offline cooperative profiles via password-protected secure files, letting them inspect and audit ten different village cooperatives on one tablet.

### 10.6 Mock Online Cooperative Database (10/10 Target)
*   **Offline Network Resilience Sandbox:** Integrate a connection-profiler tool in developer mode to simulate real rural internet conditions (e.g., "3G/2G Telkomsel Edge," "Packet Loss 40%," "Periodic 12-hour Outages"). This validates that sync states recover smoothly and ledger fork merges handle transaction conflicts correctly.
*   **Active Ecosystem Simulation:** Simulate a mock online index of 10,000 active cooperatives. Show virtual rankings, mock regional trade indexes (e.g., fluctuating prices for corn or fertilizer), and national leaderboards to make the "connected cooperative" experience feel alive.

### 10.7 Load Existing User Profile from Online (10/10 Target)
*   **Zero-Knowledge Encrypted Cloud Backups:** Back up user profiles and databases to a secure cloud backend using end-to-end encryption. The data is encrypted locally with the user's master key before transmission, meaning the cloud server has zero visibility into the cooperative's financial books or member names.
*   **Decentralized Identifiers (DID):** Store member credentials as DIDs. If the cooperative server is offline, credentials can still be verified cryptographically on local devices, ensuring that administrative roles remain authenticated during long network partitions.

---

## 11. Subagent Implementation Playbook

This section serves as a step-by-step technical blueprint for a development agent to implement Phase 1 through Phase 4 in the codebase.

### Phase 1: User Profile Foundation

#### Step 1.1: DB Migration for Backward Compatibility
*   **File:** [init.ts](file:///Users/okihita/ArcaneSanctum/PAKDE/PAKDE-tauri/src/db/init.ts)
*   **Action:** Add a migration block at the end of `initDb()` that checks if there are any cooperatives in the database. For every cooperative that has no associated users in `local_users`, auto-insert a default administrator record so existing development profiles do not lock up or crash:
    ```typescript
    const coops = await db.select<{ id: string }[]>("SELECT id FROM cooperatives");
    for (const coop of coops) {
      const users = await db.select<{ id: string }[]>("SELECT id FROM local_users WHERE cooperative_id = ?", [coop.id]);
      if (users.length === 0) {
        await db.execute(
          `INSERT INTO local_users (id, cooperative_id, name, role, pin_hash) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            "usr-" + crypto.randomUUID().slice(0, 8),
            coop.id,
            "Slamet Riyadi",
            "admin",
            "8d969ee56701d853af7b830aef854b3c7b288d60c9329ee3073a56657a8c462a" // SHA-256 hash of "123456"
          ]
        );
      }
    }
    ```

#### Step 1.2: Build the User Database Layer
*   **File [NEW]:** `src/features/System/ProfileSelect/userDb.ts`
*   **Action:** Export functions interacting with the database using Tauri SQL:
    *   `createUser(cooperativeId: string, name: string, role: string, pin: string, recoveryQ?: string, recoveryA?: string): Promise<LocalUser>`
    *   `getUsersByCooperativeId(cooperativeId: string): Promise<LocalUser[]>`
    *   `validatePin(cooperativeId: string, userId: string, pin: string): Promise<boolean>`
*   **Cryptography:** Implement a simple helper function to generate SHA-256 hashes of PIN codes within `userDb.ts` using standard Web Crypto API (available in browser/Tauri context):
    ```typescript
    async function hashPin(pin: string): Promise<string> {
      const msgBuffer = new TextEncoder().encode(pin);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }
    ```

#### Step 1.3: Create Onboarding & Authentication Components
*   **File [NEW]:** `src/features/System/ProfileSelect/CreateUserProfile.tsx`
    *   **Action:** Build a React form that prompts the user for Name, Role (Admin, Operator, Supervisor), 6-digit numeric PIN, and Recovery Question/Answer. It should save the user using `createUser()` and call `onComplete(user)`.
*   **File [NEW]:** `src/features/System/ProfileSelect/UserSignIn.tsx`
    *   **Action:** Build a PIN-entry keypad UI. Let the user select their name from a dropdown of coop users (fetched via `getUsersByCooperativeId`), enter a 6-digit PIN, and call `onSuccess(user)` if `validatePin()` returns true. Add an lockout warning if failed attempts go beyond 3 times.

#### Step 1.4: Update App Shell State Machine
*   **File:** [App.tsx](file:///Users/okihita/ArcaneSanctum/PAKDE/PAKDE-tauri/src/App.tsx)
*   **Action:**
    1. Update the `appState` type definition:
       ```typescript
       type AppState = "splash" | "profile_select" | "user_signin" | "user_create" | "main" | "db_error";
       ```
    2. Replace the hardcoded `currentUser` state:
       ```typescript
       const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
       ```
    3. Modify `onProfileSelect` in `ProfileSelect` to check for users:
       ```typescript
       onProfileSelect={async (profile) => {
         setCoopProfile(profile);
         localStorage.setItem("pakde-active-profile-id", profile.id || "");
         const users = await getUsersByCooperativeId(profile.id);
         if (users.length === 0) {
           setAppState("user_create");
         } else {
           setAppState("user_signin");
         }
       }}
       ```
    4. Render `<CreateUserProfile>` and `<UserSignIn>` screen states depending on the `appState`. Once signed in, call `setCurrentUser(user)` and `setAppState("main")`.

---

### Phase 2: Module Gating

#### Step 2.1: Define Level Locks
*   **File [NEW]:** `src/features/Sidebar/moduleUnlock.ts`
*   **Action:** Create a map containing health score requirements for tabs and an helper function:
    ```typescript
    export const TABS_LEVEL_REQUIREMENTS: Record<string, number> = {
      home: 0,
      members: 0,
      units: 0,
      settings: 0,
      sales: 10,
      accounting: 10,
      participation: 20,
      equipment: 20,
      statistics: 30,
      storelayout: 30,
      feasibility: 40,
      event: 50,
      impact: 50,
      leveling: 60,
      ranking: 60,
      development: 70,
      sync: 70,
      learn: 80,
      planners: 80,
    };

    export function isTabUnlocked(tab: string, healthScore: number): boolean {
      const requiredScore = TABS_LEVEL_REQUIREMENTS[tab];
      if (requiredScore === undefined) return true;
      return healthScore >= requiredScore;
    }
    ```

#### Step 2.2: Implement Gating in Sidebar
*   **File:** `src/features/Sidebar/Sidebar.tsx`
*   **Action:** Read the `health_score` from `coopProfile`. When rendering navigation list links, run `isTabUnlocked(tabId, healthScore)`.
    *   If false: Render the link item with a lock icon, opacity-50 grey color, and disable the `onClick` event. Add a tooltip that displays `"Terkunci: Membutuhkan Health Score ≥ X"`.

#### Step 2.3: Implement Routing Guard
*   **File:** [App.tsx](file:///Users/okihita/ArcaneSanctum/PAKDE/PAKDE-tauri/src/App.tsx)
*   **Action:** In `AppContent`, add an effect checking if `activeTab` is unlocked whenever `coopProfile` or `activeTab` changes. If the current active tab is locked, reset it:
    ```typescript
    useEffect(() => {
      const score = coopProfile?.health_score ?? 0;
      if (!isTabUnlocked(activeTab, score)) {
        setActiveTab("home");
      }
    }, [activeTab, coopProfile?.health_score]);
    ```

---

### Phase 3: Context-Aware Tasks

#### Step 3.1: Task Seeding Utility
*   **File [NEW]:** `src/features/Home/Dashboard/dashboardTasks.ts`
*   **Action:** Create logic that generates tasks based on cooperative level (health score) and missing profile gaps (like missing email, address, or business units):
    ```typescript
    export function getInitialTasksForCoop(healthScore: number, missingProfileFields: string[]) {
      const mainQuests = [];
      const weeklyQuests = [];

      if (healthScore < 10) {
        // Rintisan Tasks
        mainQuests.push({ id: "q1", text: "Tambahkan minimal 5 anggota koperasi", done: false, category: "membership" });
        if (missingProfileFields.includes("address")) {
          mainQuests.push({ id: "q2", text: "Lengkapi alamat koperasi di pengaturan", done: false, category: "profile" });
        }
        mainQuests.push({ id: "q3", text: "Daftarkan unit usaha awal Anda", done: false, category: "business_unit" });
        weeklyQuests.push({ id: "w1", text: "Catat transaksi kas harian pertama", done: false, category: "bookkeeping" });
      } else if (healthScore < 30) {
        // Bertumbuh Tasks
        mainQuests.push({ id: "q4", text: "Gambarkan tata letak toko Waserda pertama", done: false, category: "storelayout" });
        weeklyQuests.push({ id: "w2", text: "Rekonsiliasi saldo kas mingguan", done: false, category: "finance" });
      } else {
        // Advanced
        mainQuests.push({ id: "q5", text: "Buat Laporan SHU SAK EP", done: false, category: "accounting" });
      }

      return { mainQuests, weeklyQuests };
    }
    ```

#### Step 3.2: Seed Tasks on Initial Dashboard Render
*   **File:** `src/features/Home/Dashboard/Dashboard.tsx`
*   **Action:** When the dashboard mounts, check if the localStorage keys `pakde-todos-main` and `pakde-todos-weekly` are present. If not, analyze the `coopProfile` and invoke `getInitialTasksForCoop()` to seed the tasks dynamically.

---

### Phase 4: Join Existing Cooperative (Mock)

#### Step 4.1: Establish Mock Registry
*   **File [NEW]:** `src/features/System/ProfileSelect/onlineCoopDb.ts`
*   **Action:** Define an interface `OnlineCooperative` containing ID, name, region filters, and a required registration join PIN code. Export a static list of 15 realistic Indonesian cooperatives. Expose a helper:
    *   `searchOnlineCoops(query: string, region: string): Promise<OnlineCooperative[]>`
    *   Simulate a network delay of `800ms` to `1500ms` using `setTimeout`.

#### Step 4.2: Build Search & Verification Dialog
*   **File [NEW]:** `src/features/System/ProfileSelect/JoinExistingCoop.tsx`
    *   **Action:** Build a searching dashboard containing text input and region filters. Render results as card nodes. When a card is clicked, show a PIN entry dialog asking for the coop's "Registration Access Code". If validated, insert the coop profile into local SQLite databases, prompt the user to create their local operator profile, and enter the main screen.

#### Step 4.3: Incorporate into Mode Select Hero
*   **File:** [ProfileSelect.tsx](file:///Users/okihita/ArcaneSanctum/PAKDE/PAKDE-tauri/src/features/System/ProfileSelect/ProfileSelect.tsx)
    *   **Action:** Change the card selection from two columns (Real/Demo) to three options by inserting "Gabung Koperasi (Online Search)" in the middle. Toggle a modal panel displaying `JoinExistingCoop` on click.

