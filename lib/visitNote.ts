import { BODY_REGION_LABELS } from "./regions";
import type { TriageInput } from "./triage";

export interface VisitNoteFact {
  key:
    | "location"
    | "onset"
    | "pain"
    | "recurrence"
    | "redness_warmth"
    | "drainage"
    | "fever_chills"
    | "systemic_symptoms"
    | "context";
  label: string;
  value: string;
}

const onsetLabels = {
  hours: "Within hours",
  days: "Within days",
  weeks: "Within weeks",
  months_or_longer: "Months or longer ago",
} as const;

const painLabels = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
} as const;

const drainageLabels = {
  none: "None",
  pus: "Pus",
  blood: "Blood",
  clear_or_other: "Clear or other fluid",
} as const;

/**
 * Builds an allow-listed set of facts. Free text, normalized text, condition
 * matches, and unknown values are intentionally excluded so a Visit Note
 * cannot acquire a diagnosis or an unprovided symptom.
 */
export function getVisitNoteFacts(input: TriageInput): VisitNoteFact[] {
  const facts: VisitNoteFact[] = [];

  if (input.bodyRegion && input.bodyRegion !== "unknown") {
    facts.push({
      key: "location",
      label: "Location",
      value: BODY_REGION_LABELS[input.bodyRegion],
    });
  }

  if (typeof input.durationDays === "number" && input.durationDays >= 0) {
    facts.push({
      key: "onset",
      label: "Onset / duration",
      value: `${input.durationDays} ${input.durationDays === 1 ? "day" : "days"}`,
    });
  } else if (input.onset && input.onset !== "unknown") {
    facts.push({
      key: "onset",
      label: "Onset",
      value: onsetLabels[input.onset],
    });
  }

  if (input.pain && input.pain !== "unknown") {
    facts.push({
      key: "pain",
      label: "Pain",
      value: painLabels[input.pain],
    });
  }

  if (typeof input.recurrent === "boolean") {
    facts.push({
      key: "recurrence",
      label: "Occurred before in the same area",
      value: input.recurrent ? "Yes" : "No",
    });
  }

  if (typeof input.rednessOrWarmth === "boolean") {
    facts.push({
      key: "redness_warmth",
      label: "Redness or warmth",
      value: input.rednessOrWarmth ? "Yes" : "No",
    });
  }

  if (input.drainage && input.drainage !== "unknown") {
    facts.push({
      key: "drainage",
      label: "Drainage",
      value: drainageLabels[input.drainage],
    });
  }

  if (typeof input.feverOrChills === "boolean") {
    facts.push({
      key: "fever_chills",
      label: "Fever or chills",
      value: input.feverOrChills ? "Yes" : "No",
    });
  }

  if (typeof input.faintConfusedOrVeryUnwell === "boolean") {
    facts.push({
      key: "systemic_symptoms",
      label: "Faint, confused, or very unwell",
      value: input.faintConfusedOrVeryUnwell ? "Yes" : "No",
    });
  }

  const context: string[] = [];
  if (input.recentHairRemoval === true) context.push("Recent shaving or waxing");
  if (input.frictionOrProlongedSitting === true)
    context.push("Friction, tight clothing, or prolonged sitting");
  if (input.diabetesOrImmunocompromised === true)
    context.push("Diabetes or a weakened immune system");

  if (context.length > 0) {
    facts.push({
      key: "context",
      label: "Relevant context",
      value: context.join("; "),
    });
  }

  return facts;
}

export function buildVisitNote(input: TriageInput): string {
  const facts = getVisitNoteFacts(input);
  const lines = ["Visit Note — facts provided"];

  if (facts.length === 0) {
    lines.push("No visit-note details were provided.");
    return lines.join("\n");
  }

  lines.push(...facts.map((fact) => `${fact.label}: ${fact.value}`));
  return lines.join("\n");
}

export const generateVisitNote = buildVisitNote;
export const createVisitNote = buildVisitNote;

