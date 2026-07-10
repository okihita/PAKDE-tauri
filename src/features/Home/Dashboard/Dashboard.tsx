import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, CircleIcon, PlusIcon, NewspaperIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
import { NEWS_ITEMS, type NewsItem } from "@/data/news";

import { DndContext, type DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CalendarWidget from "./DashboardCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getInitialTasksForCoop } from "./dashboardTasks";
import { getCurrentLevel, type LevelDef } from "@/data/leveling";
import "./Dashboard.css";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const NEWS_READ_KEY = "pakde-news-read";

const SOURCE_BADGE: Record<NewsItem["source"], string> = {
  kementerian: "bg-purple-500/10 text-purple-400",
  provinsi: "bg-info/10 text-info",
  kabupaten: "bg-cyan-500/10 text-cyan-400",
};

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

  return { items, addItem, toggleItem, removeDone, doneCount };
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

// ── Card order (drag-and-drop) ───────────────────────────────────

const CARD_ORDER_KEY = "pakde-card-order";
const DEFAULT_CARDS = ["mainquest", "tugas", "calendar", "news"];

function useCardOrder() {
  const [items, setItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CARD_ORDER_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        // Merge any new default cards not yet in stored order
        for (const id of DEFAULT_CARDS) {
          if (!parsed.includes(id)) parsed.push(id);
        }
        // Remove obsolete cards no longer in DEFAULT_CARDS
        return parsed.filter((id) => DEFAULT_CARDS.includes(id));
      }
      return DEFAULT_CARDS;
    } catch {
      return DEFAULT_CARDS;
    }
  });

  useEffect(() => {
    localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(items));
  }, [items]);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  return { items, onDragEnd };
}

function SortableCard({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} relative group`}>
      {children}
      {/* Drag handle — grab cursor only on this grip icon */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-sidebar-ring"
        {...attributes}
        {...listeners}
      >
        <DotsSixVerticalIcon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ── Main quest (reflects the cooperative's actual level quests) ──
//
// Unlike daily/weekly todos, the main quest list is derived from the real
// leveling subgoals for the cooperative's current level (keyed on xp), not
// hardcoded suggestions. The user's checked-off progress is persisted per
// quest id so it survives reloads and harmlessly drops when the level changes.

const MAIN_QUEST_DONE_KEY = "pakde-mainquest-done";

function useMainQuests(level: LevelDef) {
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

  const items: Todo[] = questIds.map((id) => ({ id, text: id, done: !!doneMap[id] }));
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

export default function Dashboard({ healthScore = 0, xp = 0 }: { healthScore?: number; xp?: number }) {
  const { t } = useTranslation();
  const { items: cardOrder, onDragEnd } = useCardOrder();

  // Compute level-aware task defaults
  const taskDefaults = getInitialTasksForCoop(healthScore, []);
  const currentLevel = getCurrentLevel(xp);

  const daily = useTodoList("pakde-todos-daily");
  const weekly = useTodoList("pakde-todos-weekly", taskDefaults.weeklyQuests);
  const main = useMainQuests(currentLevel);
  const { readIds, markRead, markAllRead } = useNewsRead();
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [newTask, setNewTask] = useState("");
  const unreadCount = NEWS_ITEMS.filter((n) => !readIds.has(n.id)).length;
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const activeList = tab === "daily" ? daily : weekly;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <CheckCircleIcon className="h-3 w-3 text-success" />
              {t("beranda.todoMain")}
              <span
                className={`ml-1 px-1.5 py-0.5 rounded text-xxxs font-mono ${currentLevel.bgClass} ${currentLevel.textClass}`}
              >
                {currentLevel.labelId}
              </span>
            </CardTitle>
            {main.doneCount > 0 && (
              <button
                onClick={main.removeDone}
                className="text-xxxs font-mono text-muted-foreground hover:text-foreground transition-colors"
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
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <CheckCircleIcon className="h-3 w-3 text-success" />
              {tab === "daily" ? t("beranda.todo") : t("beranda.todoWeekly")}
            </CardTitle>
            {activeList.doneCount > 0 && (
              <button
                onClick={activeList.removeDone}
                className="text-xxxs font-mono text-muted-foreground hover:text-foreground transition-colors"
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
            {activeList.items.map((todo) => (
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
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
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
                className="text-xxxs font-mono text-muted-foreground hover:text-foreground transition-colors"
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
              return (
                <div
                  key={item.id}
                  className="border-b border-border pb-2 last:border-b-0 last:pb-0 cursor-pointer py-1.5 px-2 rounded hover:bg-secondary transition-colors -mx-2"
                  onClick={() => {
                    setSelectedNews(item);
                    if (isUnread) markRead(item.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-info shrink-0 mt-1.5" />}
                      <h4 className={`text-xs font-bold ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.title}
                      </h4>
                    </div>
                    <span className={`text-xxxs font-mono px-1.5 py-0.5 rounded shrink-0 ${SOURCE_BADGE[item.source]}`}>
                      {t(`beranda.news.source${item.source.charAt(0).toUpperCase() + item.source.slice(1)}`)}
                    </span>
                  </div>
                  <p className="text-xxs text-muted-foreground leading-relaxed ml-4 line-clamp-2">{item.content}</p>
                  <p className="text-xxxs font-mono text-muted-foreground mt-1 ml-4">
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-4 auto-rows-min">
            {cardOrder.map((id) => (
              <SortableCard key={id} id={id} className="col-span-12 sm:col-span-6 xl:col-span-3">
                {cardContents[id]}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={(o) => !o && setSelectedNews(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{selectedNews?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className={`text-xxxs font-mono px-1.5 py-0.5 rounded ${selectedNews ? SOURCE_BADGE[selectedNews.source] : ""}`}
              >
                {selectedNews
                  ? t(
                      `beranda.news.source${selectedNews.source.charAt(0).toUpperCase() + selectedNews.source.slice(1)}`,
                    )
                  : ""}
              </span>
              <span className="text-xxxs font-mono">
                {selectedNews
                  ? new Date(selectedNews.timestamp).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>
            <p className="leading-relaxed">{selectedNews?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
