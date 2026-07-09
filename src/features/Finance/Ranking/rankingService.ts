import type { CooperativeProfile } from "@/types";

export type RankingScope = "kabupaten" | "provinsi" | "nasional";
export type RankingMetric = "health" | "growth" | "membership" | "impact";

export interface RankedCoop {
  rank: number;
  name: string;
  village: string;
  score: number;
  ragStatus: string;
  trend: "up" | "down" | "stable";
  isOurs: boolean;
}

export interface Leaderboard {
  scope: RankingScope;
  metric: RankingMetric;
  items: RankedCoop[];
  ourRank: number | null;
  total: number;
  updatedAt: number;
}

export class OfflineError extends Error {
  constructor() {
    super("ranking service is offline");
    this.name = "OfflineError";
  }
}

/**
 * Transport-agnostic contract for the federated ranking node.
 * The current build ships MockRankingService (data is simulated, connectivity
 * is REAL via navigator.onLine). A future FederatedRankingService drops in here
 * without touching the UI or the useRanking hook.
 */
export interface RankingService {
  fetchLeaderboard(scope: RankingScope, metric: RankingMetric, coop: CooperativeProfile | null): Promise<Leaderboard>;
  submitStats(coop: CooperativeProfile | null): Promise<{ accepted: boolean }>;
}

interface BaseCoop {
  name: string;
  village: string;
  health: number;
  ragStatus: string;
}

