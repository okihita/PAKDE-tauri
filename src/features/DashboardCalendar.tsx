import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Mock calendar events ──────────────────────────────────────────

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
}

const EVENT_TITLES: string[] = [
  "RAT Koperasi Desa",
  "Pembagian SHU",
  "Rapat Pengurus",
  "Sosialisasi PAKDE",
  "Pelatihan Pembukuan",
  "Kunjungan Dinas Koperasi",
  "Rapat Anggota Tahunan",
  "Verifikasi Data Anggota",
  "Monitoring Pinjaman",
  "Evaluasi Kinerja",
  "Workshop Digitalisasi",
  "Musyawarah Desa",
  "Pencairan Dana Bergulir",
  "Pelaporan EWS Bulanan",
  "Sosialisasi Simpan Pinjam",
  "Rapat Koordinasi Unit Usaha",
  "Bimtek Akuntansi SAK EP",
  "Audit Internal",
  "Rekonsiliasi Bank",
  "Sensus Anggota Aktif",
];

function generateMockEvents(): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];
  const weekCount = 8;
  for (let w = 0; w < weekCount; w++) {
    for (let e = 0; e < 2; e++) {
      const d = new Date(now);
      d.setDate(d.getDate() + w * 7 + Math.floor(Math.random() * 5) + e);
      const title = EVENT_TITLES[Math.floor(Math.random() * EVENT_TITLES.length)];
      events.push({ date: d.getDate(), month: d.getMonth(), year: d.getFullYear(), title });
    }
  }
  return events;
}

const MOCK_EVENTS = generateMockEvents();

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

// ── Component ──────────────────────────────────────────────────────

export default function CalendarWidget({ t }: { t: (key: string) => string }) {
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

  const monthEvents = MOCK_EVENTS.filter((ev) => ev.month === viewMonth && ev.year === viewYear);
  const eventDates = new Set(monthEvents.map((ev) => ev.date));

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
                      ? "bg-emerald-500/20 text-emerald-400 font-bold"
                      : hasEvent
                        ? "text-amber-300 font-bold"
                        : "text-muted-foreground hover:bg-sidebar-ring"
                }`}
              >
                {d ?? "."}
                {hasEvent && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400" />
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
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {monthEvents
                .sort((a, b) => a.date - b.date)
                .map((ev, i) => (
                  <div key={i} className="flex items-center gap-2 text-xxs">
                    <span className="text-xxxs font-mono text-amber-400 shrink-0 w-6 text-right">{ev.date}</span>
                    <span className="text-muted-foreground truncate">{ev.title}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
