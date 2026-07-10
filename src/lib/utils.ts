import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact Indonesian Rupiah formatter for tight spaces (e.g. "Rp 1,2 jt"). */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `Rp ${n.toFixed(abs % 1_000_000_000 === 0 ? 0 : 1).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `Rp ${n.toFixed(abs % 1_000_000 === 0 ? 0 : 1).replace(".", ",")} jt`;
  }
  if (abs >= 1_000) return `Rp ${Math.round(value / 1_000)} rb`;
  return `Rp ${value}`;
}
