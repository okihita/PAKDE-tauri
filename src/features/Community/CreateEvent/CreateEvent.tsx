import { useState, useEffect } from "react";
import { listEvents, deleteEvent, migrateLocalStorageEvents, type Kegiatan } from "./eventsDb";
import { deleteEventFiles } from "./fileStore";
import EventTemplatePicker from "./EventTemplatePicker";
import EventList from "./EventList";
import EventForm from "./EventForm";
import type { EventTemplate } from "./eventTemplates";

interface Props {
  coopId: string;
}

export default function CreateEvent({ coopId }: Props) {
  const [mode, setMode] = useState<"list" | "templates" | "create">("list");
  const [events, setEvents] = useState<Kegiatan[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);

  const load = async () => setEvents(await listEvents(coopId));

  useEffect(() => {
    void (async () => {
      try {
        await migrateLocalStorageEvents(coopId);
      } catch {
        /* non-fatal — legacy localStorage is best-effort */
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coopId]);

  /* ── Navigation ── */
  const openTemplates = () => setMode("templates");
  const backToList = () => {
    setMode("list");
    setSelectedTemplate(null);
  };
  const selectTemplate = (tmpl: EventTemplate) => {
    setSelectedTemplate(tmpl);
    setMode("create");
  };

  const handleDelete = async (ev: Kegiatan) => {
    await deleteEvent(coopId, ev.id);
    await deleteEventFiles(coopId, ev.id);
    await load();
  };

  const handleSaved = () => {
    void (async () => {
      setMode("list");
      setSelectedTemplate(null);
      await load();
    })();
  };

  if (mode === "templates") {
    return <EventTemplatePicker onSelect={selectTemplate} onBack={backToList} />;
  }

  if (mode === "create") {
    return (
      <EventForm
        coopId={coopId}
        selectedTemplate={selectedTemplate}
        onBack={() => setMode("templates")}
        onSaved={handleSaved}
      />
    );
  }

  return <EventList events={events} onNew={openTemplates} onDelete={handleDelete} />;
}
