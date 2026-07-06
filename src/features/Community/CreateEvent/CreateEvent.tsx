import "./CreateEvent.css";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarPlus, MapPin, Clock, FileText } from "lucide-react";

export default function CreateEvent() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-auto p-6 max-w-xl">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CalendarPlus className="h-3.5 w-3.5 text-amber-400" />
            {t("sidebar.nav.event")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground">{t("event.form.name")}</label>
            <Input placeholder={t("event.form.namePlaceholder")} className="bg-input border-border text-xs h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("event.form.date")}</label>
              <Input type="date" className="bg-input border-border text-xs h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("event.form.time")}</label>
              <Input type="time" className="bg-input border-border text-xs h-9" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t("event.form.location")}
            </label>
            <Input placeholder={t("event.form.locationPlaceholder")} className="bg-input border-border text-xs h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> {t("event.form.description")}
            </label>
            <textarea
              className="w-full bg-input border-border text-xs text-foreground rounded-lg p-2.5 h-24 resize-none placeholder:text-muted-foreground"
              placeholder={t("event.form.descriptionPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2 text-xxs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t("event.form.note")}</span>
          </div>
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9">
            <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> {t("event.form.save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
