import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarIcon,
  SparkleIcon,
  MapPinIcon,
  UsersIcon,
  LinkIcon,
  PaperclipIcon,
  CalendarPlus,
  ClockIcon,
  TagIcon,
  WarningIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { openPath, openUrl } from "@tauri-apps/plugin-opener";
import type { Kegiatan, EventFileMeta } from "./eventsDb";
import { absoluteEventFilePath } from "./fileStore";

interface Props {
  events: Kegiatan[];
  onNew: () => void;
  onDelete: (ev: Kegiatan) => void;
}

export default function EventList({ events, onNew, onDelete }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Kegiatan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Kegiatan | null>(null);

  const openFile = async (meta: EventFileMeta) => {
    try {
      await openPath(await absoluteEventFilePath(meta.path));
    } catch (err) {
      console.error("[events] failed to open file:", err);
    }
  };

  const openLink = async (url: string) => {
    try {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      await openUrl(href);
    } catch (err) {
      console.error("[events] failed to open link:", err);
    }
  };

  const confirmDeleteEvent = () => {
    if (confirmDelete) onDelete(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-warning" />
          {t("sidebar.nav.kegiatan")}
        </h3>
        <Button onClick={onNew} className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-8 px-3">
          <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
          {t("event.new")}
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mb-6">
            <CalendarIcon className="h-9 w-9 text-warning/60" />
          </div>
          <h2 className="text-sm font-bold text-foreground mb-2">{t("event.empty.title")}</h2>
          <p className="text-xxs text-muted-foreground max-w-xs mb-8 leading-relaxed">{t("event.empty.description")}</p>
          <div className="mt-2 grid grid-cols-2 gap-3 max-w-xs w-full">
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
              onClick={() => setSelected(ev)}
              className="bg-slate-950/60 border-slate-900/80 hover:border-warning/20 transition-all group cursor-pointer"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(ev);
                    }}
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

      {/* Detail dialog — read back a saved Kegiatan */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-foreground pr-6">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span>{t(`event.type.${selected.type}`)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span>{selected.date}</span>
                  {selected.duration_min ? (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                      {selected.duration_min}m
                    </span>
                  ) : null}
                </div>
                {selected.location && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span>{selected.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span>
                    {selected.participant_ids.length} {t("event.detail.participants").toLowerCase()}
                  </span>
                </div>

                {(selected.proposal || selected.report) && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
                      {t("event.detail.files")}
                    </p>
                    {selected.proposal &&
                      (() => {
                        const f = selected.proposal;
                        return (
                          <button
                            onClick={() => void openFile(f)}
                            className="flex items-center gap-2 w-full text-left text-xxxs text-info hover:text-info/80 transition-colors"
                          >
                            <PaperclipIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{f.name}</span>
                            <span className="ml-auto text-slate-500 shrink-0">{t("event.detail.open")}</span>
                          </button>
                        );
                      })()}
                    {selected.report &&
                      (() => {
                        const f = selected.report;
                        return (
                          <button
                            onClick={() => void openFile(f)}
                            className="flex items-center gap-2 w-full text-left text-xxxs text-success hover:text-success/80 transition-colors"
                          >
                            <PaperclipIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{f.name}</span>
                            <span className="ml-auto text-slate-500 shrink-0">{t("event.detail.open")}</span>
                          </button>
                        );
                      })()}
                  </div>
                )}

                {selected.social_links.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
                      {t("event.detail.socialLinks")}
                    </p>
                    {selected.social_links.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => void openLink(link)}
                        className="flex items-center gap-2 w-full text-left text-xxxs text-info hover:text-info/80 transition-colors truncate"
                      >
                        <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{link}</span>
                      </button>
                    ))}
                  </div>
                )}

                {selected.description && (
                  <div className="space-y-1 pt-1">
                    <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
                      {t("event.detail.description")}
                    </p>
                    <p className="text-xxxs text-foreground/80 leading-relaxed whitespace-pre-line">
                      {selected.description}
                    </p>
                  </div>
                )}

                {selected.notes && (
                  <div className="space-y-1 pt-1">
                    <p className="text-xxxs font-mono text-muted-foreground uppercase tracking-wider">
                      {t("event.detail.notes")}
                    </p>
                    <p className="text-xxxs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <WarningIcon className="h-4 w-4 text-danger" />
              {t("event.confirmDelete.title")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("event.confirmDelete.message", { title: confirmDelete?.title ?? "" })}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="border-border text-muted-foreground text-xs h-9 flex-1"
            >
              {t("event.confirmDelete.cancel")}
            </Button>
            <Button
              onClick={confirmDeleteEvent}
              className="bg-danger hover:bg-danger text-danger-foreground font-bold text-xs h-9 flex-1"
            >
              <TrashIcon className="h-3.5 w-3.5 mr-1.5" />
              {t("event.confirmDelete.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
