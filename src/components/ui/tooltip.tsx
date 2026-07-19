import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  /** Wrapper display. Use "block w-full" for full-width rows (sidebar), "inline-flex" for inline chips (profile). */
  className?: string;
  children: ReactNode;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

/**
 * Lightweight hover tooltip — single source of truth for the app's tooltip
 * look (dark slate bubble with a bold label + optional muted description),
 * matching the business-type chips on the profile screen.
 */
export function Tooltip({ label, description, side = "top", className, children }: TooltipProps) {
  return (
    <span className={cn("group/tip relative hover:z-30 select-none", className)}>
      {children}
      <span
        className={cn(
          "absolute z-50 w-max min-w-20 max-w-64 rounded-md border border-slate-700/80 bg-slate-900/95 px-2.5 py-1.5 text-center opacity-0 shadow-xl backdrop-blur-md transition-opacity duration-150 group-hover/tip:opacity-100 pointer-events-none select-none",
          SIDE_CLASSES[side],
        )}
      >
        <span className="block text-xxxs font-bold text-slate-100 leading-tight">{label}</span>
        {description && <span className="mt-0.5 block text-xxxs leading-relaxed text-slate-400">{description}</span>}
      </span>
    </span>
  );
}
