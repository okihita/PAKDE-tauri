// ── RAG (Red/Amber/Green) status normalization & presentation ──
//
// The cooperative's operational health is expressed both as a 0–100
// `health_score` and a stored `rag_status` string. The stored value is
// inconsistent across the codebase (Indonesian "Merah/Kuning/Hijau" in seeds,
// English "red/yellow/green" as the registry default), so this module is the
// single source of truth that normalizes either form and maps it to the
// translated label, rating band, and color classes used by the UI.

export type RagBand = "merah" | "kuning" | "hijau";

const RAG_BY_KEY: Record<string, RagBand> = {
  merah: "merah",
  red: "merah",
  kuning: "kuning",
  yellow: "kuning",
  hijau: "hijau",
  green: "hijau",
};

/** Normalize a stored rag_status string (any language/case) to a band. */
export function normalizeRag(raw: string | null | undefined): RagBand | null {
  if (!raw) return null;
  return RAG_BY_KEY[raw.trim().toLowerCase()] ?? null;
}

/** Derive a band from a 0–100 health score (matches the rest of the app). */
export function ragFromScore(score: number): RagBand {
  if (score < 40) return "merah";
  if (score < 70) return "kuning";
  return "hijau";
}

/** Prefer the explicit stored status, fall back to the score. */
export function resolveRag(raw: string | null | undefined, score = 0): RagBand {
  return normalizeRag(raw) ?? ragFromScore(score);
}

export interface RagMeta {
  /** Short status label key: Merah / Kuning / Hijau */
  labelKey: string;
  /** Rating-band label key: Kurang Sehat / Cukup Sehat / Sehat */
  ratingKey: string;
  dotClass: string;
  textClass: string;
  barClass: string;
}

const RAG_META: Record<RagBand, RagMeta> = {
  merah: {
    labelKey: "sidebar.ragMerah",
    ratingKey: "sidebar.ragRatingKurangSehat",
    dotClass: "bg-danger",
    textClass: "text-danger",
    barClass: "bg-danger",
  },
  kuning: {
    labelKey: "sidebar.ragKuning",
    ratingKey: "sidebar.ragRatingCukupSehat",
    dotClass: "bg-warning",
    textClass: "text-warning",
    barClass: "bg-warning",
  },
  hijau: {
    labelKey: "sidebar.ragHijau",
    ratingKey: "sidebar.ragRatingSehat",
    dotClass: "bg-success",
    textClass: "text-success",
    barClass: "bg-success",
  },
};

export function ragMeta(band: RagBand): RagMeta {
  return RAG_META[band];
}
