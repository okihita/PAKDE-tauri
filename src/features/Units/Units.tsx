import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUnits } from "@/hooks/useUnits";
import { Building2, Plus, Sparkles, Power, Activity, Code } from "lucide-react";
import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Units.css";

export default function Units() {
  const { t } = useTranslation();
  const u = useUnits();
  useEffect(() => {
    u.loadUnitsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [schemaData, setSchemaData] = useState<Array<{ name: string; sql: string }>>([]);

  const handleOpenSchema = async () => {
    const data = await u.getDatabaseSchema();
    setSchemaData(data);
    setShowSchema(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await u.createBusinessUnit(name, icon);
    if (success) {
      setName("");
      setIcon("");
      setIsOpen(false);
    }
  };

  const activeUnits = u.categoriesList.filter((cat) => u.activeUnitIds.includes(cat.id));
  const inactiveUnits = u.categoriesList.filter((cat) => !u.activeUnitIds.includes(cat.id));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl mx-auto">
      <DevDocStripe content={readmeContent} />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{t("units.title")}</h1>
            <p className="text-xxs text-muted-foreground">{t("units.description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {import.meta.env.DEV && (
            <Button
              onClick={handleOpenSchema}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold text-xs h-9 px-4 flex items-center gap-1.5"
            >
              <Code className="h-4 w-4" />
              {t("units.viewSchema")}
            </Button>
          )}
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 px-4 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("units.register")}
          </Button>
        </div>
      </div>

      {/* Active Units list */}
      <div className="space-y-3">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          {t("units.active")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeUnits.map((unit) => {
            const revenue = u.revenues[unit.id] ?? 0;
            return (
              <Card
                key={unit.id}
                className="bg-card border-emerald-500/15 bg-gradient-to-br from-emerald-500/5 via-card to-transparent overflow-hidden"
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                      {unit.icon}
                    </span>
                    <div>
                      <CardTitle className="text-xs font-bold text-foreground">{unit.name}</CardTitle>
                      <span className="text-xxs font-mono text-muted-foreground uppercase tracking-wider block mt-0.5">
                        {t("units.idLabel")}: {unit.id}
                      </span>
                    </div>
                  </div>
                  <span className="text-xxxs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    {t("units.activeBadge")}
                  </span>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-input/40 border border-border">
                    <span className="text-xxxs font-mono text-muted-foreground uppercase">{t("units.revenue")}</span>
                    <p className="text-xs font-bold font-mono mt-1 text-emerald-400">
                      {revenue > 0 ? `Rp ${revenue.toLocaleString("id-ID")}` : t("units.noRevenues")}
                    </p>
                  </div>
                  <Button
                    onClick={() => u.toggleUnitStatus(unit.id, true)}
                    variant="outline"
                    className="w-full border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 text-muted-foreground text-xxs h-8 flex items-center gap-1.5"
                  >
                    <Power className="h-3 w-3" />
                    {t("units.toggleActive")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {activeUnits.length === 0 && (
            <Card className="col-span-2 border-dashed border-border py-8 text-center text-muted-foreground text-xs font-mono">
              <CardContent>{t("units.noRevenues")}</CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Inactive Units list */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-xxs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          {t("units.inactive")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
          {inactiveUnits.map((unit) => (
            <Card key={unit.id} className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 rounded-xl bg-secondary flex items-center justify-center grayscale">
                    {unit.icon}
                  </span>
                  <div>
                    <CardTitle className="text-xs font-bold text-muted-foreground">{unit.name}</CardTitle>
                    <span className="text-xxs font-mono text-muted-foreground uppercase tracking-wider block mt-0.5">
                      {t("units.idLabel")}: {unit.id}
                    </span>
                  </div>
                </div>
                <span className="text-xxxs font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                  {t("units.inactiveBadge")}
                </span>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => u.toggleUnitStatus(unit.id, false)}
                  variant="outline"
                  className="w-full border-border hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground text-xxs h-8 flex items-center gap-1.5"
                >
                  <Power className="h-3 w-3" />
                  {t("units.toggleInactive")}
                </Button>
              </CardContent>
            </Card>
          ))}
          {inactiveUnits.length === 0 && (
            <div className="col-span-2 text-center text-muted-foreground text-xxs font-mono py-4">
              {t("dashboard.noAlerts")}
            </div>
          )}
        </div>
      </div>

      {/* Register Unit dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{t("units.form.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("units.form.name")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("units.form.namePlaceholder")}
                className="bg-input border-border text-xs h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xxs font-mono text-muted-foreground">{t("units.form.icon")}</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={t("units.form.iconPlaceholder")}
                className="bg-input border-border text-xs h-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-border text-muted-foreground text-xs h-8"
              >
                {t("units.form.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-8 px-4 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {t("units.form.submit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schema View dialog */}
      <Dialog open={showSchema} onOpenChange={(open) => !open && setShowSchema(false)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">{t("units.schemaTitle")}</DialogTitle>
            <DialogDescription className="text-xxs text-muted-foreground">{t("units.schemaDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {schemaData.map((table) => (
              <div key={table.name} className="space-y-1.5">
                <span className="text-xxs font-mono font-bold text-emerald-400">{table.name}</span>
                <pre className="text-xxs font-mono bg-sidebar border border-border text-foreground p-3 rounded-lg overflow-x-auto select-all leading-normal">
                  {table.sql}
                </pre>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
