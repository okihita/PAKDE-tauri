import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Plus,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Newspaper,
} from "lucide-react";
import { NEWS_ITEMS, type NewsItem } from "@/data/news";
import type { CooperativeProfile } from "@/types";

interface Props {
  coopProfile: CooperativeProfile | null;
  currentUser: { name: string; role: string } | null;
}

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const TODO_KEY = "pakde-todos";
const NEWS_READ_KEY = "pakde-news-read";

const SOURCE_BADGE: Record<NewsItem["source"], string> = {
  kementerian: "bg-purple-500/10 text-purple-400",
  provinsi: "bg-blue-500/10 text-blue-400",
  kabupaten: "bg-cyan-500/10 text-cyan-400",
};

// ── Helpers ───────────────────────────────────────────────────────

function getGreetingTime(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const GREETING_ICON = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

const DAYS_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Hooks ─────────────────────────────────────────────────────────

function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(TODO_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
  };
  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };
  const removeDone = () => {
    setTodos((prev) => prev.filter((t) => !t.done));
  };

  return { todos, addTodo, toggleTodo, removeDone };
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

// ── Sub-components ────────────────────────────────────────────────

function CalendarWidget({ t }: { t: (key: string) => string }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <Card className="bg-card border-border text-foreground">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <CalendarDays className="h-3 w-3" />
          {t("beranda.calendar")}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xxs font-mono text-muted-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <div className="flex gap-0.5">
            <button
              onClick={prevMonth}
              className="p-0.5 rounded hover:bg-sidebar-ring text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={nextMonth}
              className="p-0.5 rounded hover:bg-sidebar-ring text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-xxxs font-mono text-muted-foreground py-1">
              {t(`beranda.${d}`)}
            </div>
          ))}
          {cells.map((d, i) => (
            <div
              key={i}
              className={`text-center text-xxs font-mono py-1.5 rounded ${
                d === null
                  ? "text-transparent"
                  : isToday(d)
                    ? "bg-emerald-500/20 text-emerald-400 font-bold"
                    : "text-muted-foreground hover:bg-sidebar-ring"
              }`}
            >
              {d ?? "."}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function Dashboard({ coopProfile, currentUser }: Props) {
  const { t } = useTranslation();
  const { todos, addTodo, toggleTodo, removeDone } = useTodos();
  const { readIds, markRead, markAllRead } = useNewsRead();
  const [newTask, setNewTask] = useState("");
  const greeting = getGreetingTime();
  const GreetingIcon = GREETING_ICON[greeting];
  const doneCount = todos.filter((td) => td.done).length;
  const unreadCount = NEWS_ITEMS.filter((n) => !readIds.has(n.id)).length;

  const handleAdd = () => {
    const text = newTask.trim();
    if (!text) return;
    addTodo(text);
    setNewTask("");
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-min">
        {/* ── Greeting ── */}
        <Card className="bg-card border-border text-foreground">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <GreetingIcon className="h-3 w-3 text-amber-400" />
              {t("beranda.welcome")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentUser && (
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("beranda.greeting", {
                    time: t(`beranda.time${greeting.charAt(0).toUpperCase() + greeting.slice(1)}`),
                    name: currentUser.name,
                  })}
                </p>
                <p className="text-xxs text-muted-foreground">{currentUser.role}</p>
              </div>
            )}
            {coopProfile && (
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-sm font-semibold text-emerald-400">{coopProfile.name}</p>
                <p className="text-xxs font-mono text-muted-foreground">
                  {coopProfile.village}, {coopProfile.regency}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Reminders ── */}
        <Card className="bg-card border-border text-foreground">
          <CardHeader>
            <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Bell className="h-3 w-3 text-amber-400" />
              {t("beranda.reminders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { icon: "📋", text: "Laporan SHU bulan ini harus disetor sebelum tanggal 10" },
                { icon: "📅", text: "Rapat Anggota Tahunan: persiapkan agenda" },
                { icon: "💰", text: "Cek outstanding pinjaman anggota aktif" },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-xs">{r.icon}</span>
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Calendar ── */}
        <CalendarWidget t={t} />

        {/* ── Todo List ── */}
        <Card className="bg-card border-border text-foreground">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                {t("beranda.todo")}
              </CardTitle>
              {doneCount > 0 && (
                <button
                  onClick={removeDone}
                  className="text-xxxs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("beranda.clearDone", { n: doneCount })}
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {todos.length === 0 && (
                <p className="text-xxs text-muted-foreground text-center py-4">{t("beranda.noTasks")}</p>
              )}
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary cursor-pointer group"
                  onClick={() => toggleTodo(todo.id)}
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

        {/* ── News ── */}
        <Card className="bg-card border-border text-foreground md:col-span-2 xl:col-span-2 2xl:col-span-2">
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {NEWS_ITEMS.length === 0 && (
                <p className="text-xxs text-muted-foreground text-center py-4">{t("beranda.news.noNews")}</p>
              )}
              {NEWS_ITEMS.map((item) => {
                const isUnread = !readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border-b border-border pb-3 last:border-b-0 last:pb-0 ${
                      isUnread ? "cursor-pointer" : ""
                    }`}
                    onClick={() => isUnread && markRead(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />}
                        <h4 className={`text-xs font-bold ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                          {item.title}
                        </h4>
                      </div>
                      <span
                        className={`text-xxxs font-mono px-1.5 py-0.5 rounded shrink-0 ${SOURCE_BADGE[item.source]}`}
                      >
                        {t(`beranda.news.source${item.source.charAt(0).toUpperCase() + item.source.slice(1)}`)}
                      </span>
                    </div>
                    <p className="text-xxs text-muted-foreground leading-relaxed ml-4">{item.content}</p>
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
      </div>
    </div>
  );
}
