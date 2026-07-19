import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, CircleIcon, PlusIcon } from "@phosphor-icons/react";

import CalendarWidget from "./DashboardCalendar";
import CampaignStrip from "./CampaignStrip";
import NewsWidget from "./NewsWidget";
import { getCurrentLevel, type LevelDef } from "@/data/leveling";
import { countActivePengurus } from "@/hooks/usePengurus";
import { onPengurusChanged } from "@/lib/pengurusEvents";
import "./Dashboard.css";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const CAMPAIGN_CARDS = ["mainquest", "tugas", "calendar"] as const;

// ── Helpers ───────────────────────────────────────────────────────

function useTodoList(key: string, defaults: Todo[] = []) {
  const [items, setItems] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      return defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, key]);

  const addItem = (text: string) => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
  };
  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };
  const removeDone = () => {
    setItems((prev) => prev.filter((t) => !t.done));
  };
  const doneCount = items.filter((t) => t.done).length;

  // Display view: undone first (in stored order), done pushed to the bottom.
  // Non-destructive — the stored array keeps manual order within each group.
  const sortedItems = [...items.filter((t) => !t.done), ...items.filter((t) => t.done)];

  return { items, sortedItems, addItem, toggleItem, removeDone, doneCount };
}

// ── Main quest (reflects the cooperative's actual level quests) ──
//
// Unlike daily/weekly todos, the main quest list is derived from the real
// leveling subgoals for the cooperative's current level (keyed on xp), not
// hardcoded suggestions. The user's checked-off progress is persisted per
// quest id so it survives reloads and harmlessly drops when the level changes.

const MAIN_QUEST_DONE_KEY = "pakde-mainquest-done";

function useMainQuests(level: LevelDef, autoDone: Set<string>) {
  const questIds = level.aspects.flatMap((a) => a.quests.map((q) => q.id));

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(MAIN_QUEST_DONE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(MAIN_QUEST_DONE_KEY, JSON.stringify(doneMap));
  }, [doneMap]);

  // Quests satisfied by live data (e.g. "Struktur pengurus minimal 3 orang"
  // once at least 3 board positions are filled) are shown done regardless of
  // the manual toggle — the cooperative genuinely meets the subgoal.
  const items: Todo[] = questIds.map((id) => ({ id, text: id, done: !!doneMap[id] || autoDone.has(id) }));
  const toggleItem = (id: string) => setDoneMap((m) => ({ ...m, [id]: !m[id] }));
  const removeDone = () =>
    setDoneMap((m) => {
      const next = { ...m };
      for (const id of questIds) if (next[id]) delete next[id];
      return next;
    });
  const doneCount = items.filter((i) => i.done).length;

  return { items, toggleItem, removeDone, doneCount };
}

// ── Main ──────────────────────────────────────────────────────────

