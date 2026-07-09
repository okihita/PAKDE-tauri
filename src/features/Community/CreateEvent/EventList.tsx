import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  SparkleIcon,
  MapPinIcon,
  UsersIcon,
  LinkIcon,
  PaperclipIcon,
  CalendarPlus,
} from "@phosphor-icons/react";
import type { Kegiatan } from "./eventsDb";

interface Props {
  events: Kegiatan[];
  onNew: () => void;
  onDelete: (ev: Kegiatan) => void;
}

export default function EventList({ events, onNew, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-warning" />
          {t("sidebar.nav.kegiatan")}
        </h3>
        {events.length > 0 && (
          <Button onClick={onNew} className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8 px-3">
            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
            {t("event.form.save")}
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mb-6">
            <CalendarIcon className="h-9 w-9 text-warning/60" />
          </div>
          <h2 className="text-sm font-bold text-foreground mb-2">{t("event.empty.title")}</h2>
          <p className="text-xxs text-muted-foreground max-w-xs mb-8 leading-relaxed">{t("event.empty.description")}</p>
          <Button onClick={onNew} className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 px-5">
            <SparkleIcon className="h-3.5 w-3.5 mr-1.5" />
            {t("event.empty.cta")}
          </Button>
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-xs w-full">
            {[
              { icon: CalendarIcon, label: t("event.empty.hint1") },
              { icon: MapPinIcon, label: t("event.empty.hint2") },
              { icon: CalendarIcon, label: t("event.empty.hint3") },
              { icon: SparkleIcon, label: t("event.empty.hint4") },
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
              className="bg-slate-950/60 border-slate-900/80 hover:border-warning/20 transition-all group"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{ev.title}</h4>
                    <p className="text-xxxs font-mono text-warning mt-0.5">
                      {`${t(`event.type.${ev.type}`)} · ${ev.date}`}
                      {ev.duration_min ? ` · ${ev.duration_min}m` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ev)}
                    className="h-7 w-7 text-danger hover:text-danger hover:bg-danger/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-xxxs font-mono">✕</span>
                  </Button>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1.5 text-xxxs text-slate-400 font-mono">
                    <MapPinIcon className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xxxs font-mono text-slate-400">
                  {ev.participant_ids.length > 0 && (
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3 text-slate-500" />
                      {ev.participant_ids.length}
                    </span>
                  )}
                  {ev.proposal && (
                    <span className="flex items-center gap-1" title={ev.proposal.name}>
                      <PaperclipIcon className="h-3 w-3 text-info" />
                      {t("event.proposal")}
                    </span>
                  )}
                  {ev.report && (
                    <span className="flex items-center gap-1" title={ev.report.name}>
                      <PaperclipIcon className="h-3 w-3 text-success" />
                      {t("event.report")}
                    </span>
                  )}
                  {ev.social_links.length > 0 && (
                    <span className="flex items-center gap-1">
                      <LinkIcon className="h-3 w-3 text-slate-500" />
                      {ev.social_links.length}
                    </span>
                  )}
                </div>
                {ev.description && (
                  <p className="text-xxxs text-foreground/80 leading-relaxed line-clamp-3">{ev.description}</p>
                )}
                {ev.notes && <p className="text-xxxs text-muted-foreground leading-relaxed line-clamp-2">{ev.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
