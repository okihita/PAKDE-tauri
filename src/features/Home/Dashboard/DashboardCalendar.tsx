import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ── Mock calendar events ──────────────────────────────────────────

interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  title: string;
  description: string;
  location: string;
  time: string;
}

const EVENT_TITLES: { title: string; description: string; location: string }[] = [
  {
    title: "RAT Koperasi Desa",
    description: "Rapat Anggota Tahunan untuk membahas laporan keuangan dan program kerja tahun depan.",
    location: "Balai Desa Makmur Jaya",
  },
  {
    title: "Pembagian SHU",
    description: "Pembagian Sisa Hasil Usaha kepada seluruh anggota aktif koperasi.",
    location: "Kantor Koperasi",
  },
  {
    title: "Rapat Pengurus",
    description: "Rapat koordinasi pengurus koperasi membahas evaluasi bulanan.",
    location: "Ruang Rapat Koperasi",
  },
  {
    title: "Sosialisasi PAKDE",
    description: "Sosialisasi penggunaan aplikasi PAKDE kepada anggota baru.",
    location: "Aula Desa",
  },
  {
    title: "Pelatihan Pembukuan",
    description: "Pelatihan pencatatan keuangan sederhana untuk pengurus unit usaha.",
    location: "Gedung Serbaguna",
  },
  {
    title: "Kunjungan Dinas Koperasi",
    description: "Monitoring dan evaluasi dari Dinas Koperasi Kabupaten.",
    location: "Kantor Koperasi",
  },
  {
    title: "Rapat Anggota Tahunan",
    description: "RAT tahun buku berjalan dengan agenda utama pemilihan pengurus baru.",
    location: "Balai Desa",
  },
  {
    title: "Verifikasi Data Anggota",
    description: "Pendataan ulang dan verifikasi identitas anggota aktif.",
    location: "Kantor Koperasi",
  },
  {
    title: "Monitoring Pinjaman",
    description: "Evaluasi status pinjaman anggota dan rencana penagihan.",
    location: "Ruang Rapat",
  },
  {
    title: "Evaluasi Kinerja",
    description: "Review pencapaian target koperasi selama triwulan terakhir.",
    location: "Kantor Koperasi",
  },
  {
    title: "Workshop Digitalisasi",
    description: "Pelatihan transformasi digital layanan koperasi berbasis aplikasi.",
    location: "Aula Desa",
  },
  {
    title: "Musyawarah Desa",
    description: "Forum musyawarah warga desa membahas pembangunan dan kegiatan bersama.",
    location: "Balai Desa",
  },
  {
    title: "Pencairan Dana Bergulir",
    description: "Pencairan dana bergulir untuk usaha anggota yang telah disetujui.",
    location: "Kantor Koperasi",
  },
  {
    title: "Pelaporan EWS Bulanan",
    description: "Penyusunan dan pengiriman laporan Early Warning System ke Dinas.",
    location: "Kantor Koperasi",
  },
  {
    title: "Sosialisasi Simpan Pinjam",
    description: "Edukasi tata cara simpan pinjam kepada anggota baru dan calon anggota.",
    location: "Aula Desa",
  },
  {
    title: "Rapat Koordinasi Unit Usaha",
    description: "Koordinasi antar unit usaha koperasi untuk sinergi program.",
    location: "Ruang Rapat",
  },
  {
    title: "Bimtek Akuntansi SAK EP",
    description: "Bimbingan teknis penerapan standar akuntansi SAK EP bagi bendahara.",
    location: "Gedung Diklat",
  },
  {
    title: "Audit Internal",
    description: "Audit internal keuangan dan operasional koperasi periode tahun berjalan.",
    location: "Kantor Koperasi",
  },
  {
    title: "Rekonsiliasi Bank",
    description: "Rekonsiliasi saldo bank dengan pembukuan koperasi.",
    location: "Kantor Koperasi",
  },
  {
    title: "Sensus Anggota Aktif",
    description: "Pendataan jumlah anggota aktif dan nonaktif untuk laporan tahunan.",
    location: "Seluruh Wilayah Desa",
  },
];

const TIME_SLOTS = [
  "08:00 WIB",
  "09:30 WIB",
  "10:00 WIB",
  "13:00 WIB",
  "14:30 WIB",
  "15:00 WIB",
  "19:00 WIB",
  "20:00 WIB",
];

function generateMockEvents(): CalendarEvent[] {
  const now = new Date();
  const events: CalendarEvent[] = [];
  const weekCount = 8;
  for (let w = 0; w < weekCount; w++) {
    for (let e = 0; e < 2; e++) {
      const d = new Date(now);
      d.setDate(d.getDate() + w * 7 + Math.floor(Math.random() * 5) + e);
      const pick = EVENT_TITLES[Math.floor(Math.random() * EVENT_TITLES.length)];
      events.push({
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        title: pick.title,
        description: pick.description,
        location: pick.location,
        time: TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)],
      });
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
    <>
      <Card className="bg-card border-border text-foreground hover-glow-card">
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
              <div className="space-y-0.5">
                {monthEvents
                  .sort((a, b) => a.date - b.date)
                  .map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xxs py-1.5 px-2 rounded hover:bg-secondary cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <span className="text-xxxs font-mono text-amber-400 shrink-0 w-6 text-right">{ev.date}</span>
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
              <CalendarDays className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                {selectedEvent?.date} {selectedEvent ? MONTHS[selectedEvent.month] : ""} {selectedEvent?.year}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{selectedEvent?.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{selectedEvent?.location}</span>
            </div>
            <p className="pt-1 leading-relaxed border-t border-border">{selectedEvent?.description}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
