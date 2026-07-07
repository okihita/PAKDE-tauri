# Game Title Screen — Splash & Login Redesign

Replace the small pill-badge PAKDE logo on the SplashScreen and ProfileSelect with
a large, center-stage game-title treatment. Placeholder ASCII art until custom artwork
is ready. Design language: retro terminal meets modern game UI.

---

## Splash Screen (Boot)

Current: small `text-4xl` badge, loading bar below. Feels like a loading indicator, not a game boot.
Target: full-screen title reveal with scanline effect, ASCII block letter "PAKDE."

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                                                          │
│                    ╔═══════════════════════════════╗                      │
│                    ║                               ║                      │
│                    ║     ██████╗  █████╗ ██╗  ██╗ ║                      │
│                    ║     ██╔══██╗██╔══██╗██║ ██╔╝ ║                      │
│                    ║     ██████╔╝███████║█████╔╝  ║                      │
│                    ║     ██╔═══╝ ██╔══██║██╔═██╗  ║                      │
│                    ║     ██║     ██║  ██║██║  ██╗ ║                      │
│                    ║     ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ║                      │
│                    ║                               ║                      │
│                    ║   ██████╗  ███████╗            ║                      │
│                    ║   ██╔══██╗ ██╔════╝            ║                      │
│                    ║   ██║  ██║ █████╗              ║                      │
│                    ║   ██║  ██║ ██╔══╝              ║                      │
│                    ║   ██████╔╝ ███████╗            ║                      │
│                    ║   ╚═════╝  ╚══════╝            ║                      │
│                    ║                               ║                      │
│                    ╚═══════════════════════════════╝                      │
│                                                                          │
│                ┌─────────────────────────────────────┐                    │
│                │  PLATFORM APLIKASI & KEUANGAN       │                    │
│                │        KOPERASI DESA                │                    │
│                │                                     │                    │
│                │  ████████████░░░░░░░░░░  67%        │                    │
│                │  INITIALIZING SQLITE NODE...         │                    │
│                └─────────────────────────────────────┘                    │
│                                                                          │
│                    VER 0.5.0  •  SAK EP COMPLIANT                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Large ASCII block letter "PAKDE" centered inside a box-frame (double-line border)
- "DE" (Desa) in a smaller box below — semantic break between "PAK" and "DE"
- Subtitle: "Platform Aplikasi & Keuangan Koperasi Desa" in monospace
- Progress bar: loading indicator with percentage
- Status text: "Initializing SQLite Node..."
- Version badge at bottom
- Background: dark gradient with subtle scanline overlay (CSS)
- Brand color glow behind the ASCII art block

**Animation:** 
- Box-border "power on" reveal (opacity 0→1 over 0.5s)
- Progress bar fills incrementally (20% → 45% → 67% → 100%)
- Status text types out character by character (or fades in)
- Subtle pulsing glow behind the ASCII block
- "PAKDE" letters shimmer with gradient animation (brand → teal → brand)

---

## Profile Select Screen (Login)

Current: grid of cooperative cards with small heading. Functional but flat.
Target: game character-select screen — title at top, profile cards as "save slots."

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              ╔══════════╗                                │
│                              ║  PAKDE   ║                                │
│                              ╚══════════╝                                │
│                                                                          │
│                    ┌─────────────────────────────────┐                    │
│                    │  SELECT COOPERATIVE PROFILE      │                    │
│                    └─────────────────────────────────┘                    │
│                                                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │                    │  │                    │  │                    │  │
│  │    🏛️              │  │    🏛️              │  │    ✨              │  │
│  │  KOPERASI DESA     │  │  KOPERASI DESA     │  │  REGISTER NEW      │  │
│  │    MAKMUR JAYA     │  │    SUKA MAJU       │  │   COOPERATIVE      │  │
│  │                    │  │                    │  │                    │  │
│  │  📍 Mojokerto       │  │  📍 Sidoarjo        │  │                    │  │
│  │  🛡️ Health: 92%     │  │  🛡️ Health: 78%     │  │   [Create New]     │  │
│  │  🏪 3 Units         │  │  🏪 1 Unit          │  │                    │  │
│  │                    │  │                    │  │                    │  │
│  │  [SELECT →]        │  │  [SELECT →]        │  │                    │  │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘  │
│                                                                          │
│                    ┌─────────────────────────────────┐                    │
│                    │  🎵 SOUND: ON  │  VER 0.5.0      │                    │
│                    └─────────────────────────────────┘                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Small PAKDE logo badge at top (not full ASCII — just branded text)
- "SELECT COOPERATIVE PROFILE" as a section header in monospace
- Profile cards as "game save slots" with:
  - Cooperative name (bold, large)
  - Location, health score, unit count
  - Select button with arrow
- "Register New Cooperative" card with dashed border (like "New Game" slot)
- Bottom bar: sound toggle + version

**Animation:**
- Cards slide in from bottom on mount (one at a time, staggered 100ms)
- "PAKDE" title pulses gently
- Sound toggle button with visual on/off state
- Card hover: lifts slightly, border glows brand color

---

## Shared Design Tokens

Both screens use a consistent "menu screen" vibe:

| Element | Style |
|---------|-------|
| Background | `bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900` + subtle noise/grid pattern |
| Title text | `font-mono font-black tracking-[0.3em]` uppercase, gradient text (brand → teal) |
| Box frames | `border-2 border-brand/30 rounded-lg bg-slate-950/60 backdrop-blur` |
| Progress bars | `bg-muted h-2 rounded-full` with `bg-gradient-to-r from-brand to-success` fill |
| Card hover | `hover:border-brand/50 hover:shadow-[0_0_20px_hsl(var(--brand)/0.1)]` transition |
| Version text | `text-xxxs font-mono text-muted-foreground` bottom-right anchored |
| Sound button | `bg-slate-900/80 border border-border rounded-lg` toggleable |

---

## ASCII Art Placeholder

The "PAKDE" block letter art is rendered using a `<pre>` tag with monospace font.
It's a temporary placeholder until actual artwork is created. The ASCII art is
generated from FIGlet or similar, using the "Big" or "ANSI Shadow" font style.

Alternative: use a CSS-only large text treatment with `text-8xl font-black` 
and box-shadow glow, styled like a retro game title — simpler, no ASCII rendering issues.

**Recommendation: CSS game title** — more reliable across screen sizes,
no monospace alignment issues, and easier to animate (gradient shimmer).

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│             ╔══════════════════════╗                     │
│             ║                      ║                    │
│             ║      P A K D E       ║                    │
│             ║                      ║                    │
│             ╚══════════════════════╝                     │
│                                                         │
│        P L A T F O R M    K O P E R A S I               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

| Step | What | Effort |
|------|------|--------|
| 1 | Create `src/features/System/SplashScreen/GameTitle.tsx` — CSS game title component with box frame, gradient text, glow | 20 min |
| 2 | Replace SplashScreen's current badge with GameTitle, keep loading bar, add scanline overlay | 15 min |
| 3 | Add `GameTitle` (small variant) to ProfileSelect screen header | 10 min |
| 4 | Gamify ProfileSelect cards: staggered entrance animation, lift-on-hover, glow border | 20 min |
| 5 | Add sound toggle visual polish (animated icon) | 10 min |

**Total: ~1.5 hours**
