/**
 * Indonesian KTP/Resident NIK utilities.
 *
 * NIK = 16 digits: PPRRDD + DDMMYY + NNNN
 *  - PPRRDD = first 6 digits of the (dot-stripped) village code
 *    = province(2) + regency(2) + district(2)
 *  - DDMMYY = birth date; females add 40 to the day (range 41–71)
 *  - NNNN   = sequential number within the area, from 0001
 */

export type Gender = "L" | "P";

function pad(value: number | string, width: number): string {
  return String(value).padStart(width, "0");
}

/** 6-digit area prefix derived from the dotted village code (e.g. `35.01.01.2001` → `350101`). */
export function areaFromVillageCode(villageCode: string): string {
  return villageCode.slice(0, 8).replace(/\./g, "");
}

export function generateNik(villageCode: string, birthDateISO: string, gender: Gender, seq: number): string {
  const area = areaFromVillageCode(villageCode);
  const [y, m, d] = birthDateISO.split("-").map(Number);
  const day = d + (gender === "P" ? 40 : 0);
  const yy = String(y).slice(-2);
  return `${area}${pad(day, 2)}${pad(m, 2)}${yy}${pad(seq, 4)}`;
}

export interface ParsedNik {
  area: string;
  gender: Gender;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  seq: number;
}

/** Best-effort read of a NIK's embedded fields. Does NOT validate. */
export function parseNik(nik: string): ParsedNik | null {
  if (!/^\d{16}$/.test(nik)) return null;
  const area = nik.slice(0, 6);
  const rawDay = Number(nik.slice(6, 8));
  const birthMonth = Number(nik.slice(8, 10));
  const birthYear = Number(nik.slice(10, 12));
  const seq = Number(nik.slice(12, 16));
  const gender: Gender = rawDay > 40 ? "P" : "L";
  const birthDay = rawDay > 40 ? rawDay - 40 : rawDay;
  return { area, gender, birthDay, birthMonth, birthYear, seq };
}

/**
 * Structural validity check (area/day/month/length). Does not require gender
 * context: a valid day is either 1–31 (male) or 41–71 (female).
 */
export function isValidNik(nik: string): boolean {
  if (!/^\d{16}$/.test(nik)) return false;
  const rawDay = Number(nik.slice(6, 8));
  const month = Number(nik.slice(8, 10));
  const seq = Number(nik.slice(12, 16));
  const dayOk = (rawDay >= 1 && rawDay <= 31) || (rawDay >= 41 && rawDay <= 71);
  const monthOk = month >= 1 && month <= 12;
  const seqOk = seq >= 1 && seq <= 9999;
  return dayOk && monthOk && seqOk;
}
