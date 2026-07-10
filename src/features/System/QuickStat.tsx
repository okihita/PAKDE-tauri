import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Compact, clickable stat tile that navigates to a related menu. */
export function QuickStat({
  icon: Icon,
  label,
  value,
  onClick,
  disabled,
  title,
  className,
}: {
  icon: ComponentType<{ className?: string }> | null;
  label: string;
  value: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const interactive = !!onClick && !disabled;
  const cls = cn(
    "flex flex-col gap-0.5 rounded-lg bg-secondary/40 px-2 py-1.5 min-w-0 text-left transition-colors",
    interactive && "cursor-pointer hover:bg-secondary",
    disabled && "opacity-50 cursor-not-allowed",
    className,
  );
  const content = (
    <>
      <span className="flex items-center gap-1 text-xxxs text-muted-foreground truncate">
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        {label}
      </span>
      <span className="text-xxs font-bold text-foreground font-mono truncate">{value}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} className={cls}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}
