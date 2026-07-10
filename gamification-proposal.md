# Co-op Leveling & XP — MVP Review and 10/10 Foundation Plan

> Critical assessment of the proposed MVP gamification mechanics, plus a concrete
> recommendation for reshaping it into a strong, extensible foundation.

## Proposed Mechanics (as given)

1. New co-ops begin at **Level 0**.
2. For every **2 members registered**, the co-op increases by **1 level**.
3. The XP requirement is **1,000 XP per level**.
4. Adding a single member grants **500 XP**.

---

## 1. Logical Consistency

**Verdict: Internally consistent, but ambiguous on the source of truth.**

The two leveling statements are numerically identical:

| Members | XP (500 / member) | Level via members (÷2) | Level via XP (÷1,000) |
|--------:|------------------:|-----------------------:|----------------------:|
| 0 | 0 | 0 | 0 |
| 1 | 500 | 0 | 0 |
| 2 | 1,000 | 1 | 1 |
| 3 | 1,500 | 1 | 1 |
| 4 | 2,000 | 2 | 2 |
| 6 | 3,000 | 3 | 3 |

Because `500 × members ÷ 1,000 = members ÷ 2`, the XP rule is a **pure scalar
reskin of the member-count rule**. They never conflict — but the spec never
states which one *authoritatively* drives the level. If a naive implementation
lets both grant levels independently, you risk **double-counting** (member add →
level-up *and* XP threshold → level-up). That ambiguity is the single biggest
consistency defect.

Also ambiguous: "1,000 XP per level" — incremental (1,000 to go from L1→L2) or
cumulative (1,000 total = "ever leveled")? Only the incremental reading aligns
with the member rule; the wording should be explicit.

---

## 2. Mathematical Balance

- **Flat, linear cost.** Every level always costs exactly 2 members. No
  early-game acceleration, no late-game friction, no diminishing returns.
  Acceptable for an MVP, but it means balance is trivially predictable and offers
  zero tuning surface.
- **No balance asymmetry.** All progression is gated by one lever at constant
  weight. There is no notion of "cheaper early levels" or "prestige," so there is
  nothing to *balance* yet.
- **Redundancy = zero information.** XP currently carries no signal beyond member
  count. It is not a separate economy; it cannot be balanced against other actions
  because no other actions exist.

**Bottom line:** Mathematically sound, but vacuously so — there is no real
economy to balance.

---

## 3. Effectiveness as a Foundation for Advanced Features

This is where the design is weakest as a *foundation*:

1. **Single action only.** The brief says "link in-app actions with leveling,"
   yet the only XP source is member registration. Any future action (posts,
   trades, logins, referrals) must be bolted on with no framework for relative
   weighting.
2. **No source-of-truth separation.** A clean foundation makes **XP the single
   authority** and treats member-adds as *one* XP source. The current spec couples
   level directly to a specific action, which blocks multi-source progression
   without a rewrite.
3. **No churn/demotion handling.** If a member leaves, does XP decrease? Does the
   co-op de-level? Unspecified — and de-leveling is the hardest thing to retrofit.
4. **No abuse surface defined.** Member-spam to level is unbounded; no
   verification, caps, streaks, or sinks.
5. **No caps / prestige / soft goals.** Infinite linear scaling with no milestone
   structure to hang future features (badges, tiers) on.
6. **Level 0 start.** A founder alone sits at Level 0, which reads as
   "unranked / empty" and is poor early motivation.

---

## 4. Score

**5.5 / 10 — *Consistent and simple, but architecturally shallow.***

It passes as a throwaway MVP, but as a *foundation* it is fragile: XP is
redundant with member count, the authoritative level mechanism is unspecified
(double-count risk), and there is no multi-action, churn, or abuse architecture
to grow into. The math works; the design does not yet earn its complexity.

---

## 5. Recommendation — Path to a 10/10 Foundation

The goal is not to pile on features, but to make the *core* architecturally
correct so advanced features can be added without rewrites. Six changes:

### R1. Make XP the single source of truth
Decouple level from member count. Level is derived **only** from accumulated XP.
Member registration becomes "grant 500 XP," not "grant a level." This removes
the double-count ambiguity and opens the door to multiple XP sources.

> Level = `floor(totalXP / XP_PER_LEVEL)`, with `XP_PER_LEVEL` as a tunable constant.

### R2. Define the XP source table (extensible by design)
Introduce a weight table so every in-app action is a first-class XP source. The
MVP ships with one row; future rows are data, not code changes.

