import { describe, it, expect, beforeEach, vi } from "vitest";

function makeFixture(villageCode: string) {
  const map: Record<string, { district_nama: string; regency_nama: string; province_nama: string }> = {
    "18.02.01.2001": {
      district_nama: "Kalirejo",
      regency_nama: "Kabupaten Lampung Tengah",
      province_nama: "Lampung",
    },
    "64.74.01.1002": {
      district_nama: "Bontang Utara",
      regency_nama: "Kota Bontang",
      province_nama: "Kalimantan Timur",
    },
    "73.71.01.1001": {
      district_nama: "Mariso",
      regency_nama: "Kota Makassar",
      province_nama: "Sulawesi Selatan",
    },
  };
  const nameFor = (code: string) =>
    code === "18.02.01.2001" ? "Sri Way Langsep" : code === "64.74.01.1002" ? "Bontang Baru" : "Bontorannu";
  const f = map[villageCode] ?? {
    district_nama: "Kec. X",
    regency_nama: "Kab. Y",
    province_nama: "Prov. Z",
  };
  return [
    {
      kode: villageCode,
      nama: nameFor(villageCode),
      district_nama: f.district_nama,
      regency_nama: f.regency_nama,
      province_nama: f.province_nama,
    },
  ];
}

vi.mock("@/db/wilayah-init", () => ({
  getWilayahDb: async () => ({
    select: async (query: string, params: string[]) => {
      if (query.includes("WHERE v.kode = ?")) {
        return makeFixture(params[0]);
      }
      if (query.includes("level = 4 AND kode = ?")) {
        const code = params[0];
        return [{ kode: code, nama: makeFixture(code)[0].nama, level: 4 }];
      }
      if (query.includes("ORDER BY RANDOM()")) {
        return [{ kode: "35.01.01.2001", nama: "Sidoarjo", level: 4 }];
      }
      return [];
    },
  }),
}));

import {
  resolveWilayah,
  formatWilayahShort,
  formatWilayahFull,
  getVillageByCode,
  pickRandomVillageInRegency,
  clearWilayahCache,
} from "@/db/wilayahLookup";

describe("wilayahLookup.resolveWilayah", () => {
  beforeEach(() => clearWilayahCache());

  it("resolves the three confirmed demo village codes", async () => {
    const cases: [string, string, string, string, string][] = [
      ["18.02.01.2001", "Sri Way Langsep", "Kalirejo", "Kabupaten Lampung Tengah", "Lampung"],
      ["64.74.01.1002", "Bontang Baru", "Bontang Utara", "Kota Bontang", "Kalimantan Timur"],
      ["73.71.01.1001", "Bontorannu", "Mariso", "Kota Makassar", "Sulawesi Selatan"],
    ];
    for (const [code, village, district, regency, province] of cases) {
      const res = await resolveWilayah(code);
      expect(res).not.toBeNull();
      if (!res) continue;
      expect(res.village_code).toBe(code);
      expect(res.village_name).toBe(village);
      expect(res.district_name).toBe(district);
      expect(res.regency_name).toBe(regency);
      expect(res.province_name).toBe(province);
      expect(res.district_code).toBe(code.slice(0, 8));
      expect(res.regency_code).toBe(code.slice(0, 5));
      expect(res.province_code).toBe(code.slice(0, 2));
    }
  });

  it("returns null for empty/undefined codes", async () => {
    expect(await resolveWilayah("")).toBeNull();
    expect(await resolveWilayah(null)).toBeNull();
    expect(await resolveWilayah(undefined)).toBeNull();
  });

  it("caches results per code", async () => {
    const first = await resolveWilayah("18.02.01.2001");
    const second = await resolveWilayah("18.02.01.2001");
    expect(second).toBe(first);
  });
});

describe("wilayahLookup.formatters", () => {
  beforeEach(() => clearWilayahCache());

  it("formats short and full labels", async () => {
    const res = await resolveWilayah("18.02.01.2001");
    expect(formatWilayahShort(res)).toBe("Desa Sri Way Langsep, Kec. Kalirejo");
    expect(formatWilayahFull(res)).toBe("Desa Sri Way Langsep, Kec. Kalirejo, Kab. Lampung Tengah, Lampung");
  });

  it("formats null as dash", () => {
    expect(formatWilayahShort(null)).toBe("-");
    expect(formatWilayahFull(null)).toBe("-");
  });
});

describe("wilayahLookup lookups", () => {
  it("gets a village by exact code", async () => {
    const row = await getVillageByCode("35.01.01.2001");
    expect(row?.kode).toBe("35.01.01.2001");
  });

  it("picks a random village in a regency prefix", async () => {
    const row = await pickRandomVillageInRegency("35.01");
    expect(row?.kode.startsWith("35.01.")).toBe(true);
  });
});
