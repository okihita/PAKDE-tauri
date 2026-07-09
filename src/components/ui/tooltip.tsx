import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  description?: string;
  /** Wrapper display. Use "block w-full" for full-width rows (sidebar), "inline-flex" for inline chips (profile). */
  className?: string;
  children: ReactNode;
}

/**
 * Lightweight hover tooltip — single source of truth for the app's tooltip
 * look (dark slate bubble with a bold label + optional muted description),
 * matching the business-type chips on the profile screen.
 */
export function Tooltip({ label, description, className, children }: TooltipProps) {
  return (
    <span className={cn("group/tip relative hover:z-10", className)}>
      {children}
      <span className="absolute bottom-full left-1/2 z-10 mb-1 min-w-48 max-w-64 -translate-x-1/2 rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-center opacity-0 shadow-lg transition-opacity duration-100 group-hover/tip:opacity-100 pointer-events-none">
        <span className="block text-xxxs font-bold text-slate-200">{label}</span>
        {description && <span className="mt-0.5 block text-xxxs leading-relaxed text-slate-500">{description}</span>}
      </span>
    </span>
  );
}