| Action | XP | Notes |
|--------|---:|-------|
| Member registers | 500 | The only MVP source |
| *Future:* Member verifies identity | 200 | |
| *Future:* First weekly active member | 50 | daily-capped |
| *Future:* Co-op completes a trade | 100 | |

This directly satisfies "link in-app actions with leveling."

### R3. Specify churn / demotion semantics up front
Decide and document: **does removing a member subtract XP?** Recommended: XP is
**monotonic (never decreases)** from legitimate earned actions, but a *removed*
member's contribution is **reverted** via a negative XP event. This makes
de-leveling a natural, event-sourced consequence rather than a special case to
retrofit later. Support multi-level drops in one recompute.

### R4. Add an abuse / integrity surface
- **Real-member verification gate** before XP is granted (prevents spam joins).
- Optional **per-co-op daily XP cap** or **per-action cooldown** to bound
  grindability.
- **Event sourcing**: every XP change is an append-only event
  (`member_joined`, `member_removed`, `action_x`), so the ledger is auditable and
  replayable.

### R5. Introduce milestone structure, not just infinite levels
Define **tiers** (e.g., Bronze ≤ L5, Silver ≤ L15, Gold ≤ L30) as labels over the
same XP axis. Tiers give future features (badges, perks, soft caps) a hook without
altering the level math. Keep the per-level XP cost flat for MVP, but make it a
constant so curves (e.g., `XP_PER_LEVEL × level`) can be swapped later.

### R6. Fix the starting state
Start co-ops at **Level 1** (representing the founding member) so the founder is
never "unranked." Initial state: 1 founder = base XP that already places them at
Level 1. This improves early motivation and removes the awkward "Level 0" label.

---

## 6. Before/After Summary

| Dimension | Current (5.5/10) | After R1–R6 (target 10/10) |
|-----------|------------------|----------------------------|
| Level authority | Ambiguous (members vs XP) | XP only (R1) |
| Action coverage | 1 action | Extensible source table (R2) |
| Churn handling | Unspecified | Event-sourced revert (R3) |
| Abuse protection | None | Verification + caps (R4) |
| Future feature hooks | None | Tiers + tunable curve (R5) |
| Start state | Level 0 (unranked) | Level 1 (founder) (R6) |

**Core principle:** the MVP should be *simple to implement* but *architected as if
advanced features already existed* — XP as the single ledger, actions as data,
events as the source of truth. That is what turns a redundant 5.5 into a durable 10.

---

## 7. Phased Implementation (5 Phases)

Each phase is **independently shippable** and **visually + manually verifiable**
— every behavior has an on-screen representation a human can confirm without
reading logs or code.

### Phase 1 — XP Ledger & Level 1 Start (R1, R6)
**Build:** Replace member-count leveling with an XP ledger. `Level = floor(totalXP / XP_PER_LEVEL)`. New co-op starts at **Level 1** with base founder XP.
**Verify visually:**
- Create a co-op → UI shows **Level 1** and an XP progress bar (e.g., 0 / 1,000).
- Add 1 member → bar animates **+500 XP** and shows "500 / 1,000 to Level 2."
- Add 2nd member → bar fills, co-op flips to **Level 2** with a level-up flash.

### Phase 2 — Extensible Action / XP Source Table (R2)
**Build:** Introduce the XP source table (data-driven). Ship member-registration row; structure ready for more.
**Verify visually:**
- Open an "XP Sources" / activity config view listing `Member registers = 500 XP`.
- Perform the action → activity feed shows the source name and the exact XP awarded.
- (Confirm the table is data, not hardcoded, by toggling a value and seeing the awarded XP change.)

### Phase 3 — Event-Sourced Activity Ledger (R4 partial)
**Build:** Every XP change is an append-only event (`member_joined`, etc.) rendered in a live activity feed.
**Verify visually:**
- Each member add appends a new row: `timestamp · member_joined · +500 XP · total 1,500`.
- Feed is chronological and auditable; replaying events reconstructs the current total.
- Manual check: sum all feed deltas == displayed total XP.

### Phase 4 — Churn / Demotion Handling (R3)
**Build:** Removing a member emits a negative XP event; level recomputes (supports multi-level drop).
**Verify visually:**
- At Level 2 (1,000 XP), remove a member → feed shows `-500 XP`, bar drops to 500.
- Remove enough to cross a boundary → co-op visibly **de-levels** (Level 2 → Level 1) with a downgrade indicator.
- Manual check: total XP == sum of all join/remove events; level matches `floor(total/1000)`.

