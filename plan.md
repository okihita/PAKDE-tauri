# Level-Up Popup – Plan (Revised v2)

## Problem
When a user adds a member, XP increases (+5 per member via `awardXp`). If the
new total crosses a level threshold, nothing signals the user. The level change
is silent.

## Goal
When adding a member causes the cooperative to reach a higher tier, show a
celebratory dialog:

> "Koperasi Anda sekarang sudah masuk tier X – Label. Menu Leaderboard terbuka
> jika ada sinkron online."

## Architecture

### Detection point
`useMembers.ts` → `handleMemberFormSubmit` → inside the `try` block after
`awardXp()` succeeds. `awardXp()` returns `Promise<number>` (the new XP total).
We compare `getCurrentLevel(oldXp).tier` against `getCurrentLevel(newXp).tier`.

### Stale XP problem (review feedback #2)
`handleMemberFormSubmit` is a plain closure, not wrapped in `useCallback`. If
two rapid submits happen before `refreshMemberCount` propagates in App.tsx,
the second submit sees a stale `coopProfile.xp`.

**Fix:** Instead of passing `currentXp` as a prop, use a `useRef` inside
`useMembers` that is synced with the latest XP via an effect. On submit, read
the ref for `oldXp`. This eliminates the stale-closure race.

Actually **simpler fix:** Since `awardXp` writes the new total to the registry
DB (`cooperatives.xp`), we can simply re-read it after the award: the old XP is
whatever was last persisted, and `awardXp` also returns the new total after
applying its own delta. But for `oldXp`, we still need to know the XP *before*
this specific award. The simplest safe approach:

- Add an `xpRef` in `useMembers` synced from a new parameter `xpSignal: number`
- On `awardXp` success, compare `getCurrentLevel(xpRef.current).tier < getCurrentLevel(newTotal).tier`

### Level-up state
Return `levelUp: LevelDef | null` (full `LevelDef` object, per review
feedback #4 & suggestion #1). This lets the dialog access `tier`, `labelEn`,
`labelId`, `color`, `bgClass` for styling.

### Detection scope (review feedback #6)
Only triggered in the `add` branch (not on edit). `removeMemberXp` does NOT
trigger a level-down dialog (per spec).

### Error path (review feedback #3)
Level-up detection is ONLY inside the `try` block, after `awardXp` succeeds:

```ts
if (memberFormType === "add") {
  await membersRepo.insert(id, columns);
  try {
    const newTotalXp = await awardXp(...);
    // ── level-up detection here ──
    const oldLevel = getCurrentLevel(xpRef.current).tier;
    const newLevel = getCurrentLevel(newTotalXp).tier;
    if (newLevel > oldLevel) {
      setLevelUp(getCurrentLevel(newTotalXp));
    }
  } catch (e) {
    // existing error handling; levelUp stays null
  }
}
```

### Extracted helper (review suggestion #3)
Add to `src/data/leveling.ts`:
```ts
export function detectLevelUp(oldXp: number, newXp: number): LevelDef | null {
  const oldLevel = getCurrentLevel(oldXp);
  const newLevel = getCurrentLevel(newXp);
  return newLevel.tier > oldLevel.tier ? newLevel : null;
}
```

### UI Dialog
Rendered in `Members.tsx`, same Radix Dialog pattern as the delete-confirmation
dialog. Props: `open`, `levelUp: LevelDef | null`, `onClose`.

## Files to change

| File | Change |
|------|--------|
| `src/data/leveling.ts` | Add `detectLevelUp(oldXp, newXp)` helper |
| `src/hooks/useMembers.ts` | Add `xpRef` synced from `xpSignal` param; capture `newTotalXp` from `awardXp`; detect level-up in try block; return `levelUp` / `clearLevelUp` |
| `src/features/Community/Members/Members.tsx` | Accept `xp` prop; pass to `useMembers`; render `LevelUpDialog` |
| `src/App.tsx` | Pass `coopProfile?.xp ?? 0` as `xp` prop to `<Members>` |
| `src/i18n/locales/id.json` | Add `levelUp` keys |
| `src/i18n/locales/en.json` | Add `levelUp` keys |

## Edge cases
- **De-level on member removal:** Not addressed (spec only covers member add).
- **Multi-tier skip:** Single member add = 5 XP, tier thresholds spaced 10 XP
  apart. Single add can cross at most one threshold. `oldTier < newTier` works.
- **XP > 100:** `getCurrentLevel` returns last matching level (tier 10).
  No overflow issues.
- **awardXp throws:** Detection is inside the `try`; `levelUp` stays null.

## Verification
1. Add member crossing a tier boundary → popup appears
2. Add member NOT crossing a tier → no popup
3. Edit a member → no popup
4. Close popup → `levelUp` clears
5. Two rapid adds → ref-based XP stays current; second add detects correctly
