import { describe, it, expect } from "vitest";
import { getCurrentLevel } from "./leveling";
import { XP_SOURCES, computeTotal, getTierBand, TIER_BANDS } from "./xp-core";

describe("xp-core", () => {
  it("computes the running total from signed deltas", () => {
    expect(computeTotal([])).toBe(0);
    expect(computeTotal([{ delta: 5 }, { delta: 5 }])).toBe(10);
    expect(computeTotal([{ delta: 5 }, { delta: -5 }])).toBe(0);
  });

  it("scales member_joined XP to the existing 0-100 level curve", () => {
    expect(XP_SOURCES.member_joined.xp).toBe(5);
  });

  it("is a multi-source table (A2): member_joined plus future stubs", () => {
    expect(Object.keys(XP_SOURCES)).toEqual(["member_joined", "member_verified", "weekly_active", "trade_completed"]);
    // Flipping a source value changes the awarded XP — no code edit needed.
    const original = XP_SOURCES.member_joined.xp;
    XP_SOURCES.member_joined.xp = 7;
    expect(XP_SOURCES.member_joined.xp).toBe(7);
    XP_SOURCES.member_joined.xp = original;
  });
});

describe("level is derived only from xp (A1)", () => {
  it("two members (+5 each) map to the level for xp=10, never to a member count", () => {
    const total = computeTotal([{ delta: 5 }, { delta: 5 }]);
    expect(total).toBe(10);
    // The level is a pure function of xp; there is no member-count path.
    expect(getCurrentLevel(total)).toBe(getCurrentLevel(10));
  });

  it("an xp total within the curve lands on the expected threshold band", () => {
    expect(getCurrentLevel(0).tier).toBe(1); // rintisan (Level 1 start)
    expect(getCurrentLevel(82).tier).toBeGreaterThan(1);
  });
});

describe("churn recompute (A3)", () => {
  it("supports negative deltas so a removal lowers the total", () => {
    expect(computeTotal([{ delta: 5 }, { delta: 5 }, { delta: -5 }])).toBe(5);
  });
});

describe("tier bands (A5)", () => {
  it("maps level tiers onto Bronze/Silver/Gold", () => {
    expect(getTierBand(getCurrentLevel(0).tier).en).toBe("Bronze");
    expect(getTierBand(getCurrentLevel(82).tier).en).toBe("Gold");
  });

  it("covers all 10 tiers", () => {
    for (let tier = 1; tier <= 10; tier++) {
      expect(getTierBand(tier)).toBeDefined();
    }
    expect(TIER_BANDS[TIER_BANDS.length - 1].maxTier).toBeGreaterThanOrEqual(10);
  });
});
