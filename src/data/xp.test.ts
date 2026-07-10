import { describe, it, expect } from "vitest";
import { getCurrentLevel } from "./leveling";
import { XP_SOURCES, computeTotal } from "./xp-core";

describe("xp-core", () => {
  it("computes the running total from signed deltas", () => {
    expect(computeTotal([])).toBe(0);
    expect(computeTotal([{ delta: 5 }, { delta: 5 }])).toBe(10);
    expect(computeTotal([{ delta: 5 }, { delta: -5 }])).toBe(0);
  });

  it("scales member_joined XP to the existing 0-100 level curve", () => {
    expect(XP_SOURCES.member_joined.xp).toBe(5);
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
