import { useTranslation } from "react-i18next";
import { Coins, Users, TrendingUp, ListChecks } from "lucide-react";
import { formatIdr, type Prediction } from "./eventTemplates";

interface Props {
  predictions: Prediction;
  recommendedStartDate: string;
}

export default function EventPredictionPanels({ predictions, recommendedStartDate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 pt-2">
      {/* Divider */}
      <div className="flex items-center gap-2 text-xxs font-mono text-slate-500 uppercase tracking-wider">
        <TrendingUp className="h-3 w-3 text-emerald-400" />
        {t("event.prediction.heading")}
      </div>

      {/* ── Cost Prediction ── */}
      <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 space-y-2">
        <h4 className="text-xxs font-mono font-bold text-amber-400 flex items-center gap-1.5">
          <Coins className="h-3 w-3" />
          {t("event.prediction.costTitle")}
        </h4>
        <div className="space-y-1">
          {predictions.costBreakdown.map((b) => (
            <div key={b.labelKey} className="flex justify-between text-xxxs font-mono">
              <span className="text-slate-500">{t(b.labelKey)}</span>
              <span className="text-slate-400">{formatIdr(b.value)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xxxs font-mono pt-1 border-t border-amber-500/10">
            <span className="text-amber-400 font-bold">{t("event.prediction.costTotal")}</span>
            <span className="text-amber-400 font-bold">{formatIdr(predictions.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* ── Engagement Prediction ── */}
      <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 space-y-1.5">
        <h4 className="text-xxs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          {t("event.prediction.engagementTitle")}
        </h4>
        <p className="text-xxxs text-slate-400 leading-relaxed">
          {t("event.prediction.engagementDesc", {
            expected: predictions.expectedAttendees,
            total: predictions.prepDays > 0 ? "N/A" : "—", // fallback rendered via template params
          })}
        </p>
      </div>

      {/* ── Prep Timeline ── */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 space-y-2">
        <h4 className="text-xxs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <ListChecks className="h-3 w-3" />
          {t("event.prediction.prepTitle")}
        </h4>

        {predictions.prepMilestones.length > 0 && (
          <div className="space-y-1">
            {predictions.prepMilestones.map((key) => (
              <div key={key} className="flex items-center gap-2 text-xxxs font-mono text-slate-500">
                <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                {t(key)}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between text-xxxs font-mono pt-1.5 border-t border-slate-700/30">
          <span className="text-slate-500">{t("event.prediction.prepDaysNeeded")}</span>
          <span className="text-amber-400 font-bold">
            {t("event.prediction.prepDaysValue", { days: predictions.prepDays })}
          </span>
        </div>

        {recommendedStartDate && (
          <div className="flex justify-between text-xxxs font-mono pt-0.5">
            <span className="text-slate-500">{t("event.prediction.prepStartBy")}</span>
            <span className="text-emerald-400 font-bold">{recommendedStartDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
