import {
  Building2,
  GraduationCap,
  Users,
  ShoppingBag,
  FileSpreadsheet,
  Leaf,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Cooperative event template with cost/engagement/prep prediction
 * parameters. Each template computes cost = baseCost +
 * (attendeeCount × costPerAttendee) + (venueCostPerDay × days) +
 * fixedCosts + 15% contingency. Engagement = attendeeCount ×
 * engagementFactor. Prep = prepDays (+5 if attendees > 100).
 */

export interface EventTemplate {
  id: string;
  /** i18n key prefix for template labels */
  i18nKey: string;
  /** Icon to display in the picker grid */
  icon: LucideIcon;
  /** Importance: 1-5 stars */
  importance: 1 | 2 | 3 | 4 | 5;
  /** Base cost in IDR (rupiah) */
  baseCost: number;
  /** Additional cost per attendee */
  costPerAttendee: number;
  /** Venue cost per day */
  venueCostPerDay: number;
  /** Default number of event days */
  defaultDurationDays: number;
  /** Fixed costs (permits, printing, honorarium) */
  fixedCosts: number;
  /** Contingency percentage (e.g., 0.15 = 15%) */
  contingencyPct: number;
  /** Default expected attendee count */
  defaultAttendees: number;
  /** Engagement factor (0-1). 0.85 means 85% expected turnout. */
  engagementFactor: number;
  /** Preparation days needed */
  prepDays: number;
  /** Extra prep days added when attendees exceed this threshold */
  prepScaleThreshold: number;
  /** Extra prep days if threshold exceeded */
  prepScaleExtra: number;
  /** Legal/regulatory note (i18n key or empty) */
  legalNoteKey: string;
  /** Suggested default event name (i18n key) */
  suggestedNameKey: string;
  /** Suggested agenda/description lines (i18n keys) */
  suggestedAgendaKeys: string[];
  /** Suggested default location (i18n key or empty) */
  suggestedLocationKey: string;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "rat",
    i18nKey: "event.template.rat",
    icon: Building2,
    importance: 5,
    baseCost: 8_000_000,
    costPerAttendee: 35_000,
    venueCostPerDay: 1_500_000,
    defaultDurationDays: 1,
    fixedCosts: 2_000_000,
    contingencyPct: 0.15,
    defaultAttendees: 200,
    engagementFactor: 0.85,
    prepDays: 30,
    prepScaleThreshold: 200,
    prepScaleExtra: 5,
    legalNoteKey: "event.template.rat.legal",
    suggestedNameKey: "event.template.rat.name",
    suggestedAgendaKeys: ["event.template.rat.agenda1", "event.template.rat.agenda2", "event.template.rat.agenda3"],
    suggestedLocationKey: "event.template.rat.location",
  },
  {
    id: "training",
    i18nKey: "event.template.training",
    icon: GraduationCap,
    importance: 4,
    baseCost: 2_000_000,
    costPerAttendee: 25_000,
    venueCostPerDay: 500_000,
    defaultDurationDays: 1,
    fixedCosts: 1_000_000,
    contingencyPct: 0.15,
    defaultAttendees: 50,
    engagementFactor: 0.7,
    prepDays: 14,
    prepScaleThreshold: 50,
    prepScaleExtra: 3,
    legalNoteKey: "event.template.training.legal",
    suggestedNameKey: "event.template.training.name",
    suggestedAgendaKeys: ["event.template.training.agenda1", "event.template.training.agenda2"],
    suggestedLocationKey: "",
  },
  {
    id: "gathering",
    i18nKey: "event.template.gathering",
    icon: Users,
    importance: 3,
    baseCost: 500_000,
    costPerAttendee: 15_000,
    venueCostPerDay: 200_000,
    defaultDurationDays: 1,
    fixedCosts: 500_000,
    contingencyPct: 0.15,
    defaultAttendees: 80,
    engagementFactor: 0.6,
    prepDays: 7,
    prepScaleThreshold: 80,
    prepScaleExtra: 3,
    legalNoteKey: "",
    suggestedNameKey: "event.template.gathering.name",
    suggestedAgendaKeys: ["event.template.gathering.agenda1"],
    suggestedLocationKey: "",
  },
  {
    id: "market",
    i18nKey: "event.template.market",
    icon: ShoppingBag,
    importance: 3,
    baseCost: 1_000_000,
    costPerAttendee: 5_000,
    venueCostPerDay: 500_000,
    defaultDurationDays: 1,
    fixedCosts: 1_500_000,
    contingencyPct: 0.15,
    defaultAttendees: 300,
    engagementFactor: 0.4,
    prepDays: 14,
    prepScaleThreshold: 200,
    prepScaleExtra: 5,
    legalNoteKey: "",
    suggestedNameKey: "event.template.market.name",
    suggestedAgendaKeys: ["event.template.market.agenda1", "event.template.market.agenda2"],
    suggestedLocationKey: "event.template.market.location",
  },
  {
    id: "financial",
    i18nKey: "event.template.financial",
    icon: FileSpreadsheet,
    importance: 4,
    baseCost: 500_000,
    costPerAttendee: 20_000,
    venueCostPerDay: 300_000,
    defaultDurationDays: 1,
    fixedCosts: 500_000,
    contingencyPct: 0.15,
    defaultAttendees: 40,
    engagementFactor: 0.5,
    prepDays: 7,
    prepScaleThreshold: 40,
    prepScaleExtra: 3,
    legalNoteKey: "",
    suggestedNameKey: "event.template.financial.name",
    suggestedAgendaKeys: ["event.template.financial.agenda1", "event.template.financial.agenda2"],
    suggestedLocationKey: "",
  },
  {
    id: "environment",
    i18nKey: "event.template.environment",
    icon: Leaf,
    importance: 2,
    baseCost: 200_000,
    costPerAttendee: 10_000,
    venueCostPerDay: 0,
    defaultDurationDays: 1,
    fixedCosts: 500_000,
    contingencyPct: 0.1,
    defaultAttendees: 50,
    engagementFactor: 0.55,
    prepDays: 5,
    prepScaleThreshold: 50,
    prepScaleExtra: 2,
    legalNoteKey: "",
    suggestedNameKey: "event.template.environment.name",
    suggestedAgendaKeys: ["event.template.environment.agenda1"],
    suggestedLocationKey: "",
  },
  {
    id: "custom",
    i18nKey: "event.template.custom",
    icon: Sparkles,
    importance: 1,
    baseCost: 0,
    costPerAttendee: 0,
    venueCostPerDay: 0,
    defaultDurationDays: 1,
    fixedCosts: 0,
    contingencyPct: 0,
    defaultAttendees: 0,
    engagementFactor: 0,
    prepDays: 0,
    prepScaleThreshold: 0,
    prepScaleExtra: 0,
    legalNoteKey: "",
    suggestedNameKey: "",
    suggestedAgendaKeys: [],
    suggestedLocationKey: "",
  },
];

