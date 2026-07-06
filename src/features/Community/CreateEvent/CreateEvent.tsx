import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarPlus, MapPin, Clock, FileText, ArrowLeft, CalendarDays, Sparkles, Users } from "lucide-react";
import { computePredictions, importanceStars, type EventTemplate } from "./eventTemplates";
import EventTemplatePicker from "./EventTemplatePicker";
import EventPredictionPanels from "./EventPredictionPanels";

/* ── Types ────────────────────────────────────────────── */

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: string;
}

/* ── Storage ──────────────────────────────────────────── */

const STORAGE_KEY = "pakde-events";

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function CreateEvent() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"list" | "templates" | "create">("list");
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState(0);
  const [description, setDescription] = useState("");

  // ── Predictions (recomputed live) ──
  const predictions = useMemo(() => {
    if (!selectedTemplate || selectedTemplate.id === "custom") return null;
    return computePredictions(selectedTemplate, attendees || selectedTemplate.defaultAttendees, date);
  }, [selectedTemplate, attendees, date]);

  /* ── Navigation ── */
  const openTemplates = () => setMode("templates");

  const selectTemplate = (tmpl: EventTemplate) => {
    setSelectedTemplate(tmpl);
    if (tmpl.id === "custom") {
      setName("");
      setDate("");
      setTime("");
      setLocation("");
      setAttendees(0);
      setDescription("");
    } else {
      setName(tmpl.suggestedNameKey ? t(tmpl.suggestedNameKey) : "");
      setDate("");
      setTime("");
      setLocation(tmpl.suggestedLocationKey ? t(tmpl.suggestedLocationKey) : "");
      setAttendees(tmpl.defaultAttendees);
      setDescription(
        tmpl.suggestedAgendaKeys
          .map((k) => t(k))
          .filter(Boolean)
          .join("\n"),
      );
    }
    setMode("create");
  };

  const backToTemplates = () => setMode("templates");
  const backToList = () => {
    setMode("list");
    setSelectedTemplate(null);
  };

  /* ── Save ── */
  const handleSave = () => {
    if (!name.trim() || !date) return;
    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      name: name.trim(),
      date,
      time: time || "00:00",
      location: location.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    saveEvents(updated);
    setName("");
    setDate("");
    setTime("");
    setLocation("");
    setAttendees(0);
    setDescription("");
    setSelectedTemplate(null);
    setMode("list");
  };

  const handleDelete = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  };

  /* ═══════════════════════════════════════════════
     LIST MODE
     ═══════════════════════════════════════════════ */
  if (mode === "list") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
            {t("sidebar.nav.event")}
          </h3>
          {events.length > 0 && (
            <Button
              onClick={openTemplates}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8 px-3"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
              {t("event.form.save")}
            </Button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
              <CalendarDays className="h-9 w-9 text-amber-400/60" />
            </div>
            <h2 className="text-sm font-bold text-foreground mb-2">{t("event.empty.title")}</h2>
            <p className="text-xxs text-muted-foreground max-w-xs mb-8 leading-relaxed">
              {t("event.empty.description")}
            </p>
            <Button
              onClick={openTemplates}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 px-5"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {t("event.empty.cta")}
            </Button>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-xs w-full">
              {[
                { icon: CalendarDays, label: t("event.empty.hint1") },
                { icon: MapPin, label: t("event.empty.hint2") },
                { icon: Clock, label: t("event.empty.hint3") },
                { icon: Sparkles, label: t("event.empty.hint4") },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-xxxs text-slate-500 font-mono">
                  <Icon className="h-3 w-3 text-slate-600" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Card
                key={ev.id}
                className="bg-slate-950/60 border-slate-900/80 hover:border-amber-500/20 transition-all group"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{ev.name}</h4>
                      <p className="text-xxxs font-mono text-amber-400 mt-0.5">
                        {ev.date}
                        {ev.time !== "00:00" && ` · ${ev.time}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ev.id)}
                      className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-xxxs font-mono">✕</span>
                    </Button>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-xxxs text-slate-400 font-mono">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                  {ev.description && (
                    <p className="text-xxxs text-muted-foreground leading-relaxed line-clamp-2">{ev.description}</p>
                  )}
                  <p className="text-xxxs font-mono text-slate-600">
                    {new Date(ev.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     TEMPLATE PICKER
     ═══════════════════════════════════════════════ */
  if (mode === "templates") {
    return <EventTemplatePicker onSelect={selectTemplate} onBack={backToList} />;
  }

  /* ═══════════════════════════════════════════════
     CREATE FORM
     ═══════════════════════════════════════════════ */
  const tmpl = selectedTemplate;
  const isCustom = !tmpl || tmpl.id === "custom";
  const FormIcon = isCustom ? CalendarPlus : tmpl!.icon;

  return (
    <div className="flex-1 overflow-auto p-6 max-w-2xl">
      <button
        onClick={backToTemplates}
        className="flex items-center gap-1.5 text-xxs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("event.form.backToTemplates")}
      </button>

      <Card className="bg-card border-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FormIcon className="h-3.5 w-3.5 text-amber-400" />
            {isCustom ? t("event.form.title") : t(tmpl!.i18nKey)}
            {!isCustom && (
              <span className="ml-auto flex items-center gap-1">
                <span className="text-xxxs font-mono text-amber-400/80">{importanceStars(tmpl!.importance)}</span>
                {tmpl!.legalNoteKey && (
                  <span className="text-xxxs font-mono text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {t(tmpl!.legalNoteKey)}
                  </span>
                )}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground">{t("event.form.name")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("event.form.namePlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("event.form.date")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-input border-border text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("event.form.time")}</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-input border-border text-xs h-9"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t("event.form.location")}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("event.form.locationPlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {t("event.form.attendees")}
            </label>
            <Input
              type="number"
              min={0}
              max={10000}
              value={attendees || ""}
              onChange={(e) => setAttendees(Math.max(0, Number(e.target.value)))}
              placeholder={t("event.form.attendeesPlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> {t("event.form.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-input border-border text-xs text-foreground rounded-lg p-2.5 h-24 resize-none placeholder:text-muted-foreground"
              placeholder={t("event.form.descriptionPlaceholder")}
            />
          </div>

          {/* Prediction panels */}
          {!isCustom && predictions && (
            <EventPredictionPanels predictions={predictions} recommendedStartDate={predictions.recommendedStartDate} />
          )}

          {/* Note + Buttons */}
          <div className="flex items-center gap-2 text-xxs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t("event.form.note")}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={backToTemplates}
              className="border-border text-muted-foreground text-xs h-9 flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !date}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 flex-1 disabled:opacity-40"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> {t("event.form.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
