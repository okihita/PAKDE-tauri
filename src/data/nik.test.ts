import { describe, it, expect } from "vitest";
import { generateNik, isValidNik, parseNik, areaFromVillageCode } from "@/data/nik";

describe("nik.areaFromVillageCode", () => {
  it("strips dots from the first 6 digits of the village code", () => {
    expect(areaFromVillageCode("35.01.01.2001")).toBe("350101");
    expect(areaFromVillageCode("18.02.01.2001")).toBe("180201");
  });
});

describe("nik.generateNik", () => {
  it("builds a 16-digit NIK for a male", () => {
    // 35.01.01 + day 15 + month 05 + year 90 + seq 0001
    expect(generateNik("35.01.01.2001", "1990-05-15", "L", 1)).toBe("3501011505900001");
  });

  it("adds 40 to the day for a female", () => {
    // day 15 -> 55
    expect(generateNik("35.01.01.2001", "1990-05-15", "P", 1)).toBe("3501015505900001");
  });

  it("zero-pads month, day, and sequence", () => {
    expect(generateNik("18.02.01.2001", "2000-01-03", "L", 42)).toBe("1802010301000042");
  });

  it("handles year rollover via 2-digit year", () => {
    expect(generateNik("73.71.01.1001", "1985-12-31", "P", 9999)).toBe("7371017112859999");
  });
});

describe("nik.isValidNik", () => {
  it("accepts a valid male NIK", () => {
    expect(isValidNik("3501011505900001")).toBe(true);
  });

  it("accepts a valid female NIK (day 41-71)", () => {
    expect(isValidNik("3501015505900001")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidNik("350101150590")).toBe(false); // 12
    expect(isValidNik("350101150590001")).toBe(false); // 15
  });

  it("rejects invalid month", () => {
    expect(isValidNik("3501011599900001")).toBe(false);
  });

  it("rejects a male day above 31", () => {
    expect(isValidNik("3501013205900001")).toBe(false);
  });

  it("rejects zero sequence", () => {
    expect(isValidNik("3501011505900000")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(isValidNik("350101150590000X")).toBe(false);
  });
});

describe("nik.parseNik", () => {
  it("parses a male NIK", () => {
    expect(parseNik("3501011505900001")).toEqual({
      area: "350101",
      gender: "L",
      birthDay: 15,
      birthMonth: 5,
      birthYear: 90,
      seq: 1,
    });
  });

  it("parses a female NIK (day offset removed)", () => {
    const p = parseNik("3501015505900001");
    expect(p?.gender).toBe("P");
    expect(p?.birthDay).toBe(15);
  });

  it("returns null for invalid input", () => {
    expect(parseNik("123")).toBeNull();
  });
});

describe("nik round-trip", () => {
  it("generated NIKs are valid", () => {
    const male = generateNik("18.02.01.2001", "1995-08-20", "L", 7);
    const female = generateNik("64.74.01.1002", "1988-11-09", "P", 12);
    expect(isValidNik(male)).toBe(true);
    expect(isValidNik(female)).toBe(true);
    expect(male.length).toBe(16);
    expect(female.length).toBe(16);
  });
});
