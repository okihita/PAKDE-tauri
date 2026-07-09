import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  BuildingsIcon,
  Database,
  GlobeIcon,
  PulseIcon,
  CheckCircleIcon,
  ArrowsClockwise,
  SparkleIcon,
  FileTextIcon,
  WarningIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import "./Development.css";
import type { TabId } from "@/features/System/moduleUnlock";

export default function Development({ onTabChange }: { onTabChange?: (tab: TabId) => void }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulation steps interval
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setAnalysisCompleted(true);
          return 100;
        }
        const next = prev + 5;
        if (next >= 100) return 100;

        // Advance steps based on percentage
        if (next >= 75) setAnalysisStep(4);
        else if (next >= 50) setAnalysisStep(3);
        else if (next >= 25) setAnalysisStep(2);
        else setAnalysisStep(1);

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleStartAnalysis = () => {
    setProgress(0);
    setAnalysisStep(0);
    setAnalysisCompleted(false);
    setIsAnalyzing(true);
  };

  const handleReset = () => {
    setAnalysisCompleted(false);
    setIsAnalyzing(false);
    setAnalysisStep(0);
    setProgress(0);
  };

  const handleExport = () => {
    toast.success(t("development.simulation.exportSuccess"));
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <BuildingsIcon className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">{t("development.title")}</h1>
          <p className="text-xxs text-muted-foreground">{t("development.description")}</p>
        </div>
      </div>

      {/* Stepper Workflow section */}
      <Card className="bg-card border-border overflow-hidden hover-glow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <PulseIcon className="h-3.5 w-3.5 text-success" />
            {t("development.workflow.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                analysisStep >= 1 ? "border-success/30 bg-success/5" : "border-border bg-input/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Database className={`h-4 w-4 ${analysisStep >= 1 ? "text-success" : "text-muted-foreground"}`} />
                {analysisStep > 1 && <CheckCircleIcon className="h-3.5 w-3.5 text-success" />}
              </div>
              <p className={`text-xxs font-bold ${analysisStep >= 1 ? "text-success" : "text-foreground"}`}>
                {t("development.workflow.step1.title")}
              </p>
              <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
                {t("development.workflow.step1.desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                analysisStep >= 2 ? "border-success/30 bg-success/5" : "border-border bg-input/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <GlobeIcon className={`h-4 w-4 ${analysisStep >= 2 ? "text-success" : "text-muted-foreground"}`} />
                {analysisStep > 2 && <CheckCircleIcon className="h-3.5 w-3.5 text-success" />}
              </div>
              <p className={`text-xxs font-bold ${analysisStep >= 2 ? "text-success" : "text-foreground"}`}>
                {t("development.workflow.step2.title")}
              </p>
              <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
                {t("development.workflow.step2.desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                analysisStep >= 3 ? "border-success/30 bg-success/5" : "border-border bg-input/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <SparkleIcon className={`h-4 w-4 ${analysisStep >= 3 ? "text-success" : "text-muted-foreground"}`} />
                {analysisStep > 3 && <CheckCircleIcon className="h-3.5 w-3.5 text-success" />}
              </div>
              <p className={`text-xxs font-bold ${analysisStep >= 3 ? "text-success" : "text-foreground"}`}>
                {t("development.workflow.step3.title")}
              </p>
              <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
                {t("development.workflow.step3.desc")}
              </p>
            </div>

            {/* Step 4 */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                analysisStep >= 4 ? "border-success/30 bg-success/5" : "border-border bg-input/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileTextIcon className={`h-4 w-4 ${analysisStep >= 4 ? "text-success" : "text-muted-foreground"}`} />
                {analysisCompleted && <CheckCircleIcon className="h-3.5 w-3.5 text-success" />}
              </div>
              <p className={`text-xxs font-bold ${analysisStep >= 4 ? "text-success" : "text-foreground"}`}>
                {t("development.workflow.step4.title")}
              </p>
              <p className="text-xxxs text-muted-foreground mt-1 leading-normal">
                {t("development.workflow.step4.desc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Screen */}
      {!isAnalyzing && !analysisCompleted && (
        <Card className="bg-card border-border border-dashed py-8">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <SparkleIcon className="h-6 w-6 text-success animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">{t("development.simulation.ctaTitle")}</h3>
              <p className="text-xxs text-muted-foreground leading-relaxed">{t("development.simulation.ctaDesc")}</p>
            </div>
            <Button
              onClick={handleStartAnalysis}
              className="bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 px-6 flex items-center gap-2"
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              {t("development.simulation.button")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Diagnostic Console */}
      {isAnalyzing && (
        <Card className="bg-sidebar border-border font-mono">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xxs font-bold text-success flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand animate-ping inline-block" />
                {t("development.simulation.analyzing")}
              </span>
              <span className="text-xxs text-muted-foreground">{progress}%</span>
            </div>

            {/* Simulated log stream */}
            <div className="space-y-2 h-20 overflow-hidden text-xxxs text-foreground">
              {analysisStep >= 1 && (
                <p className="flex items-center gap-2 text-success">
                  <span>✔</span>
                  {t("development.simulation.states.1")}
                </p>
              )}
              {analysisStep >= 2 && (
                <p className="flex items-center gap-2 text-success">
                  <span>✔</span>
                  {t("development.simulation.states.2")}
                </p>
              )}
              {analysisStep >= 3 && (
                <p className="flex items-center gap-2 text-success animate-pulse">
                  <span>✔</span>
                  {t("development.simulation.states.3")}
                </p>
              )}
              {analysisStep >= 4 && (
                <p className="flex items-center gap-2 text-success">
                  <span>✔</span>
                  {t("development.simulation.states.4")}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendation Result Page */}
      {analysisCompleted && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-card border-success/20 bg-linear-to-br from-success/5 via-card to-transparent overflow-hidden hover-glow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <span className="text-xxxs font-mono font-bold text-success uppercase tracking-widest bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                  {t("development.preview.badge")}
                </span>
                <h3 className="text-sm font-bold text-foreground mt-2">{t("development.preview.title")}</h3>
              </div>
              <span className="text-xxs font-mono font-black text-success">{t("development.preview.suitability")}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-input/40 border border-border">
                <p className="text-xs font-bold text-foreground flex items-center gap-2">
                  <SparkleIcon className="h-3.5 w-3.5 text-warning" />
                  {t("development.preview.unitName")}
                </p>
                <p className="text-xxs text-muted-foreground mt-1.5 leading-relaxed">
                  {t("development.preview.reason")}
                </p>
              </div>

              {/* Opportunity-fit grid (financial validation lives in Kelayakan Finansial) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-border bg-input/20">
                  <span className="text-xxxs font-mono text-gray-400 uppercase">
                    {t("development.preview.metrics.potensiLabel")}
                  </span>
                  <p className="text-xs font-bold font-mono mt-1 text-success">
                    {t("development.preview.metrics.potensi")}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-input/20">
                  <span className="text-xxxs font-mono text-gray-400 uppercase">
                    {t("development.preview.metrics.kapasitasLabel")}
                  </span>
                  <p className="text-xs font-bold font-mono mt-1 text-success">
                    {t("development.preview.metrics.kapasitas")}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-input/20">
                  <span className="text-xxxs font-mono text-gray-400 uppercase">
                    {t("development.preview.metrics.peluangLabel")}
                  </span>
                  <p className="text-xs font-bold font-mono mt-1 text-success">
                    {t("development.preview.metrics.peluang")}
                  </p>
                </div>
              </div>

              {/* Warnings and next actions */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                {onTabChange ? (
                  <Button
                    onClick={() => onTabChange("feasibility")}
                    className="w-full md:w-auto bg-brand hover:bg-brand text-brand-foreground font-bold text-xs h-9 px-5 flex items-center justify-center gap-2"
                  >
                    {t("development.preview.validateCta")}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="w-full md:w-auto border-border text-muted-foreground font-bold text-xs h-9 px-5 flex items-center justify-center gap-2"
                  >
                    <FileTextIcon className="h-3.5 w-3.5" />
                    {t("development.simulation.export")}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full md:w-auto border-border text-muted-foreground font-bold text-xs h-9 px-5 flex items-center justify-center gap-2"
                  >
                    <ArrowsClockwise className="h-3.5 w-3.5" />
                    {t("development.simulation.reset")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Federated WarningIcon alert */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-warning/10 bg-warning/5 text-xxs text-warning/80 leading-normal">
        <WarningIcon className="h-4 w-4 shrink-0 text-warning mt-0.5" />
        <span>{t("development.preview.alert")}</span>
      </div>
    </div>
  );
}
