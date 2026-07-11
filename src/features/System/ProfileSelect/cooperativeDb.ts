import { createRegistryRepository, getRegistryDb, getCoopDb, initCoopDb } from "@/db";
import type { CooperativeProfile, EwsAlert } from "@/types";

const coopRepo = createRegistryRepository<CooperativeProfile>("cooperatives");

export interface CreateCooperativeInput {
  name: string;
  legalId: string;
  address: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  villageCode?: string;
  postalCode: string;
  phone: string;
  email: string;
  chairman: string;
  secretary: string;
  treasurer: string;
  supervisor: string;
  unitPupuk: boolean;
  unitSimpanPinjam: boolean;
  unitToko: boolean;
  foundedDate: string;
  category: string;
}

export async function createCooperative(input: CreateCooperativeInput): Promise<CooperativeProfile> {
  const newId = crypto.randomUUID();

  const units: string[] = [];
  if (input.unitPupuk) units.push("unit_pupuk");
  if (input.unitSimpanPinjam) units.push("unit_simpan_pinjam");
  if (input.unitToko) units.push("unit_toko_desa");

  const officersJson = JSON.stringify({
    chairman: input.chairman.trim(),
    secretary: input.secretary.trim(),
    treasurer: input.treasurer.trim(),
    supervisor: input.supervisor.trim(),
  });

  await coopRepo.insert(newId, {
    name: input.name.trim(),
    legal_id: input.legalId.trim() || null,
    address: input.address.trim() || null,
    village: input.village.trim() || null,
    district: input.district.trim() || null,
    regency: input.regency.trim(),
    province: input.province.trim(),
    village_code: input.villageCode?.trim() || null,
    postal_code: input.postalCode.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    business_units: JSON.stringify(units),
    officers: officersJson,
    health_score: 10.0,
    rag_status: "Merah",
    xp: 10,
    founded_date: input.foundedDate.trim() || null,
    category: input.category,
  });

  const rows = await coopRepo.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [newId]);
  if (rows.length === 0) throw new Error("Failed to verify cooperative creation.");

  // Provision this cooperative's own data file before any feature writes to it.
  await initCoopDb(newId);

  return rows[0];
}

export async function listCooperatives(): Promise<CooperativeProfile[]> {
  const db = await getRegistryDb();
  return db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE is_demo = 0 ORDER BY created_at DESC");
}

export async function getCooperativeById(id: string): Promise<CooperativeProfile | null> {
  const db = await getRegistryDb();
  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE id = ?", [id]);
  return rows.length > 0 ? rows[0] : null;
}

/** Returns the seeded demo cooperative, or null if not yet seeded. */
export async function getDemoCooperative(): Promise<CooperativeProfile | null> {
  const db = await getRegistryDb();
  const rows = await db.select<CooperativeProfile[]>("SELECT * FROM cooperatives WHERE is_demo = 1 LIMIT 1");
  return rows.length > 0 ? rows[0] : null;
}

/** Number of members registered under a cooperative. */
export async function getMemberCount(cooperativeId: string): Promise<number> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<Array<{ count: number }>>("SELECT COUNT(*) AS count FROM members");
  return rows[0]?.count ?? 0;
}

/** Active (unresolved) EWS alerts for a cooperative, used by the shell badge. */
export async function getActiveEwsAlerts(cooperativeId: string): Promise<EwsAlert[]> {
  const db = await getCoopDb(cooperativeId);
  return db.select<EwsAlert[]>("SELECT * FROM ews_alerts WHERE is_active = 1");
}

/** Cooperative net worth (Assets − Liabilities) from the chart of accounts. */
export async function getNetWorth(cooperativeId: string): Promise<number> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<Array<{ assets: number; liabilities: number }>>(
    `SELECT
        COALESCE(SUM(CASE WHEN type = 'aset' THEN balance ELSE 0 END), 0) AS assets,
        COALESCE(SUM(CASE WHEN type = 'kewajiban' THEN balance ELSE 0 END), 0) AS liabilities
      FROM coa_accounts`,
  );
  const r = rows[0];
  if (!r) return 0;
  return r.assets - r.liabilities;
}

export type AlertSeverity = "info" | "warning" | "critical";

/** Live headline stats for the persistent top-bar status cluster. */
export interface TopBarStats {
  /** Assets − Liabilities from the chart of accounts. */
  netWorth: number;
  /** Number of community events in the trailing window. */
  eventCount: number;
  /** Average attendees per event over the trailing window. */
  avgParticipants: number;
  /** Count of active (unresolved) EWS alerts. */
  alertCount: number;
  /** Worst active alert severity, or null when none. */
  worstSeverity: AlertSeverity | null;
}

/**
 * "Community Liveliness": how bustling the co-op is. Counts events in the last
 * `days` and the total attendance (parsed from the `participant_ids` JSON
 * array), so it reflects both frequency and turnout.
 */
export async function getCommunityLiveliness(
  cooperativeId: string,
  days = 30,
): Promise<{ eventCount: number; avgParticipants: number }> {
  const db = await getCoopDb(cooperativeId);
  const rows = await db.select<Array<{ event_count: number; participant_sum: number }>>(
    `SELECT
        COUNT(*) AS event_count,
        COALESCE(SUM(CASE WHEN json_valid(participant_ids)
                          THEN json_array_length(participant_ids) ELSE 0 END), 0) AS participant_sum
      FROM events
      WHERE date >= date('now', '-' || ? || ' days')`,
    [days],
  );
  const r = rows[0] ?? { event_count: 0, participant_sum: 0 };
  const avgParticipants = r.event_count > 0 ? r.participant_sum / r.event_count : 0;
  return { eventCount: r.event_count, avgParticipants };
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { info: 1, warning: 2, critical: 3 };

/** Aggregate the three headline meters into a single call (one DB open). */
export async function getTopBarStats(cooperativeId: string): Promise<TopBarStats> {
  const [netWorth, liveliness, alerts] = await Promise.all([
    getNetWorth(cooperativeId),
    getCommunityLiveliness(cooperativeId),
    getActiveEwsAlerts(cooperativeId),
  ]);

  let worstSeverity: AlertSeverity | null = null;
  for (const a of alerts) {
    if (SEVERITY_ORDER[a.level] > (worstSeverity ? SEVERITY_ORDER[worstSeverity] : 0)) {
      worstSeverity = a.level;
    }
  }

  return {
    netWorth,
    eventCount: liveliness.eventCount,
    avgParticipants: liveliness.avgParticipants,
    alertCount: alerts.length,
    worstSeverity,
  };
}
