# Plan: Wire Remaining XP Sources (Hackathon Demo)

**Goal:** Make the gamification XP system visibly multi-source. Today only
`member_joined` is wired; `member_verified`, `weekly_active`, and
`trade_completed` (defined in `src/data/xp-core.ts`) are dead data.

**Constraint:** Dead simple. No new architecture, no background timers, no new
backend. Each source maps to a natural, already-existing user action so it is
demoable in seconds. Abuse guards (`REQUIRE_VERIFICATION`, `DAILY_XP_CAP`) stay
OFF — this is a demo.

---

## Source-by-source

### 1. `trade_completed` (+3 XP) — POS sale
**Trigger:** successful `processCheckout` in `src/hooks/useSales.ts`.
**Wiring:** after the sale commits and `toast.success(checkoutSuccess)` fires,
call `awardXp(getActiveCoopId(), "trade_completed", { txId })`. Guard failure
with try/catch (don't break the sale).

Demo: open Sales → checkout a cart → XP +3, feed shows "Cooperative completes a
trade".

### 2. `member_verified` (+2 XP) — valid identity on member add
**Trigger:** member created with a fully valid NIK (`isValidNik` true).
**Wiring:** in `useMembers.ts` `handleMemberFormSubmit`, right after the
existing `awardXp(..., "member_joined", ...)` call, add a second
`awardXp(getActiveCoopId(), "member_verified", { memberId: id })` guarded by
`try/catch`. Since add already requires `isValidNik`, every new member is
"verified" for the demo.

Demo: add a member → XP +5 (joined) then +2 (verified) → feed shows both.

### 3. `weekly_active` (+1 XP) — manual weekly check-in
**Trigger:** user clicks a "Klaim Bonus Mingguan" button on Beranda (Home).
**Why manual:** a real weekly timer can't be demoed on demand. A button is
on-demand, no background process, and still demonstrates the source firing.
**Wiring:**
- Add helper `canClaimWeeklyXp(coopId)` in `src/data/xp.ts` that reads
  `getXpEvents`, finds the latest `weekly_active` event, and returns `true` if
  none exists or its `createdAt` is in a different ISO week (YYYY-Www) than now.
- On Beranda, add a small button (visible when `canClaimWeeklyXp` is true) that
  calls `awardXp(coopId, "weekly_active")` then refreshes the XP display.

Demo: click button once → XP +1; button greys out until next week.

---

## Files touched
| File | Change |
|------|--------|
| `src/hooks/useSales.ts` | `awardXp` import + call in `processCheckout` |
| `src/hooks/useMembers.ts` | 2nd `awardXp` call (`member_verified`) in submit |
| `src/data/xp.ts` | add `canClaimWeeklyXp(coopId)` helper |
| `src/features/Home/Dashboard/Dashboard.tsx` | "Klaim Bonus Mingguan" button |

## Already handled (no work)
- `XpFeed.tsx` renders any `XP_SOURCES` action via its `labelEn`/`labelId` — new
  sources appear in the feed automatically. `weekly_active`/`trade_completed`/
  `member_verified` labels already exist in `xp-core.ts`.
- `removeMemberXp` only reverts `member_joined` (reversible: true). The other
  two are `reversible: false`, so no revert logic needed (matches design).

## Verification
1. `pnpm check` passes (tsc + lint + prettier).
2. Manual: fresh demo coop → add member (XP +7), do a sale (XP +3), click
   weekly bonus (XP +1). Open Leveling tab → feed lists all four source types
   with correct en/id labels.
3. Confirm `removeMemberXp` still only subtracts the `member_joined` 5 XP.

## Out of scope (future)
- `REQUIRE_VERIFICATION` / `DAILY_XP_CAP` gating for real deployments.
- Automated weekly cron, real identity-verification flow, server-side sync.
