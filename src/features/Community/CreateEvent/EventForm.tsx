/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarPlus,
  MapPinIcon,
  ClockIcon,
  FileTextIcon,
  ArrowLeft,
  UsersIcon,
  Lightbulb,
  CheckSquareIcon,
  TrendUpIcon,
  LinkIcon,
  UploadIcon,
  XIcon,
  PlusIcon,
  NoteIcon,
  TagIcon,
  PaperclipIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import type { EventType } from "./eventsDb";
import EventPredictionPanels from "./EventPredictionPanels";
import { computePredictions, importanceStars, type EventTemplate } from "./eventTemplates";
import { useEventForm } from "./useEventForm";

const EVENT_TYPES: EventType[] = ["member_meeting", "arisan", "social", "training", "other"];

interface Props {
  coopId: string;
  selectedTemplate: EventTemplate | null;
  onBack: () => void;
  onSaved: () => void;
}

export default function EventForm({ coopId, selectedTemplate, onBack, onSaved }: Props) {
  const form = useEventForm(coopId, selectedTemplate, onSaved);
  const { t } = useTranslation();
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);
  const tmpl = selectedTemplate;
  const isCustom = !tmpl || tmpl.id === "custom";
  const FormIcon = isCustom ? CalendarPlus : tmpl!.icon;

  const predictions = computePredictions(tmpl!, form.attendees || tmpl!.defaultAttendees, form.date);

  // Missing-requirements summary — derived from the SAME predicates that gate
  // the Save button, so the hint and the disabled state can never drift apart.
  const missingRequirements: string[] = [];
  if (!form.title.trim()) missingRequirements.push(t("event.requiredTitle"));
  if (!form.date) missingRequirements.push(t("event.requiredDate"));

  return (
    <div className="flex-1 overflow-auto p-6 max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xxs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("event.form.backToTemplates")}
      </button>

      <Card className="bg-card border-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FormIcon className="h-3.5 w-3.5 text-warning" />
            {isCustom ? t("event.form.title") : t(tmpl!.i18nKey)}
            {!isCustom && (
              <span className="ml-auto flex items-center gap-1">
                <span className="text-xxxs font-mono text-warning/80">{importanceStars(tmpl!.importance)}</span>
                {tmpl!.legalNoteKey && (
                  <span className="text-xxxs font-mono text-warning/60 bg-warning/10 px-1.5 py-0.5 rounded">
                    {t(tmpl!.legalNoteKey)}
                  </span>
                )}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <TagIcon className="h-3 w-3" /> {t("event.typeLabel")}
            </label>
            <Select value={form.type} onValueChange={(v) => form.setType(v as EventType)}>
              <SelectTrigger className="w-full bg-input border-border text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground text-xs">
                {EVENT_TYPES.map((et) => (
                  <SelectItem key={et} value={et}>
                    {t(`event.type.${et}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground">{t("event.form.name")}</label>
            <Input
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder={t("event.form.namePlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Date / Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("event.form.date")}</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => form.setDate(e.target.value)}
                className="bg-input border-border text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
                <ClockIcon className="h-3 w-3" /> {t("event.duration")}
              </label>
              <Input
                type="number"
                min={0}
                value={form.durationMin}
                onChange={(e) => form.setDurationMin(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                placeholder={t("event.durationPlaceholder")}
                className="bg-input border-border text-xs h-9"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <MapPinIcon className="h-3 w-3" /> {t("event.form.location")}
            </label>
            <Input
              value={form.location}
              onChange={(e) => form.setLocation(e.target.value)}
              placeholder={t("event.form.locationPlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Participants */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <UsersIcon className="h-3 w-3" /> {t("event.participants")} ({form.participantIds.length})
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-input p-2 space-y-1">
              {form.members.length === 0 ? (
                <p className="text-xxxs text-muted-foreground px-1 py-1">{t("event.noMembers")}</p>
              ) : (
                form.members.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-xxxs text-foreground cursor-pointer rounded px-1 py-0.5 hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={form.participantIds.includes(m.id ?? "")}
                      onChange={() => form.toggleParticipant(m.id ?? "")}
                      className="h-3 w-3 accent-brand"
                    />
                    <span className="truncate">{m.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Attendees (planning estimate, drives predictions) */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <UsersIcon className="h-3 w-3" /> {t("event.form.attendees")}
            </label>
            <Input
              type="number"
              min={0}
              max={10000}
              value={form.attendees || ""}
              onChange={(e) => form.setAttendees(Math.max(0, Number(e.target.value)))}
              placeholder={t("event.form.attendeesPlaceholder")}
              className="bg-input border-border text-xs h-9"
            />
          </div>

          {/* Files: proposal + report (LPJ) */}
          <div className="space-y-2">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <PaperclipIcon className="h-3 w-3" /> {t("event.files")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Proposal */}
              <div className="space-y-1">
                <span className="text-xxxs font-mono text-info">{t("event.proposal")}</span>
                <input
                  ref={proposalInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => void form.handleFile("proposal", e.target.files?.[0])}
                />
                {form.proposal ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-info/20 bg-info/5 px-2 py-1.5">
                    <span className="text-xxxs text-foreground truncate">{form.proposal.name}</span>
                    <button
                      onClick={() => form.removeFile("proposal")}
                      className="text-danger hover:text-danger shrink-0"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => proposalInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xxxs text-muted-foreground py-2 hover:border-info/40 hover:text-info transition-colors"
                  >
                    <UploadIcon className="h-3.5 w-3.5" /> {t("event.upload")}
                  </button>
                )}
              </div>
              {/* LPJ / accountability report */}
              <div className="space-y-1">
                <span className="text-xxxs font-mono text-success">{t("event.report")}</span>
                <input
                  ref={reportInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => void form.handleFile("report", e.target.files?.[0])}
                />
                {form.report ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-success/20 bg-success/5 px-2 py-1.5">
                    <span className="text-xxxs text-foreground truncate">{form.report.name}</span>
                    <button
                      onClick={() => form.removeFile("report")}
                      className="text-danger hover:text-danger shrink-0"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => reportInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xxxs text-muted-foreground py-2 hover:border-success/40 hover:text-success transition-colors"
                  >
                    <UploadIcon className="h-3.5 w-3.5" /> {t("event.upload")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> {t("event.socialLinks")}
            </label>
            <div className="space-y-1.5">
              {form.socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={link}
                    onChange={(e) => form.updateSocialLink(idx, e.target.value)}
                    placeholder={t("event.linkPlaceholder")}
                    className="bg-input border-border text-xs h-8"
                  />
                  <button
                    onClick={() => form.removeSocialLink(idx)}
                    className="text-danger hover:text-danger shrink-0 p-1"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={form.addSocialLink}
                className="flex items-center gap-1 text-xxxs text-muted-foreground hover:text-foreground transition-colors"
              >
                <PlusIcon className="h-3 w-3" /> {t("event.addLink")}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <FileTextIcon className="h-3 w-3" /> {t("event.form.description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              className="w-full bg-input border-border text-xs text-foreground rounded-lg p-2.5 h-24 resize-none placeholder:text-muted-foreground"
              placeholder={t("event.form.descriptionPlaceholder")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <NoteIcon className="h-3 w-3" /> {t("event.notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              className="w-full bg-input border-border text-xs text-foreground rounded-lg p-2.5 h-20 resize-none placeholder:text-muted-foreground"
              placeholder={t("event.notesPlaceholder")}
            />
          </div>

          {/* Prediction panels */}
          {!isCustom && predictions && (
            <EventPredictionPanels predictions={predictions} recommendedStartDate={predictions.recommendedStartDate} />
          )}

          {/* Rationale + Checklist + ROI */}
          {!isCustom && tmpl!.rationaleKeys.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xxs font-mono text-slate-500 uppercase tracking-wider">
                <Lightbulb className="h-3 w-3 text-warning" />
                {t("event.rationale.heading")}
              </div>

              {/* Why this event */}
              <div className="rounded-lg border border-warning/10 bg-warning/[0.03] p-3 space-y-1.5">
                <h4 className="text-xxs font-mono font-bold text-warning flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3" />
                  {t("event.rationale.whyTitle")}
                </h4>
                {tmpl!.rationaleKeys.map((key) => (
                  <p key={key} className="text-xxxs text-slate-400 leading-relaxed">
                    {t(key)}
                  </p>
                ))}
              </div>

              {/* Checklist */}
              {tmpl!.checklistKeys.length > 0 && (
                <div className="rounded-lg border border-success/10 bg-brand/[0.03] p-3 space-y-1.5">
                  <h4 className="text-xxs font-mono font-bold text-success flex items-center gap-1.5">
                    <CheckSquareIcon className="h-3 w-3" />
                    {t("event.rationale.checklistTitle")}
                  </h4>
                  <div className="space-y-1">
                    {tmpl!.checklistKeys.map((key) => (
                      <div key={key} className="flex items-center gap-2 text-xxxs font-mono text-slate-400">
                        <span className="text-success/60">☐</span>
                        {t(key)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cooperative ROI */}
              {tmpl!.roiKeys.length > 0 && (
                <div className="rounded-lg border border-info/10 bg-info/[0.03] p-3 space-y-1.5">
                  <h4 className="text-xxs font-mono font-bold text-info flex items-center gap-1.5">
                    <TrendUpIcon className="h-3 w-3" />
                    {t("event.rationale.roiTitle")}
                  </h4>
                  {tmpl!.roiKeys.map((key) => (
                    <p key={key} className="text-xxxs text-slate-400 leading-relaxed">
                      {t(key)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Note + Buttons */}
          <div className="flex items-center gap-2 text-xxs text-muted-foreground">
            <ClockIcon className="h-3 w-3" />
            <span>{t("event.form.note")}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-border text-muted-foreground text-xs h-9 flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void form.handleSave()}
              disabled={!form.title.trim() || !form.date || form.saving}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 flex-1 disabled:opacity-40"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> {t("event.form.save")}
            </Button>
          </div>

          {/* Missing requirements — mirrors the Save gate above, shown only when unmet */}
          {missingRequirements.length > 0 && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 space-y-1">
              <p className="text-xxxs font-mono text-warning">{t("event.requiredHint")}</p>
              <ul className="space-y-0.5">
                {missingRequirements.map((m) => (
                  <li key={m} className="flex items-center gap-1.5 text-xxxs text-foreground">
                    <WarningIcon className="h-3 w-3 text-warning shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
