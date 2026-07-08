# CreateProfileDialog — Gamified Redesign

## Current Style Score: 4/10

| Aspect | Current | Issue |
|---|---|---|
| Layout | Vertical stack of labeled inputs | Feels like a tax form, not a game |
| Visual weight | Uniform text labels + input boxes | No hierarchy — everything looks equally important |
| CTA | Generic "Batal" / "Simpan" buttons | No moment of commitment |
| Feedback | Error text only on validation failure | No celebration, no progress feeling |
| Personality | None — pure CRUD form | Doesn't match the rest of the app's game feel |

## 10/10 Approach: Character Creation Screen

Think Nintendo Switch profile creator or RPG character builder. Two-step flow with visual feedback at each step.

```
┌─────────────────────────────────────────┐
│                                         │
│        🏢  DAFTARKAN KOPERASI           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Step 1: Identitas             │    │
│  │  ████████████████░░░░  50%     │    │
│  │                                 │    │
│  │  ┌─ Nama Koperasi ───────────┐ │    │
│  │  │ Koperasi Tani Sejahtera    │ │    │
│  │  └────────────────────────────┘ │    │
│  │                                 │    │
│  │  ┌─ Lokasi ──────────────────┐ │    │
│  │  │ ▼ Provinsi                │ │    │
│  │  │ ▼ Kabupaten / Kota        │ │    │
│  │  │ ▼ Kecamatan               │ │    │
│  │  │ ▼ Desa / Kelurahan        │ │    │
│  │  └────────────────────────────┘ │    │
│  │                                 │    │
│  │  ┌─ Kategori ────────────────┐ │    │
│  │  │ ▼ Serba Usaha              │ │    │
│  │  └────────────────────────────┘ │    │
│  │                                 │    │
│  │           [ LANJUT → ]          │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘

         ↓ after filling, transitions to →

┌─────────────────────────────────────────┐
│                                         │
│     ✨  Koperasi Tani Sejahtera         │
│         siap diluncurkan!               │
│                                         │
│     📍  Desa Air Hitam, Lampung         │
│     🏷️  Serba Usaha                     │
│                                         │
│     ╔═══════════════════════════════╗   │
│     ║  🏆  Mulai dengan 5 Poin     ║   │
│     ║  Lengkapi profil untuk       ║   │
│     ║  buka badge & modul!         ║   │
│     ╚═══════════════════════════════╝   │
│                                         │
│     [ ← Kembali ]    [ 🚀 Luncurkan ]   │
│                                         │
└─────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Large centered title with icon
Instead of a cramped header, a bold centered title with `🏢` or `Buildings` icon makes it feel like a milestone screen.

### 2. Progress bar inside the form
A step indicator (`Step 1: Identitas`) with a progress bar shows the user they're on a journey, not filling a form.

### 3. Grouped fields with visual containers
Each section (Nama, Lokasi, Kategori) gets a subtle bordered container with a section label. This breaks the monotony of stacked inputs.

### 4. Two-step flow: Fill → Confirm
- **Step 1 (Fill)**: The form with a "LANJUT" button
- **Step 2 (Confirm)**: A summary card showing what was entered, with a reward badge ("Mulai dengan 5 Poin") and a prominent "🚀 Luncurkan" button

### 5. Reward preview
The confirm step shows a gamification teaser — "Mulai dengan 5 Poin" — connecting creation to the ProfileCompletion system.

### 6. Satisfying sound + animation
- Form field focus: subtle hover glow
- "LANJUT" click: deep thud sound
- "LUNCURKAN" click: chime + 300ms scale animation on the card
- Auto-focus on first input, Enter to advance

## Implementation

```
CreateProfileDialog.tsx  ← rewrite: two-step flow with state
  Step 1: Identitas
    - Nama Koperasi (auto-focused input)
    - RegionPicker (unchanged)
    - Kategori (hidden, default serba_usaha)
    - "LANJUT" button (disabled until name + province filled)

  Step 2: Konfirmasi
    - Summary card: name, location, category, badge preview
    - "KEMBALI" (back to step 1)
    - "LUNCURKAN" (creates cooperative + plays chime + navigates)
```
