import { useState, useEffect } from "react";
import { CalendarIcon, CaretLeftIcon, CaretRightIcon, MapPinIcon, ClockIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import i18next from "@/i18n";
import { listEvents, type Kegiatan } from "@/features/Community/CreateEvent/eventsDb";

/** Localized long month name (e.g. "Juli") respecting the active language. */
function monthName(year: number, month: number): string {
  return new Intl.DateTimeFormat(i18next.language || "id", { month: "long" }).format(new Date(year, month, 1));
}

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
  description: string;
  location: string;
  time: string;
}

/**
 * Map a stored Kegiatan ("YYYY-MM-DD" date) onto a calendar cell. Returns null
 * when the date string is missing/unparseable so a bad row can't crash the grid.
 */
function kegiatanToCalendarEvent(k: Kegiatan): CalendarEvent | null {
  if (!k.date) return null;
  const d = new Date(`${k.date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return {
    date: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
    title: k.title,
    description: k.description || k.notes,
    location: k.location,
    time: k.duration_min ? `${k.duration_min} menit` : "",
  };
}

const DAYS_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

// ── Component ──────────────────────────────────────────────────────

export default function CalendarWidget({ t }: { t: (key: string) => string }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Load the coop's real Kegiatan. Runs on mount — the Dashboard (and this
  // widget) remounts every time the tab is switched, so returning from the
  // Kegiatan screen always reflects freshly saved events.
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const kegiatan = await listEvents();
        if (alive) setEvents(kegiatan.map(kegiatanToCalendarEvent).filter((e): e is CalendarEvent => e !== null));
      } catch {
        /* non-fatal — calendar simply shows no events */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const monthEvents = events.filter((ev) => ev.month === viewMonth && ev.year === viewYear);
  const eventDates = new Set(monthEvents.map((ev) => ev.date));

  return (
    <>
      <Card className="bg-card border-border text-foreground hover-glow-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            {t("beranda.calendar")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xxs font-mono text-muted-foreground">
              {monthName(viewYear, viewMonth)} {viewYear}
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={prevMonth}
                className="p-0.5 rounded hover:bg-sidebar-ring text-muted-foreground hover:text-foreground transition-colors"
              >
                <CaretLeftIcon className="h-3 w-3" />
              </button>
              <button
                onClick={nextMonth}
                className="p-0.5 rounded hover:bg-sidebar-ring text-muted-foreground hover:text-foreground transition-colors"
              >
                <CaretRightIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-0">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center text-xxxs font-mono text-muted-foreground py-1">
                {t(`beranda.${d}`)}
              </div>
            ))}
            {cells.map((d, i) => {
              const hasEvent = d !== null && eventDates.has(d);
              return (
                <div
                  key={i}
                  className={`text-center text-xxs font-mono py-1.5 rounded relative ${
                    d === null
                      ? "text-transparent"
                      : isToday(d)
                        ? "bg-success/20 text-success font-bold"
                        : hasEvent
                          ? "text-warning/80 font-bold"
                          : "text-muted-foreground hover:bg-sidebar-ring"
                  }`}
                >
                  {d ?? "."}
                  {hasEvent && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-warning" />
                  )}
                </div>
              );
            })}
          </div>

          {monthEvents.length > 0 && (
            <div className="border-t border-border pt-2 space-y-1.5">
              <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
                {t("beranda.eventsTitle")}
              </p>
              <div className="space-y-0.5">
                {monthEvents
                  .sort((a, b) => a.date - b.date)
                  .map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xxs py-1.5 px-2 rounded hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <span className="text-xxxs font-mono text-warning shrink-0 w-6 text-right">{ev.date}</span>
                      <span className="text-muted-foreground truncate">{ev.title}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-warning shrink-0" />
              <span>
                {selectedEvent?.date} {selectedEvent ? monthName(selectedEvent.year, selectedEvent.month) : ""}{" "}
                {selectedEvent?.year}
              </span>
            </div>
            {selectedEvent?.time && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                <span>{selectedEvent.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-3.5 w-3.5 text-warning shrink-0" />
              <span>{selectedEvent?.location}</span>
            </div>
            <p className="pt-1 leading-relaxed border-t border-border">{selectedEvent?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
