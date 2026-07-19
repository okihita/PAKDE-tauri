import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  CircleIcon,
  PlusIcon,
  NewspaperIcon,
  Buildings,
  MapPin,
  Flag,
  CaretRight,
} from "@phosphor-icons/react";
import { NEWS_ITEMS, type NewsItem } from "@/data/news";

import CalendarWidget from "./DashboardCalendar";
import CampaignStrip from "./CampaignStrip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrentLevel, type LevelDef } from "@/data/leveling";
import { countActivePengurus } from "@/hooks/usePengurus";
import { onPengurusChanged } from "@/lib/pengurusEvents";
import "./Dashboard.css";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const NEWS_READ_KEY = "pakde-news-read";

// Fixed card layout — drag-and-drop removed. The Beranda now uses a fixed
// 3-column campaign row (mainquest, tugas, calendar) plus a right-rail "news"
// column. `NEWS_ID` is pulled out so it can be rendered separately from the
// campaign grid.
const CAMPAIGN_CARDS = ["mainquest", "tugas", "calendar"] as const;
const NEWS_ID = "news";

const SOURCE_BADGE: Record<NewsItem["source"], string> = {
  kementerian: "bg-purple-500/10 text-purple-400",
  provinsi: "bg-info/10 text-info",
  kabupaten: "bg-cyan-500/10 text-cyan-400",
};

// Per-source icon for the left "icon rail" — gives instant scannability in the
// narrow right rail without a wordy source tag.
const SOURCE_ICON: Record<NewsItem["source"], typeof Buildings> = {
  kementerian: Buildings,
  provinsi: MapPin,
  kabupaten: Flag,
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

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

function useNewsRead() {
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(NEWS_READ_KEY);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(NEWS_READ_KEY, JSON.stringify([...readIds]));
  }, [readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  }, []);

  const markAllRead = useCallback(() => {
    const allIds = NEWS_ITEMS.map((n) => n.id);
    setReadIds(new Set(allIds));
  }, []);

  return { readIds, markRead, markAllRead };
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

export default function Dashboard({ xp = 0 }: { xp?: number }) {
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
  const { readIds, markRead, markAllRead } = useNewsRead();
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [newTask, setNewTask] = useState("");
  const unreadCount = NEWS_ITEMS.filter((n) => !readIds.has(n.id)).length;
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
        </CardHeader>
        <CardContent>
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
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between mb-2">
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
          <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
            <button
              onClick={() => setTab("daily")}
              className={`flex-1 text-xxxs font-bold py-1 rounded-md transition-all ${tab === "daily" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("beranda.harian")}
            </button>
            <button
              onClick={() => setTab("weekly")}
              className={`flex-1 text-xxxs font-bold py-1 rounded-md transition-all ${tab === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t("beranda.mingguan")}
            </button>
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
    news: (
      <Card className="bg-card border-border text-foreground hover-glow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <NewspaperIcon className="h-3 w-3 text-info" />
              {t("beranda.news.title")}
              {unreadCount > 0 && (
                <span className="text-xxxs font-bold px-1.5 py-0.5 rounded-full bg-info/10 text-info">
                  {t("beranda.news.unread", { n: unreadCount })}
                </span>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xxxs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("beranda.news.markRead")}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {NEWS_ITEMS.length === 0 && (
              <p className="text-xxs text-muted-foreground text-center py-4">{t("beranda.news.noNews")}</p>
            )}
            {NEWS_ITEMS.map((item) => {
              const isUnread = !readIds.has(item.id);
              const SourceIcon = SOURCE_ICON[item.source];
              return (
                <div
                  key={item.id}
                  className={`group flex gap-2.5 border-b border-border pb-3 last:border-b-0 last:pb-0 cursor-pointer py-2 px-2 -mx-2 rounded-lg transition-colors ${
                    isUnread ? "bg-info/5 border-l-2 border-l-info pl-1.5" : "hover:bg-secondary"
                  }`}
                  onClick={() => {
                    setSelectedNews(item);
                    if (isUnread) markRead(item.id);
                  }}
                >
                  {/* Left icon rail — source glyph for instant scannability */}
                  <SourceIcon
                    className={`h-4 w-4 shrink-0 mt-0.5 ${isUnread ? "text-info" : "text-muted-foreground/60"}`}
                    weight={isUnread ? "fill" : "regular"}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold leading-snug ${isUnread ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {item.title}
                      </h4>
                      <CaretRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xxs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{item.content}</p>
                    <p className="text-xxxs text-muted-foreground/70 mt-1.5">
                      {item.sourceName} · {fmtDate(item.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Campaign strip is capped to the 3-column campaign area (not full width). */}
      <div className="flex gap-4 items-start">
        {/* ── Left: campaign strip + 3-column campaign row ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <CampaignStrip xp={xp} pengurusReady={pengurusReady} />

          {/* Fixed 3-column campaign row: mainquest · tugas · calendar.
              Drag-and-drop removed — order is fixed. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
            {CAMPAIGN_CARDS.map((id) => (
              <div key={id}>{cardContents[id]}</div>
            ))}
          </div>
        </div>

        {/* ── Right rail: Berita column (fixed width, full height, top-aligned).
            Mirrors the left Sidebar / TopBar settings right rail (w-72). ── */}
        <div className="w-72 shrink-0">{cardContents[NEWS_ID]}</div>
      </div>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={(o) => !o && setSelectedNews(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{selectedNews?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className={`text-xxxs px-1.5 py-0.5 rounded ${selectedNews ? SOURCE_BADGE[selectedNews.source] : ""}`}
              >
                {selectedNews?.sourceName ?? ""}
              </span>
              <span className="text-xxxs">{selectedNews ? fmtDate(selectedNews.timestamp) : ""}</span>
            </div>
            <p className="leading-relaxed">{selectedNews?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
