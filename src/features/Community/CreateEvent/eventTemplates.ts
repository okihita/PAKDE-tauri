import { type LucideIcon } from "lucide-react";
import { EVENT_TEMPLATES } from "@/data/eventTemplates";

export { EVENT_TEMPLATES };

/** Cooperative event template. Predictions computed from cost/engagement/prep formulas. */
export interface EventTemplate {
  id: string;
  i18nKey: string;
  icon: LucideIcon;
  category: "core" | "fun";
  importance: 1 | 2 | 3 | 4 | 5;
  baseCost: number;
  costPerAttendee: number;
  venueCostPerDay: number;
  defaultDurationDays: number;
  fixedCosts: number;
  contingencyPct: number;
  defaultAttendees: number;
  engagementFactor: number;
  prepDays: number;
  prepScaleThreshold: number;
  prepScaleExtra: number;
  legalNoteKey: string;
  suggestedNameKey: string;
  suggestedAgendaKeys: string[];
  suggestedLocationKey: string;
  rationaleKeys: string[];
  checklistKeys: string[];
  roiKeys: string[];
}

/** Shorthand for building string arrays in template data files. */
export function r(...keys: string[]) {
  return keys;
}

export interface Prediction {
  totalCost: number;
  costBreakdown: { labelKey: string; value: number }[];
  expectedAttendees: number;
  totalAttendees: number;
  engagementPct: number;
  prepDays: number;
  prepMilestones: string[];
  recommendedStartDate: string;
}

export function computePredictions(template: EventTemplate, attendeeCount: number, eventDate: string): Prediction {
  const attendeeCost = attendeeCount * template.costPerAttendee;
  const venueCost = template.venueCostPerDay * template.defaultDurationDays;
  const subtotal = template.baseCost + attendeeCost + venueCost + template.fixedCosts;
  const contingency = Math.round(subtotal * template.contingencyPct);
  const totalCost = subtotal + contingency;

  const costBreakdown = [
    { labelKey: "event.prediction.costBase", value: template.baseCost },
    { labelKey: "event.prediction.costAttendee", value: attendeeCost },
    { labelKey: "event.prediction.costVenue", value: venueCost },
    { labelKey: "event.prediction.costFixed", value: template.fixedCosts },
    { labelKey: "event.prediction.costContingency", value: contingency },
  ].filter((b) => b.value > 0 || b.labelKey === "event.prediction.costBase");

  const expectedAttendees = Math.round(attendeeCount * template.engagementFactor);

  let prepDays = template.prepDays;
  if (attendeeCount > template.prepScaleThreshold) prepDays += template.prepScaleExtra;

  let recommendedStartDate = "";
  if (eventDate) {
    const d = new Date(eventDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() - prepDays);
      recommendedStartDate = d.toISOString().slice(0, 10);
    }
  }

  const prepMilestones = buildPrepMilestones(template.id, prepDays);

  return {
    totalCost,
    costBreakdown,
    expectedAttendees,
    totalAttendees: attendeeCount,
    engagementPct: Math.round(template.engagementFactor * 100),
    prepDays,
    prepMilestones,
    recommendedStartDate,
  };
}

function buildPrepMilestones(templateId: string, prepDays: number): string[] {
  if (prepDays <= 0) return [];
  const milestones: string[] = [];
  const prefix = `event.template.${templateId}.prep`;

  if (prepDays >= 30) {
    milestones.push(`${prefix}_d30`, `${prefix}_d21`, `${prefix}_d14`, `${prefix}_d7`, `${prefix}_d3`, `${prefix}_d1`);
  } else if (prepDays >= 21) {
    milestones.push(`${prefix}_d21`, `${prefix}_d14`, `${prefix}_d7`, `${prefix}_d3`, `${prefix}_d1`);
  } else if (prepDays >= 14) {
    milestones.push(`${prefix}_d14`, `${prefix}_d7`, `${prefix}_d3`, `${prefix}_d1`);
  } else if (prepDays >= 10) {
    milestones.push(`${prefix}_d10`, `${prefix}_d7`, `${prefix}_d3`, `${prefix}_d1`);
  } else if (prepDays >= 7) {
    milestones.push(`${prefix}_d7`, `${prefix}_d3`, `${prefix}_d1`);
  } else if (prepDays >= 5) {
    milestones.push(`${prefix}_d5`, `${prefix}_d1`);
  } else {
    milestones.push(`${prefix}_d1`);
  }
  return milestones;
}

export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function importanceStars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}