// Static seed cooperatives per scope. Metric scores are derived deterministically
// from these base health values so re-renders never flicker (no Math.random in data).
const BASE: Record<RankingScope, BaseCoop[]> = {
  kabupaten: [
    { name: "KSU Guyub Rukun", village: "Desa Sooko", health: 94, ragStatus: "Hijau" },
    { name: "KUD Sumber Makmur", village: "Desa Gondang", health: 91, ragStatus: "Hijau" },
    { name: "Koperasi Tani Jaya", village: "Desa Kemlagi", health: 88, ragStatus: "Hijau" },
    { name: "KSP Mitra Usaha", village: "Desa Gedeg", health: 85, ragStatus: "Hijau" },
    { name: "KUD Tani Subur", village: "Desa Dawarblandong", health: 82, ragStatus: "Hijau" },
    { name: "KSU Bina Sejahtera", village: "Desa Jetis", health: 79, ragStatus: "Hijau" },
    { name: "Koperasi Serba Usaha Mapan", village: "Desa Puri", health: 76, ragStatus: "Kuning" },
    { name: "KSP Surya Mandiri", village: "Desa Trowulan", health: 72, ragStatus: "Kuning" },
    { name: "KUD Harapan Tani", village: "Desa Bangsal", health: 70, ragStatus: "Kuning" },
    { name: "KSU Sejahtera Abadi", village: "Desa Mojoanyar", health: 68, ragStatus: "Kuning" },
    { name: "Koperasi Wanita Kartini", village: "Desa Pungging", health: 65, ragStatus: "Kuning" },
    { name: "KSP Gotong Royong", village: "Desa Ngoro", health: 63, ragStatus: "Kuning" },
    { name: "KUD Mekar Tani", village: "Desa Kutorejo", health: 60, ragStatus: "Kuning" },
    { name: "KSU Mutiara Desa", village: "Desa Dlanggu", health: 57, ragStatus: "Merah" },
    { name: "Koperasi Simpan Pinjam Rukun", village: "Desa Pacet", health: 54, ragStatus: "Merah" },
    { name: "KUD Lestari Makmur", village: "Desa Trawas", health: 51, ragStatus: "Merah" },
    { name: "KSP Barokah", village: "Desa Jatirejo", health: 48, ragStatus: "Merah" },
    { name: "KSU Sido Makmur", village: "Desa Gondang", health: 45, ragStatus: "Merah" },
    { name: "KUD Karya Tani", village: "Desa Kemlagi", health: 42, ragStatus: "Merah" },
    { name: "KSP Sumber Rejeki", village: "Desa Mojoanyar", health: 39, ragStatus: "Merah" },
  ],
  provinsi: [
    { name: "KUD Sumber Makmur", village: "Kab. Mojokerto", health: 97, ragStatus: "Hijau" },
    { name: "KSU Guyub Rukun", village: "Kab. Mojokerto", health: 95, ragStatus: "Hijau" },
    { name: "KSP Bhakti Utama", village: "Kab. Malang", health: 93, ragStatus: "Hijau" },
    { name: "KUD Subur Tani", village: "Kab. Jombang", health: 90, ragStatus: "Hijau" },
    { name: "Koperasi Tani Jaya", village: "Kab. Mojokerto", health: 88, ragStatus: "Hijau" },
    { name: "KSP Mitra Usaha", village: "Kab. Mojokerto", health: 85, ragStatus: "Hijau" },
    { name: "KUD Mulyo Rejo", village: "Kab. Kediri", health: 83, ragStatus: "Hijau" },
    { name: "KSP Surya Cemerlang", village: "Kab. Sidoarjo", health: 81, ragStatus: "Hijau" },
    { name: "KSU Taman Sari", village: "Kota Surabaya", health: 78, ragStatus: "Kuning" },
    { name: "KUD Makmur Sentosa", village: "Kab. Gresik", health: 76, ragStatus: "Kuning" },
    { name: "Koperasi Serba Usaha Mapan", village: "Kab. Mojokerto", health: 74, ragStatus: "Kuning" },
    { name: "KSP Restu Bumi", village: "Kab. Pasuruan", health: 72, ragStatus: "Kuning" },
    { name: "KSU Bina Sejahtera", village: "Kab. Mojokerto", health: 70, ragStatus: "Kuning" },
    { name: "KUD Tani Subur", village: "Kab. Mojokerto", health: 68, ragStatus: "Kuning" },
  ],
  nasional: [
    { name: "KSP Bhakti Utama", village: "Jawa Timur", health: 99, ragStatus: "Hijau" },
    { name: "KUD Sumber Makmur", village: "Jawa Timur", health: 97, ragStatus: "Hijau" },
    { name: "Koperasi Serba Usaha Mandiri", village: "Jawa Barat", health: 96, ragStatus: "Hijau" },
    { name: "KUD Subur Tani", village: "Jawa Timur", health: 94, ragStatus: "Hijau" },
    { name: "KSU Guyub Rukun", village: "Jawa Timur", health: 93, ragStatus: "Hijau" },
    { name: "KSP Makmur Sentosa", village: "Jawa Tengah", health: 91, ragStatus: "Hijau" },
    { name: "KUD Mulyo Rejo", village: "Jawa Timur", health: 89, ragStatus: "Hijau" },
    { name: "Koperasi Tani Jaya", village: "Jawa Timur", health: 87, ragStatus: "Hijau" },
    { name: "KSU Taman Sari", village: "Jawa Timur", health: 85, ragStatus: "Hijau" },
    { name: "KSP Mitra Usaha", village: "Jawa Timur", health: 84, ragStatus: "Hijau" },
    { name: "KUD Sedyo Mukti", village: "DI Yogyakarta", health: 82, ragStatus: "Hijau" },
    { name: "KSU Bina Sejahtera", village: "Jawa Timur", health: 80, ragStatus: "Kuning" },
    { name: "KSP Surya Cemerlang", village: "Jawa Timur", health: 78, ragStatus: "Kuning" },
    { name: "KUD Makmur Sentosa", village: "Jawa Timur", health: 76, ragStatus: "Kuning" },
    { name: "Koperasi Serba Usaha Mapan", village: "Jawa Timur", health: 74, ragStatus: "Kuning" },
    { name: "KUD Sumber Rejeki", village: "Bali", health: 73, ragStatus: "Kuning" },
    { name: "KSP Karya Bersama", village: "Sumatera Utara", health: 71, ragStatus: "Kuning" },
    { name: "KSU Harapan Jaya", village: "Sulawesi Selatan", health: 69, ragStatus: "Kuning" },
    { name: "KUD Restu Bumi", village: "Jawa Timur", health: 67, ragStatus: "Kuning" },
    { name: "KSP Tani Subur", village: "Jawa Timur", health: 65, ragStatus: "Kuning" },
  ],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function metricScore(base: number, name: string, metric: RankingMetric): number {
  switch (metric) {
    case "health":
      return clamp(base);
    case "growth":
      return clamp(base + (hash(name) % 13) - 4);
    case "membership":
      return clamp(base + (hash(name) % 11) - 3);
    case "impact":
      return clamp(base + (hash(name) % 15) - 5);
  }
}

function trendFor(name: string, metric: RankingMetric, isOurs: boolean): "up" | "down" | "stable" {
  if (isOurs) return "up";
  const h = hash(name + metric);
  if (h % 4 === 0) return "stable";
  return h % 2 === 0 ? "up" : "down";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockRankingService implements RankingService {
  async fetchLeaderboard(
    scope: RankingScope,
    metric: RankingMetric,
    coop: CooperativeProfile | null,
  ): Promise<Leaderboard> {
    if (typeof navigator !== "undefined" && !navigator.onLine) throw new OfflineError();
    await delay(450 + Math.random() * 550);

    const ourName = coop?.name ?? "Koperasi Anda";
    const ourVillage = coop?.village ?? "Desa Anda";
    const ourHealth = coop?.health_score ?? 65;
    const ourRag = coop?.rag_status ?? "Kuning";

    const list: RankedCoop[] = BASE[scope].map((b) => ({
      rank: 0,
      name: b.name,
      village: b.village,
      score: metricScore(b.health, b.name, metric),
      ragStatus: b.ragStatus,
      trend: trendFor(b.name, metric, false),
      isOurs: false,
    }));

    list.push({
      rank: 0,
      name: ourName,
      village: ourVillage,
      score: metricScore(ourHealth, ourName, metric),
      ragStatus: ourRag,
      trend: "up",
      isOurs: true,
    });

    list.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    // Competition ranking (ties share a rank).
    let lastScore = Number.NaN;
    let lastRank = 0;
    for (const c of list) {
      if (c.score !== lastScore) {
        lastRank += 1;
        lastScore = c.score;
      }
      c.rank = lastRank;
    }

    const ourRank = list.find((c) => c.isOurs)?.rank ?? null;
    return { scope, metric, items: list, ourRank, total: list.length, updatedAt: Date.now() };
  }

  async submitStats(_coop: CooperativeProfile | null): Promise<{ accepted: boolean }> {
    if (typeof navigator !== "undefined" && !navigator.onLine) throw new OfflineError();
    await delay(500 + Math.random() * 400);
    return { accepted: true };
  }
}
