import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn, formatCompactRupiah } from "@/lib/utils";
import { createRepository } from "@/db";
import type { Member } from "@/types";

const membersRepo = createRepository<Member>("members", { createdAt: false });

export interface CommandAction {
  id: string;
  group: "quickActions" | "navigation" | "system";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandAction[];
  onOpenMember: (member: Member) => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = text.toLowerCase();
  // Subsequence match (keeps it dependency-free and forgiving of typos).
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}

const totalSimpanan = (m: Member) => (m.savings_pokok || 0) + (m.savings_wajib || 0) + (m.savings_sukarela || 0);

export default function CommandPaletteDialog({ open, onOpenChange, actions, onOpenMember }: CommandPaletteDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset transient state each time the palette is opened.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  // Load members (read-only) for the member-search group.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await membersRepo.list("ORDER BY name ASC");
        if (!cancelled) setMembers(rows);
      } catch {
        /* non-fatal: member search simply yields no results */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Filtered static actions + matched members, grouped in display order.
  const { items } = useMemo(() => {
    const q = query;
    const matchedActions = actions.filter(
      (a) =>
        fuzzyMatch(q, a.title) ||
        (a.subtitle && fuzzyMatch(q, a.subtitle)) ||
        (a.keywords && fuzzyMatch(q, a.keywords)),
    );

    const matchedMembers = members.filter((m) => fuzzyMatch(q, m.name) || fuzzyMatch(q, m.nik)).slice(0, 8);

    type Item =
      | { kind: "action"; group: CommandAction["group"]; data: CommandAction }
      | { kind: "member"; group: "members"; data: Member };

    const groups: { key: Item["group"]; entries: Item[] }[] = [
      {
        key: "quickActions",
        entries: matchedActions
          .filter((a) => a.group === "quickActions")
          .map((a) => ({ kind: "action", group: "quickActions", data: a })),
      },
      {
        key: "navigation",
        entries: matchedActions
          .filter((a) => a.group === "navigation")
          .map((a) => ({ kind: "action", group: "navigation", data: a })),
      },
      { key: "members", entries: matchedMembers.map((m) => ({ kind: "member", group: "members", data: m })) },
      {
        key: "system",
        entries: matchedActions
          .filter((a) => a.group === "system")
          .map((a) => ({ kind: "action", group: "system", data: a })),
      },
    ];

    const flat: Item[] = [];
    const order: Item["group"][] = [];
    const counts: Record<string, number> = {};
    for (const g of groups) {
      if (g.entries.length === 0) continue;
      order.push(g.key);
      counts[g.key] = g.entries.length;
      flat.push(...g.entries);
    }

    return { items: flat };
  }, [query, actions, members]);

  // Keep the active index within bounds when results change.
  useEffect(() => {
    setActiveIndex((i) => (i >= items.length ? 0 : i));
  }, [items.length]);

  // Ensure the highlighted row stays visible.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const runItem = useCallback(
    (item: (typeof items)[number]) => {
      if (item.kind === "action") item.data.run();
      else onOpenMember(item.data);
      onOpenChange(false);
    },
    [items, onOpenMember, onOpenChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) runItem(item);
    }
  };

  const groupLabel: Record<string, string> = {
    quickActions: t("commandPalette.groupQuickActions"),
    navigation: t("commandPalette.groupNavigation"),
    members: t("commandPalette.groupMembers"),
    system: t("commandPalette.groupSystem"),
  };

  // Map a flat index back to its group, for rendering section headers inline.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-xl top-[15%] translate-y-0 border-border bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onOpenAutoFocus={(e) => {
          // Radix auto-focuses first focusable; we want the search input.
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {/* ── Search input ── */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("commandPalette.placeholder")}
            role="combobox"
            aria-expanded={true}
            aria-controls="command-palette-list"
            aria-activedescendant={items[activeIndex] ? `cmd-item-${activeIndex}` : undefined}
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-0"
          />
        </div>

        {/* ── Results ── */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          className="max-h-[50vh] overflow-y-auto py-2 command-scroll"
        >
          {items.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">{t("commandPalette.noResults")}</p>
          )}

          {items.map((item, index) => {
            const showHeader = index === 0 || items[index - 1].group !== item.group;
            const header = showHeader ? (
              <p className="px-4 pt-2 pb-1 text-xxxs font-bold uppercase tracking-wider text-muted-foreground">
                {groupLabel[item.group]}
              </p>
            ) : null;

            const isActive = index === activeIndex;

            if (item.kind === "member") {
              const m = item.data;
              return (
                <div key={m.id ?? m.nik}>
                  {header}
                  <button
                    type="button"
                    id={`cmd-item-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isActive}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => runItem(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                      isActive ? "bg-brand/10" : "hover:bg-secondary/60",
                    )}
                  >
                    <UserCircleIcon className="h-4 w-4 text-brand shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                      <p className="text-xxxs text-muted-foreground font-mono truncate">
                        NIK: {m.nik} · {t("commandPalette.openMember")}
                      </p>
                    </div>
                    <span className="text-xxxs text-muted-foreground tabular-nums shrink-0">
                      {formatCompactRupiah(totalSimpanan(m))}
                    </span>
                  </button>
                </div>
              );
            }

            const a = item.data;
            const Icon = a.icon;
            return (
              <div key={a.id}>
                {header}
                <button
                  type="button"
                  id={`cmd-item-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isActive}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => runItem(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                    isActive ? "bg-brand/10" : "hover:bg-secondary/60",
                  )}
                >
                  <Icon className="h-4 w-4 text-brand shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                    {a.subtitle && <p className="text-xxxs text-muted-foreground truncate">{a.subtitle}</p>}
                  </div>
                  {a.shortcut && (
                    <kbd className="text-xxxs font-mono text-muted-foreground bg-secondary/60 border border-border rounded px-1.5 py-0.5 shrink-0">
                      {a.shortcut}
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Footer hint ── */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xxxs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-secondary/60 border border-border rounded px-1">↑↓</kbd>
            {t("commandPalette.footerNav")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono bg-secondary/60 border border-border rounded px-1">↵</kbd>
            {t("commandPalette.footerSelect")}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <kbd className="font-mono bg-secondary/60 border border-border rounded px-1">ESC</kbd>
            {t("commandPalette.footerClose")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
