import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getXpEvents, type XpEvent } from "@/data/xp";
import { XP_SOURCES } from "@/data/xp-core";

function actionLabel(action: string, isId: boolean, t: (k: string) => string): string {
  const src = XP_SOURCES[action];
  if (src) return isId ? src.labelId : src.labelEn;
  if (action === "xp_baseline") return t("leveling.xpBaseline");
  if (action === "member_removed") return t("leveling.xpMemberRemoved");
  return action;
}

export default function XpFeed({ coopId, refreshKey }: { coopId: string; refreshKey?: number }) {
  const { t, i18n } = useTranslation();
  const isId = i18n.language.startsWith("id");
  const [events, setEvents] = useState<XpEvent[]>([]);

  useEffect(() => {
    let active = true;
    getXpEvents(coopId)
      .then((rows) => {
        if (active) setEvents(rows);
      })
      .catch((e) => {
        console.error(e);
        if (active) setEvents([]);
      });
    return () => {
      active = false;
    };
  }, [coopId, refreshKey]);

  return (
    <Card className="bg-card border-border text-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${events.length ? "bg-brand" : "bg-muted"}`} />
          {t("leveling.xpActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xxs text-muted-foreground text-center py-4">{t("leveling.xpEmpty")}</p>
        ) : (
          <ul className="space-y-1 max-h-72 overflow-y-auto font-mono text-xxs">
            {events.map((ev) => {
              const gain = ev.delta >= 0;
              return (
                <li
                  key={ev.id}
                  className="flex items-center justify-between gap-3 py-1 px-2 rounded hover:bg-secondary"
                >
                  <span className="text-muted-foreground shrink-0">
                    {format(new Date(ev.createdAt), "dd MMM HH:mm")}
                  </span>
                  <span className="flex-1 truncate">{actionLabel(ev.action, isId, t)}</span>
                  <span className={`shrink-0 font-bold ${gain ? "text-success" : "text-danger"}`}>
                    {gain ? `+${ev.delta}` : ev.delta}
                  </span>
                  <span className="text-muted-foreground shrink-0 w-10 text-right">{ev.totalAfter}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