/** Importance label keys indexed by star count */
export const IMPORTANCE_KEYS: Record<number, string> = {
  1: "event.importance.star1",
  2: "event.importance.star2",
  3: "event.importance.star3",
  4: "event.importance.star4",
  5: "event.importance.star5",
};

export interface Prediction {
  /** Total estimated cost in IDR */
  totalCost: number;
  /** Cost breakdown lines */
  costBreakdown: { labelKey: string; value: number }[];
  /** Expected attendees */
  expectedAttendees: number;
  /** Prep days needed */
  prepDays: number;
  /** Array of prep milestone descriptions (i18n keys) */
  prepMilestones: string[];
  /** Start date recommendation (ISO date string or empty) */
  recommendedStartDate: string;
}

/**
 * Compute cost, engagement, and prep predictions for a given template
 * and attendee count.
 */
export function computePredictions(template: EventTemplate, attendeeCount: number, eventDate: string): Prediction {
  // Cost breakdown
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

  // Engagement
  const expectedAttendees = Math.round(attendeeCount * template.engagementFactor);

  // Prep days with scaling
  let prepDays = template.prepDays;
  if (attendeeCount > template.prepScaleThreshold) {
    prepDays += template.prepScaleExtra;
  }

  // Recommended start date
  let recommendedStartDate = "";
  if (eventDate) {
    const d = new Date(eventDate + "T00:00:00");
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() - prepDays);
      recommendedStartDate = d.toISOString().slice(0, 10);
    }
  }

  // Prep milestones (generic per-template, built from prepDays)
  const prepMilestones = buildPrepMilestones(template.id, prepDays);

  return { totalCost, costBreakdown, expectedAttendees, prepDays, prepMilestones, recommendedStartDate };
}

function buildPrepMilestones(templateId: string, prepDays: number): string[] {
  // Milestones scale relative to total prep days
  if (prepDays <= 0) return [];
  const milestones: string[] = [];
  const prefix = `event.template.${templateId}.prep`;

  if (prepDays >= 30) {
    milestones.push(`${prefix}_d30`);
    milestones.push(`${prefix}_d21`);
    milestones.push(`${prefix}_d14`);
    milestones.push(`${prefix}_d7`);
    milestones.push(`${prefix}_d3`);
    milestones.push(`${prefix}_d1`);
  } else if (prepDays >= 14) {
    milestones.push(`${prefix}_d14`);
    milestones.push(`${prefix}_d7`);
    milestones.push(`${prefix}_d3`);
    milestones.push(`${prefix}_d1`);
  } else if (prepDays >= 7) {
    milestones.push(`${prefix}_d7`);
    milestones.push(`${prefix}_d3`);
    milestones.push(`${prefix}_d1`);
  } else if (prepDays >= 5) {
    milestones.push(`${prefix}_d5`);
    milestones.push(`${prefix}_d1`);
  } else {
    milestones.push(`${prefix}_d1`);
  }
  return milestones;
}

/**
 * Format IDR currency for display. Never use locale formatting
 * (Intl.NumberFormat rounds small values to zero). Show raw with
 * thousand separators.
 */
export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Returns a 5-character star rating string (★ + ☆) for display */
export function importanceStars(n: number): string {
  return "★".repeat(n) + "☆".repeat(5 - n);
}
