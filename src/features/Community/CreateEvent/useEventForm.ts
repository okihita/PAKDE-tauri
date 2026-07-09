// ── Event form state + persistence hook ─────────────────────────────────
//
// Owns every piece of "New Kegiatan" form state, member loading, file
// uploads, and the save transaction. Kept in a .ts module so it can call
// getDb() directly (the .tsx files are not allowed to).

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getDb } from "@/db";
import { createEvent, type Kegiatan, type EventType, type EventFileMeta, type NewEventInput } from "./eventsDb";
import { storeEventFile } from "./fileStore";
import type { Member } from "@/types";
import type { EventTemplate } from "./eventTemplates";

export interface UseEventForm {
  title: string;
  setTitle: (v: string) => void;
  type: EventType;
  setType: (v: EventType) => void;
  date: string;
  setDate: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  durationMin: number | "";
  setDurationMin: (v: number | "") => void;
  attendees: number;
  setAttendees: (v: number) => void;
  participantIds: string[];
  toggleParticipant: (id: string) => void;
  members: Member[];
  description: string;
  setDescription: (v: string) => void;
  socialLinks: string[];
  updateSocialLink: (idx: number, value: string) => void;
  addSocialLink: () => void;
  removeSocialLink: (idx: number) => void;
  notes: string;
  setNotes: (v: string) => void;
  proposal: EventFileMeta | null;
  report: EventFileMeta | null;
  handleFile: (kind: "proposal" | "report", file: File | undefined) => Promise<void>;
  removeFile: (kind: "proposal" | "report") => void;
  saving: boolean;
  handleSave: () => Promise<void>;
}

export function useEventForm(
  coopId: string,
  selectedTemplate: EventTemplate | null,
  onSaved: () => void,
): UseEventForm {
  const { t } = useTranslation();

  const tmpl = selectedTemplate && selectedTemplate.id !== "custom" ? selectedTemplate : null;

  const [title, setTitle] = useState(() => (tmpl?.suggestedNameKey ? t(tmpl.suggestedNameKey) : ""));
  const [type, setType] = useState<EventType>("other");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState(() => (tmpl?.suggestedLocationKey ? t(tmpl.suggestedLocationKey) : ""));
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [attendees, setAttendees] = useState(() => (tmpl ? tmpl.defaultAttendees : 0));
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [description, setDescription] = useState(() =>
    tmpl
      ? tmpl.suggestedAgendaKeys
          .map((k) => t(k))
          .filter(Boolean)
          .join("\n")
      : "",
  );
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [proposal, setProposal] = useState<EventFileMeta | null>(null);
  const [report, setReport] = useState<EventFileMeta | null>(null);
  const [saving, setSaving] = useState(false);

  const pendingIdRef = useRef<string | null>(null);

  // Load members for the participant picker (runs once when the form mounts).
  useEffect(() => {
    void (async () => {
      const db = await getDb();
      setMembers(await db.select<Member[]>("SELECT * FROM members ORDER BY name ASC"));
    })();
  }, []);

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const updateSocialLink = (idx: number, value: string) => {
    setSocialLinks((prev) => prev.map((l, i) => (i === idx ? value : l)));
  };
  const addSocialLink = () => setSocialLinks((prev) => [...prev, ""]);
  const removeSocialLink = (idx: number) => setSocialLinks((prev) => prev.filter((_, i) => i !== idx));

  const handleFile = async (kind: "proposal" | "report", file: File | undefined) => {
    if (!file) return;
    const id = pendingIdRef.current ?? `evt-${crypto.randomUUID()}`;
    pendingIdRef.current = id;
    const meta = await storeEventFile(coopId, id, file);
    if (kind === "proposal") setProposal(meta);
    else setReport(meta);
  };

  const removeFile = (kind: "proposal" | "report") => {
    if (kind === "proposal") setProposal(null);
    else setReport(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      const id = pendingIdRef.current ?? `evt-${crypto.randomUUID()}`;
      const input: NewEventInput = {
        type,
        title: title.trim(),
        date,
        location: location.trim(),
        duration_min: durationMin === "" ? null : Number(durationMin),
        participant_ids: participantIds,
        proposal,
        report,
        social_links: socialLinks.map((l) => l.trim()).filter(Boolean),
        description: description.trim(),
        notes: notes.trim(),
      };
      await createEvent(coopId, input, id);
      pendingIdRef.current = null;
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return {
    title,
    setTitle,
    type,
    setType,
    date,
    setDate,
    location,
    setLocation,
    durationMin,
    setDurationMin,
    attendees,
    setAttendees,
    participantIds,
    toggleParticipant,
    members,
    description,
    setDescription,
    socialLinks,
    updateSocialLink,
    addSocialLink,
    removeSocialLink,
    notes,
    setNotes,
    proposal,
    report,
    handleFile,
    removeFile,
    saving,
    handleSave,
  };
}

export type { Kegiatan };
