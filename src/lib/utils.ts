import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Today's date as `YYYY-MM-DD`. Pass a Date to format any date the same way. */
export function todayISO(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Compact Indonesian Rupiah formatter for tight spaces (e.g. "Rp 1,2 jt"). */
export function formatCompactRupiah(value: number, omitSymbol: boolean = false): string {
  const prefix = omitSymbol ? "" : "Rp ";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `${prefix}${n.toFixed(abs % 1_000_000_000 === 0 ? 0 : 1).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `${prefix}${n.toFixed(abs % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} jt`;
  }
  if (abs >= 1_000) return `${prefix}${Math.round(value / 1_000)} rb`;
  return `${prefix}${value}`;
}

/** Platform check for macOS / iOS device detection. */
export const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
