import { useState } from "react";
import type { FeasibilityResult, SensitivityResult } from "@/types";
import { useToast } from "@/hooks/useToast";

const DEFAULT_PARAMS = {
  initialInvestment: 50000000,
  projectionYears: 5,
  cashFlows: "18000000,22000000,25000000,28000000,30000000",
  discountRate: 8.5,
  opportunityCost: 5.0,
};

export function useFeasibility() {
  const toast = useToast();

  const [feasibilityActiveTab, setFeasibilityActiveTab] = useState<"calculator" | "sensitivity">("calculator");
  const [feasibilityParams, setFeasibilityParams] = useState(DEFAULT_PARAMS);
  const [feasibilityResults, setFeasibilityResults] = useState<FeasibilityResult | null>(null);
  const [sensitivityScenario, setSensitivityScenario] = useState<"optimis" | "moderat" | "pesimis">("moderat");
  const [sensitivityPresetResults, setSensitivityPresetResults] = useState<SensitivityResult | null>(null);

  const calculateFeasibility = () => {
    const { initialInvestment, projectionYears, cashFlows, discountRate } = feasibilityParams;
    const rate = Number(discountRate) / 100;
    const flows = cashFlows.split(",").map(Number);

    if (flows.length !== Number(projectionYears)) {
      toast.error("Error: Jumlah elemen arus kas tidak sesuai dengan Tahun Proyeksi.");
      return;
    }

    let pvBenefits = 0;
    for (let t = 0; t < flows.length; t++) pvBenefits += flows[t] / Math.pow(1 + rate, t + 1);
    const enpv = pvBenefits - Number(initialInvestment);
    const ebcr = pvBenefits / Number(initialInvestment);

    const npvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < flows.length; t++) sum += flows[t] / Math.pow(1 + r, t + 1);
      return sum - Number(initialInvestment);
    };
    const dNpvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < flows.length; t++) sum += (-(t + 1) * flows[t]) / Math.pow(1 + r, t + 2);
      return sum;
    };

    let eirr = 0.1,
      iterations = 0,
      diff = 1;
    const error = 1e-6;
    while (Math.abs(diff) > error && iterations < 100) {
      const npvVal = npvFunc(eirr),
        dNpvVal = dNpvFunc(eirr);
      if (dNpvVal === 0) break;
      diff = eirr - npvVal / dNpvVal - eirr;
      eirr -= npvVal / dNpvVal;
      iterations++;
    }

    const eirrPct = eirr * 100;
    let tier = 3,
      tierLabel = "Tidak Layak",
      tierColor = "red";
    const isNPVPass = enpv > 0,
      isIRRPass = eirrPct > Number(discountRate),
      isBCRPass = ebcr >= 1.0;

    if (isNPVPass && isIRRPass && isBCRPass) {
      tier = 1;
      tierLabel = "Layak Proyeksi";
      tierColor = "green";
    } else if (isNPVPass && (isIRRPass || isBCRPass)) {
      tier = 2;
      tierLabel = "Cukup Layak (Risiko Waspada)";
      tierColor = "amber";
    }

    setFeasibilityResults({ enpv, ebcr, eirr: eirrPct, tier, tierLabel, tierColor, isNPVPass, isIRRPass, isBCRPass });
  };

  const handleSensitivityScenarioChange = (scenario: "optimis" | "moderat" | "pesimis") => {
    setSensitivityScenario(scenario);
    if (!feasibilityResults) return;

    const multipliers: Record<string, { investment: number; flows: number }> = {
      optimis: { investment: 0.95, flows: 1.15 },
      moderat: { investment: 1.0, flows: 1.0 },
      pesimis: { investment: 1.15, flows: 0.7 },
    };
    const mult = multipliers[scenario];
    const adjustedInvest = feasibilityParams.initialInvestment * mult.investment;
    const adjustedFlows = feasibilityParams.cashFlows
      .split(",")
      .map(Number)
      .map((cf) => cf * mult.flows);
    const rate = Number(feasibilityParams.discountRate) / 100;

    let pv = 0;
    for (let t = 0; t < adjustedFlows.length; t++) pv += adjustedFlows[t] / Math.pow(1 + rate, t + 1);
    const enpv = pv - adjustedInvest;
    const ebcr = pv / adjustedInvest;

    const npvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < adjustedFlows.length; t++) sum += adjustedFlows[t] / Math.pow(1 + r, t + 1);
      return sum - adjustedInvest;
    };
    const dNpvFunc = (r: number) => {
      let sum = 0;
      for (let t = 0; t < adjustedFlows.length; t++) sum += (-(t + 1) * adjustedFlows[t]) / Math.pow(1 + r, t + 2);
      return sum;
    };

    let eirr = 0.1,
      diff = 1,
      iter = 0;
    while (Math.abs(diff) > 1e-6 && iter < 100) {
      const v = npvFunc(eirr),
        d = dNpvFunc(eirr);
      if (d === 0) break;
      diff = eirr - v / d - eirr;
      eirr -= v / d;
      iter++;
    }
    const eirrPct = eirr * 100;

    let tier = 3,
      tierLabel = "Tidak Layak";
    if (enpv > 0 && eirrPct > feasibilityParams.discountRate && ebcr >= 1.0) {
      tier = 1;
      tierLabel = "Layak";
    } else if (enpv > 0 && (eirrPct > feasibilityParams.discountRate || ebcr >= 1.0)) {
      tier = 2;
      tierLabel = "Cukup Layak";
    }

    setSensitivityPresetResults({
      scenario,
      investment: adjustedInvest,
      flows: adjustedFlows,
      enpv,
      ebcr,
      eirr: eirrPct,
      tier,
      tierLabel,
    });
  };

  return {
    feasibilityActiveTab,
    setFeasibilityActiveTab,
    feasibilityParams,
    setFeasibilityParams,
    feasibilityResults,
    setFeasibilityResults,
    sensitivityScenario,
    sensitivityPresetResults,
    calculateFeasibility,
    handleSensitivityScenarioChange,
  };
}