export default function Dashboard({ xp = 0, coopId }: { xp?: number; coopId: string }) {
  const { t } = useTranslation();

  const currentLevel = getCurrentLevel(xp);

  const daily = useTodoList("pakde-todos-daily");
  const weekly = useTodoList("pakde-todos-weekly");

  // Live readiness: the governance quest "Struktur pengurus minimal 3 orang"
  // is satisfied once at least 3 board positions are filled. Re-checked on
  // mount and whenever the Board tab mutates a position (via the shared signal).
  const [pengurusReady, setPengurusReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      countActivePengurus()
        .then((n) => {
          if (alive) setPengurusReady(n >= 3);
        })
        .catch(() => {});
    refresh();
    const unsubscribe = onPengurusChanged(() => {
      if (alive) refresh();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  const autoDone = useMemo(
    () => (pengurusReady ? new Set(["Struktur pengurus minimal 3 orang"]) : new Set<string>()),
    [pengurusReady],
  );
  const main = useMainQuests(currentLevel, autoDone);

  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [newTask, setNewTask] = useState("");

  const activeList = tab === "daily" ? daily : weekly;

  const handleAdd = () => {
    const text = newTask.trim();
    if (!text) return;
    activeList.addItem(text);
    setNewTask("");
  };

  const cardContents: Record<string, React.ReactNode> = {
    mainquest: (
      <Card className="bg-card border-border text-foreground hover-glow-card">
        <CardHeader className="p-0 space-y-0 relative border-b border-border/40">
          <div className="relative overflow-hidden rounded-t-xl px-3 h-11 flex items-center justify-between shrink-0">
            <div
              className="absolute inset-0 bg-cover bg-left bg-no-repeat pointer-events-none opacity-30 dark:opacity-40 transition-opacity"
              style={{ backgroundImage: 'url("/banners/mainquest-banner.webp")' }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-card/85 via-card/50 to-transparent pointer-events-none z-1" />
            <div className="relative z-10 flex items-center justify-between w-full">
              <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-success" />
                {t("beranda.todoMain")}
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded text-xxxs ${currentLevel.bgClass} ${currentLevel.textClass}`}
                >
                  {currentLevel.labelId}
                </span>
              </CardTitle>
              {main.doneCount > 0 && (
                <button
                  onClick={main.removeDone}
                  className="text-xxxs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("beranda.clearDone", { n: main.doneCount })}
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {/* Progress summary pill */}
          <div className="flex items-center justify-between bg-secondary/50 px-2 py-1 rounded text-xxxs">
            <span className="text-muted-foreground font-medium">{t("beranda.questProgress")}</span>
            <span className="font-semibold text-foreground">
              {main.doneCount}/{main.items.length} {t("beranda.completed")}
            </span>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {main.items.length === 0 && (
              <p className="text-xxs text-muted-foreground text-center py-4">{t("beranda.noTasks")}</p>
            )}
            {main.items.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary cursor-pointer group"
                onClick={() => main.toggleItem(todo.id)}
              >
                {todo.done ? (
                  <CheckCircleIcon className="h-3.5 w-3.5 text-brand shrink-0" />
                ) : (
                  <CircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                )}
                <span className={`text-xs ${todo.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    tugas: (
      <Card className="bg-card border-border text-foreground hover-glow-card">
        <CardHeader className="p-0 space-y-0 relative border-b border-border/40">
          <div className="relative overflow-hidden rounded-t-xl px-3 h-11 flex items-center justify-between shrink-0">
            <div
              className="absolute inset-0 bg-cover bg-left bg-no-repeat pointer-events-none opacity-30 dark:opacity-40 transition-opacity"
              style={{ backgroundImage: 'url("/banners/tasks-banner.webp")' }}
            />
            <div className="absolute inset-0 bg-linear-to-r from-card/85 via-card/50 to-transparent pointer-events-none z-1" />
            <div className="relative z-10 flex items-center justify-between w-full">
              <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <CheckCircleIcon className="h-3 w-3 text-success" />
                {tab === "daily" ? t("beranda.todo") : t("beranda.todoWeekly")}
              </CardTitle>
              {activeList.doneCount > 0 && (
                <button
                  onClick={activeList.removeDone}
                  className="text-xxxs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("beranda.clearDone", { n: activeList.doneCount })}
                </button>
              )}
            </div>
          </div>
          {/* Controls sub-row below title illustration */}
          <div className="p-2.5 bg-card/50 border-t border-border/20">
            <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-md text-xxxs">
              <button
                onClick={() => setTab("daily")}
                className={`flex-1 py-1 px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  tab === "daily"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t("beranda.harian")}</span>
              </button>
              <button
                onClick={() => setTab("weekly")}
                className={`flex-1 py-1 px-1.5 rounded font-medium transition-all flex items-center justify-center gap-1 ${
                  tab === "weekly"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t("beranda.mingguan")}</span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tab === "daily" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              className="flex gap-2"
            >
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder={t("beranda.addTodo")}
                className="flex-1 bg-input border-border text-xs h-8 text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" className="h-8 w-8 bg-brand hover:bg-brand text-brand-foreground">
                <PlusIcon className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {activeList.items.length === 0 && (
              <p className="text-xxs text-muted-foreground text-center py-4">{t("beranda.noTasks")}</p>
            )}
            {activeList.sortedItems.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary cursor-pointer group"
                onClick={() => activeList.toggleItem(todo.id)}
              >
                {todo.done ? (
                  <CheckCircleIcon className="h-3.5 w-3.5 text-brand shrink-0" />
                ) : (
                  <CircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                )}
                <span className={`text-xs ${todo.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    calendar: <CalendarWidget t={t} />,
  };

  const [newsCollapsed, setNewsCollapsed] = useState<boolean>(() => {
    const userPref = localStorage.getItem("pakde-news-collapsed");
    if (userPref !== null) return userPref === "true";
    return typeof window !== "undefined" ? window.innerWidth < 1400 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      const userPref = localStorage.getItem("pakde-news-collapsed");
      if (userPref === null) {
        setNewsCollapsed(window.innerWidth < 1400);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNewsCollapse = () => {
    setNewsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pakde-news-collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Campaign strip is capped to the 3-column campaign area (not full width). */}
      <div className="flex gap-4 items-stretch">
        {/* ── Left: campaign strip + 3-column campaign row ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <CampaignStrip xp={xp} pengurusReady={pengurusReady} />

          {/* Fixed 3-column campaign row: mainquest · tugas · calendar. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            {CAMPAIGN_CARDS.map((id) => (
              <div key={id}>{cardContents[id]}</div>
            ))}
          </div>
        </div>

        {/* ── Right rail: Berita column (collapsible w-72 <-> w-12). ── */}
        <div
          className={`shrink-0 h-full transition-all duration-300 ${newsCollapsed ? "w-12 overflow-visible" : "w-72 overflow-hidden"}`}
        >
          <NewsWidget coopId={coopId} isCollapsed={newsCollapsed} onToggleCollapse={toggleNewsCollapse} />
        </div>
      </div>
    </div>
  );
}