### Phase 5 — Tiers, Abuse Guards & Caps (R5, R4)
**Build:** Add tier labels over the XP axis (Bronze/Silver/Gold), a real-member verification gate before XP is granted, and an optional per-co-op daily XP cap.
**Verify visually:**
- Cross a tier threshold → a **tier badge** appears/updates next to the level.
- Attempt to register a non-verified member → XP **not** granted; UI shows "verification required."
- Hit the daily cap → further actions show "Daily XP cap reached" and bar stays pinned; resets next day (verifiable via clock/manual reset).

---

### Phase → Recommendation Traceability

| Phase | Delivers | Rec |
|-------|----------|-----|
| 1 | XP authority + Level 1 start | R1, R6 |
| 2 | Multi-source XP table | R2 |
| 3 | Event-sourced ledger / feed | R4 |
| 4 | Churn revert + de-level | R3 |
| 5 | Tiers + verification + cap | R5, R4 |

Each phase ends in a manually confirmable UI state, so progress is observable at
every step and no phase ships "invisible" logic.

---

## 8. The 10/10 Plan (Consolidated)

The phased work above is the *how*. This section is the *plan* — the target
architecture, the measurable bar for "10/10," and the rollout that gets us there
without rewrites.

### 8.1 Target Architecture (end state)
```
                ┌─────────────────────────────────────────┐
                │            XP EVENT LOG (append-only)    │
                │  member_joined (+) · member_removed (−)  │
                │  action_x (+) · verification_gate        │
                └───────────────────┬─────────────────────┘
                                    │ sum of deltas
                                    ▼
                ┌─────────────────────────────────────────┐
                │   totalXP  ──►  Level = f(totalXP)        │
                │   (single source of truth, tunable curve) │
                └───────────────────┬─────────────────────┘
                                    │ overlay
                                    ▼
                ┌─────────────────────────────────────────┐
                │   Tiers (Bronze/Silver/Gold) · Badges     │
                │   Daily caps · Abuse guards               │
                └─────────────────────────────────────────┘
```
- **XP is the only level authority.** Level is derived solely from `totalXP`.
- **Actions are data.** Every in-app action is a row in an XP source table, not a
  hardcoded branch — new actions are config, not code.
- **Events are the source of truth.** The ledger is replayable and auditable,
  which is what makes churn/de-leveling correct by construction.
- **Tiers + guards** ride on top of the same axis; the per-level cost stays a
  constant that can later become a curve.

### 8.2 Acceptance Criteria — what "10/10" measurably means
| # | Criterion | How verified |
|---|-----------|--------------|
| A1 | Level is driven only by XP, never by raw member count (no double-count) | Unit test: given N events, level == `f(Σxp)`; member-count function deleted |
| A2 | ≥2 distinct XP sources exist via the source table | Flip a table value → awarded XP changes; no code edit |
| A3 | Removing a member reverts XP and can de-level | Phase 4 visual + `Σevents == totalXP` |
| A4 | Every XP change is an auditable, replayable event | Feed reconstructs total on replay |
| A5 | Tier badge updates at thresholds; abuse gate blocks unverified XP | Phase 5 visual |
| A6 | Founder starts at Level 1 (no "unranked" state) | Phase 1 visual |
| A7 | Each phase ships a manually verifiable UI state | Per-phase checklist above |

### 8.3 Rollout (maps to Section 7)
1. **Phase 1** → A1, A6 — ledger + Level 1 start.
2. **Phase 2** → A2 — source table.
3. **Phase 3** → A3 (ledger half), A4 — event log + feed.
4. **Phase 4** → A3 (churn half) — de-level.
5. **Phase 5** → A5 — tiers, verification, cap.

A phase is "done" only when its row in §8.2 is green.

### 8.4 Re-score
After Phases 1–5 land against the acceptance criteria, the system moves from
**5.5/10 → 10/10** because:
- the ambiguous double-count source of truth is eliminated (A1);
- it is genuinely multi-action and extensible (A2);
- churn is handled by design, not retrofitted (A3, A4);
- it has milestone structure and abuse bounds for future features (A5);
- the awkward Level 0 start is gone (A6);
- and every step is observable, so quality is provable, not assumed (A7).

**10 / 10 — a simple MVP that is architected as if advanced features already existed.**
