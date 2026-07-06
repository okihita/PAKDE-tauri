import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { EVENT_TEMPLATES, computePredictions, formatIdr, type EventTemplate, importanceStars } from "./eventTemplates";

interface Props {
  onSelect: (template: EventTemplate) => void;
  onBack: () => void;
}

export default function EventTemplatePicker({ onSelect, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xxs text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("common.back")}
      </button>

      <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-5">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        {t("event.template.heading")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EVENT_TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          const isCustom = tmpl.id === "custom";
          const stars = importanceStars(tmpl.importance);
          const prepLabel =
            tmpl.prepDays > 0 ? t("event.template.prepDays", { days: tmpl.prepDays }) : t("event.template.prepCustom");

          return (
            <Card
              key={tmpl.id}
              onClick={() => onSelect(tmpl)}
              className={`cursor-pointer transition-all group ${
                isCustom
                  ? "bg-slate-950/30 border-dashed border-2 border-slate-800 hover:border-emerald-500/30"
                  : "bg-slate-950/60 border-slate-900/80 hover:border-amber-500/20"
              }`}
            >
              <CardContent
                className={`p-4 space-y-2.5 ${
                  isCustom ? "flex flex-col items-center justify-center min-h-[140px]" : ""
                }`}
              >
                {isCustom ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-1 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                      <Icon className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-400 transition-colors">
                      {t(tmpl.i18nKey)}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="text-xxxs font-mono text-amber-400/70 leading-tight text-right">{stars}</span>
                    </div>
                    <h4 className="text-xs font-bold text-foreground leading-snug">{t(tmpl.i18nKey)}</h4>
                    <div className="flex items-center gap-3 text-xxxs font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-600" />
                        {prepLabel}
                      </span>
                      {tmpl.legalNoteKey && (
                        <span className="text-amber-400/60 truncate" title={t(tmpl.legalNoteKey)}>
                          {t(tmpl.legalNoteKey)}
                        </span>
                      )}
                    </div>
                    <div className="text-xxxs font-mono text-slate-500 pt-0.5">
                      {t("event.template.estCost", {
                        cost: formatIdr(computePredictions(tmpl, tmpl.defaultAttendees, "").totalCost),
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
