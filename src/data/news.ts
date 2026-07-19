// UI-facing news item shape. The data itself now lives per-cooperative in the
// `news` table (see `@/db/news`); this module is the shared type contract only.

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: "kabupaten" | "provinsi" | "kementerian" | "internal";
  sourceName: string;
  timestamp: string;
  pinned?: boolean;
}
