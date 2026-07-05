import DevDocStripe from "@/components/DevDocStripe";
import readmeContent from "./README.md?raw";
import "./Feasibility.css";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeasibility } from "@/hooks/useFeasibility";

const TIER_COLORS: Record<number, string> = { 1: "emerald", 2: "amber", 3: "rose" };

export default function Feasibility() {
  const f = useFeasibility();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <DevDocStripe content={readmeContent} />
      <Tabs
        value={f.feasibilityActiveTab}
        onValueChange={(val) => f.setFeasibilityActiveTab(val as typeof f.feasibilityActiveTab)}
      >
        <TabsList className="bg-sidebar border border-border text-muted-foreground mb-6 p-0.5 rounded-lg flex w-fit">
          <TabsTrigger
            value="calculator"
            className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            {t("feasibility.tabs.calculator")}
          </TabsTrigger>
          <TabsTrigger
            value="sensitivity"
            className="text-xxs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
          >
            {t("feasibility.tabs.sensitivity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                {t("feasibility.calculator.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4">
                {[
                  { label: t("feasibility.calculator.investment"), key: "initialInvestment" as const },
                  { label: t("feasibility.calculator.years"), key: "projectionYears" as const },
                  { label: t("feasibility.calculator.cashFlows"), key: "cashFlows" as const },
                  { label: t("feasibility.calculator.discountRate"), key: "discountRate" as const },
                  { label: t("feasibility.calculator.opportunityCost"), key: "opportunityCost" as const },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-muted-foreground font-mono text-xxxs uppercase">{label}</label>
                    <Input
                      type={key === "cashFlows" ? "text" : "number"}
                      value={f.feasibilityParams[key]}
                      onChange={(e) =>
                        f.setFeasibilityParams({
                          ...f.feasibilityParams,
                          [key]: key === "cashFlows" ? e.target.value : Number(e.target.value),
                        })
                      }
                      className="bg-input border-border text-xs h-8"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={f.calculateFeasibility}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9"
              >
                {t("feasibility.calculator.calculate")}
              </Button>
            </CardContent>
          </Card>

          {f.feasibilityResults && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  {t("feasibility.calculator.resultsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    {
                      label: t("feasibility.calculator.enpv"),
                      value: `Rp ${f.feasibilityResults.enpv.toLocaleString()}`,
                      pass: f.feasibilityResults.isNPVPass,
                    },
                    {
                      label: t("feasibility.calculator.eirr"),
                      value: `${f.feasibilityResults.eirr.toFixed(2)}%`,
                      pass: f.feasibilityResults.isIRRPass,
                    },
                    {
                      label: t("feasibility.calculator.ebcr"),
                      value: f.feasibilityResults.ebcr.toFixed(4),
                      pass: f.feasibilityResults.isBCRPass,
                    },
                    {
                      label: t("feasibility.calculator.tier"),
                      value: f.feasibilityResults.tierLabel ?? "",
                      accent: TIER_COLORS[f.feasibilityResults.tier],
                    },
                  ].map(({ label, value, pass, accent }) => (
                    <div
                      key={label}
                      className={`p-3 rounded-xl border ${pass === false ? "border-rose-500/20 bg-rose-500/5" : pass === true ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-card"}`}
                    >
                      <p className="text-xxxs font-mono text-muted-foreground">{label}</p>
                      <p
                        className={`text-sm font-black font-mono mt-1 ${accent ? `text-${accent}-400` : "text-foreground"}`}
                      >
                        {value}
                      </p>
                      {pass !== undefined && (
                        <span
                          className={`text-xxxs font-mono font-bold ${pass ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {pass ? t("feasibility.calculator.pass") : t("feasibility.calculator.fail")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                {t("feasibility.sensitivity.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                {(["optimis", "moderat", "pesimis"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={f.sensitivityScenario === s ? "default" : "outline"}
                    className={`text-xs h-8 font-bold ${f.sensitivityScenario === s ? "bg-emerald-500 text-slate-950" : "border-border text-muted-foreground"}`}
                    onClick={() => f.handleSensitivityScenarioChange(s)}
                  >
                    {s === "optimis"
                      ? t("feasibility.sensitivity.scenarios.optimis")
                      : s === "moderat"
                        ? t("feasibility.sensitivity.scenarios.moderat")
                        : t("feasibility.sensitivity.scenarios.pesimis")}
                  </Button>
                ))}
              </div>
              {f.sensitivityPresetResults && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: t("feasibility.sensitivity.capital"),
                      value: `Rp ${Math.round(f.sensitivityPresetResults?.investment ?? 0).toLocaleString()}`,
                    },
                    {
                      label: t("feasibility.calculator.enpv"),
                      value: `Rp ${f.sensitivityPresetResults.enpv.toLocaleString()}`,
                    },
                    {
                      label: t("feasibility.calculator.eirr"),
                      value: `${f.sensitivityPresetResults.eirr.toFixed(2)}%`,
                    },
                    { label: t("feasibility.calculator.ebcr"), value: f.sensitivityPresetResults.ebcr.toFixed(4) },
                    {
                      label: t("feasibility.calculator.tier"),
                      value: f.sensitivityPresetResults.tierLabel ?? "",
                      accent: TIER_COLORS[f.sensitivityPresetResults.tier],
                    },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="p-3 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-1 mb-1">
                        <Info className="h-2.5 w-2.5 text-muted-foreground" />
                        <p className="text-xxxs font-mono text-muted-foreground">{label}</p>
                      </div>
                      <p
                        className={`text-sm font-black font-mono ${accent ? `text-${accent}-400` : "text-foreground"}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
