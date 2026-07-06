import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Newspaper, GripHorizontal } from "lucide-react";
import { NEWS_ITEMS, type NewsItem } from "@/data/news";

import { DndContext, type DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CalendarWidget from "./DashboardCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Dashboard.css";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const NEWS_READ_KEY = "pakde-news-read";

const SOURCE_BADGE: Record<NewsItem["source"], string> = {
  kementerian: "bg-purple-500/10 text-purple-400",
  provinsi: "bg-blue-500/10 text-blue-400",
  kabupaten: "bg-cyan-500/10 text-cyan-400",
};

// ── Helpers ───────────────────────────────────────────────────────

const WEEKLY_DEFAULTS: Todo[] = [
  { id: "weekly-1", text: "Lakukan pencatatan transaksi minimal 5 kali", done: false },
  { id: "weekly-2", text: "Tambahkan 3 anggota baru ke database", done: false },
  { id: "weekly-3", text: "Perbarui profil koperasi di Pengaturan", done: false },
  { id: "weekly-4", text: "Lakukan sinkronisasi data dengan kabupaten", done: false },
  { id: "weekly-5", text: "Cek laporan keuangan di modul Akuntansi", done: false },
  { id: "weekly-6", text: "Tinjau alert EWS dan ambil tindakan", done: false },
  { id: "weekly-7", text: "Evaluasi kelayakan finansial koperasi", done: false },
];

const MAIN_DEFAULTS: Todo[] = [
  { id: "main-1", text: "Laporan SHU bulan ini harus disetor sebelum tanggal 10", done: false },
  { id: "main-2", text: "Rapat Anggota Tahunan: persiapkan agenda", done: false },
  { id: "main-3", text: "Cek outstanding pinjaman anggota aktif", done: false },
];

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
        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useTranslation();
  const { items: cardOrder, onDragEnd } = useCardOrder();
  const daily = useTodoList("pakde-todos-daily");
  const weekly = useTodoList("pakde-todos-weekly", WEEKLY_DEFAULTS);
  const main = useTodoList("pakde-todos-main", MAIN_DEFAULTS);
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
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              {t("beranda.todoMain")}
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
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
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
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
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
              <Button type="submit" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-slate-950">
                <Plus className="h-3.5 w-3.5" />
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
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
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
              <Newspaper className="h-3 w-3 text-blue-400" />
              {t("beranda.news.title")}
              {unreadCount > 0 && (
                <span className="text-xxxs font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
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
                      {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />}
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
      <DevDocStripe content={readmeContent} />
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
