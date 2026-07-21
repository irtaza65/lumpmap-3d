import {
  BODY_REGION_LABELS,
  type BodyRegion,
} from "./regions";

export type DescriptionLanguage =
  | "english"
  | "urdu"
  | "roman_urdu"
  | "mixed";
export type LumpLayer =
  | "surface"
  | "subcutaneous"
  | "deep_or_internal"
  | "unknown";
export type LumpOnset =
  | "hours"
  | "days"
  | "weeks"
  | "months_or_longer"
  | "unknown";
export type LumpTrend =
  | "improving"
  | "stable"
  | "slowly_worsening"
  | "rapidly_worsening"
  | "unknown";
export type PainLevel =
  | "none"
  | "mild"
  | "moderate"
  | "severe"
  | "unknown";
export type DrainageType =
  | "none"
  | "pus"
  | "blood"
  | "clear_or_other"
  | "unknown";

/**
 * Shared deterministic description shape. It mirrors the strict extraction
 * schema, while optional SafetySignals below represent answers gathered only
 * in a relevant guided-flow branch.
 */
export interface LumpDescription {
  language: DescriptionLanguage;
  originalText: string;
  normalizedPlainLanguage: string;
  bodyRegion: BodyRegion;
  layer: LumpLayer;
  onset: LumpOnset;
  trend: LumpTrend;
  pain: PainLevel;
  rednessOrWarmth: boolean | null;
  drainage: DrainageType;
  feverOrChills: boolean | null;
  faintConfusedOrVeryUnwell: boolean | null;
  recurrent: boolean | null;
  multipleLesions: boolean | null;
  tunnelsPitsOrScars: boolean | null;
  recentHairRemoval: boolean | null;
  frictionOrProlongedSitting: boolean | null;
  diabetesOrImmunocompromised: boolean | null;
  troubleBreathing?: boolean | null;
  spreadingRednessOrSwelling?: boolean | null;
  severeSystemicSymptoms?: boolean | null;
  blackGreyBlisteringOrNumbSkin?: boolean | null;
  painOutOfProportion?: boolean | null;
  suddenOnset?: boolean | null;
  swelling?: boolean | null;
  nearEyeOrCentralFace?: boolean | null;
  hardOrFixed?: boolean | null;
  steadilyGrowing?: boolean | null;
  unexplained?: boolean | null;
  persistent?: boolean | null;
  durationDays?: number | null;
  age?: number | null;
  unknowns: string[];
  suggestedFollowUpQuestions: string[];
}

export type SafetySignals = Partial<
  Pick<
    LumpDescription,
    | "troubleBreathing"
    | "spreadingRednessOrSwelling"
    | "severeSystemicSymptoms"
    | "blackGreyBlisteringOrNumbSkin"
    | "painOutOfProportion"
    | "suddenOnset"
    | "swelling"
    | "nearEyeOrCentralFace"
    | "hardOrFixed"
    | "steadilyGrowing"
    | "unexplained"
    | "persistent"
    | "durationDays"
    | "age"
  >
>;

export type TriageInput = Partial<LumpDescription>;

export type TriageCategory =
  | "emergency_now"
  | "same_day_urgent"
  | "prompt_appointment"
  | "lower_risk_monitoring";

export interface TriageTrigger {
  ruleId: string;
  category: Exclude<TriageCategory, "lower_risk_monitoring">;
  explanation: string;
  /** Human-readable copies of only the answers that fired this rule. */
  facts: string[];
  answerKeys: string[];
}

export interface TriageResult {
  category: TriageCategory;
  level: TriageCategory;
  title: string;
  guidance: string;
  action: string;
  disclaimer: string;
  triggers: TriageTrigger[];
  triggeredBy: string[];
  hasUnknownSafetyInformation: boolean;
  emergencyContextLine?: string;
}

export const PAKISTAN_EMERGENCY_LINE =
  "If symptoms are severe or rapidly worsening, go to the nearest emergency department or contact local emergency services.";

export const TRIAGE_COPY: Record<
  TriageCategory,
  Pick<TriageResult, "title" | "guidance" | "action">
> = {
  emergency_now: {
    title: "Seek urgent medical care now",
    guidance:
      "The answers include a pattern that can require emergency assessment. Do not wait for an online match or try to treat the lump yourself.",
    action:
      "Go to the nearest emergency department or contact local emergency services now.",
  },
  same_day_urgent: {
    title: "Contact a clinician today",
    guidance:
      "The location or symptom pattern needs same-day assessment because an infection or other urgent problem may need hands-on care.",
    action:
      "Arrange same-day urgent clinical care. If symptoms become severe or rapidly worsen, use emergency care.",
  },
  prompt_appointment: {
    title: "Arrange a prompt clinician appointment",
    guidance:
      "The answers include a persistent, recurring, changing, or location-sensitive pattern that should be examined rather than identified by this tool.",
    action:
      "Book a clinician appointment promptly, sooner if pain, heat, redness, drainage, fever, or rapid change develops.",
  },
  lower_risk_monitoring: {
    title: "No urgent pattern identified from the answers provided",
    guidance:
      "This supports cautious education and monitoring only. Missing or changing information can alter the care level, and this result cannot rule out a serious cause.",
    action:
      "Monitor for change and review the educational matches. Do not squeeze, pierce, cut, or try to drain the lump yourself.",
  },
};

const categoryRank: Record<TriageCategory, number> = {
  lower_risk_monitoring: 0,
  prompt_appointment: 1,
  same_day_urgent: 2,
  emergency_now: 3,
};

const painRank: Record<PainLevel, number> = {
  unknown: -1,
  none: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
};

function hasPain(input: TriageInput): boolean {
  return input.pain !== undefined && painRank[input.pain] > 0;
}

function isModerateOrSeverePain(input: TriageInput): boolean {
  return input.pain !== undefined && painRank[input.pain] >= 2;
}

function hasDrainage(input: TriageInput): boolean {
  return (
    input.drainage !== undefined &&
    input.drainage !== "unknown" &&
    input.drainage !== "none"
  );
}

function hasInfectionSignal(input: TriageInput): boolean {
  return (
    input.rednessOrWarmth === true ||
    input.feverOrChills === true ||
    input.drainage === "pus" ||
    input.spreadingRednessOrSwelling === true ||
    (input.trend === "rapidly_worsening" && hasPain(input))
  );
}

function bodyRegionFact(input: TriageInput): string | undefined {
  return input.bodyRegion && input.bodyRegion !== "unknown"
    ? `Location: ${BODY_REGION_LABELS[input.bodyRegion]}`
    : undefined;
}

function painFact(input: TriageInput): string | undefined {
  return input.pain && input.pain !== "unknown"
    ? `Pain: ${input.pain}`
    : undefined;
}

function drainageFact(input: TriageInput): string | undefined {
  return input.drainage && input.drainage !== "unknown"
    ? `Drainage: ${input.drainage.replaceAll("_", " ")}`
    : undefined;
}

function compactFacts(...facts: Array<string | undefined>): string[] {
  return facts.filter((fact): fact is string => Boolean(fact));
}

function addTrigger(
  triggers: TriageTrigger[],
  category: TriageTrigger["category"],
  ruleId: string,
  explanation: string,
  facts: string[],
  answerKeys: string[],
): void {
  triggers.push({
    ruleId,
    category,
    explanation,
    facts: [...new Set(facts)],
    answerKeys,
  });
}

function isTesticularEmergencyLocation(input: TriageInput): boolean {
  return (
    input.bodyRegion === "inside_testicle" ||
    (input.bodyRegion === "scrotal_skin" &&
      (input.layer === "deep_or_internal" || input.layer === "unknown"))
  );
}

/**
 * Deterministic triage. It deliberately never consumes a condition match or a
 * model-proposed diagnosis, so neither can lower the safety result.
 */
export function evaluateTriage(input: TriageInput): TriageResult {
  const allTriggers: TriageTrigger[] = [];
  const regionFact = bodyRegionFact(input);

  const suddenTesticularPain =
    isTesticularEmergencyLocation(input) &&
    input.pain === "severe" &&
    (input.suddenOnset === true || input.onset === "hours");
  const rapidTesticularSwelling =
    (input.bodyRegion === "inside_testicle" ||
      input.bodyRegion === "scrotal_skin") &&
    input.swelling === true &&
    input.trend === "rapidly_worsening";

  if (suddenTesticularPain || rapidTesticularSwelling) {
    addTrigger(
      allTriggers,
      "emergency_now",
      "acute_testicular_pain_or_swelling",
      "Sudden severe testicular pain or rapidly developing testicular/scrotal swelling needs emergency assessment.",
      compactFacts(
        regionFact,
        painFact(input),
        input.onset === "hours" ? "Onset: within hours" : undefined,
        input.suddenOnset === true ? "Onset: sudden" : undefined,
        input.swelling === true ? "Swelling: yes" : undefined,
        input.trend === "rapidly_worsening"
          ? "Trend: rapidly worsening"
          : undefined,
      ),
      ["bodyRegion", "pain", "onset", "suddenOnset", "swelling", "trend"],
    );
  }

  if (
    input.faintConfusedOrVeryUnwell === true ||
    input.troubleBreathing === true
  ) {
    addTrigger(
      allTriggers,
      "emergency_now",
      "severe_general_illness",
      "Fainting, confusion, trouble breathing, or appearing severely unwell needs emergency assessment.",
      compactFacts(
        input.faintConfusedOrVeryUnwell === true
          ? "Faint, confused, or very unwell: yes"
          : undefined,
        input.troubleBreathing === true ? "Trouble breathing: yes" : undefined,
      ),
      ["faintConfusedOrVeryUnwell", "troubleBreathing"],
    );
  }

  if (
    input.spreadingRednessOrSwelling === true &&
    input.severeSystemicSymptoms === true
  ) {
    addTrigger(
      allTriggers,
      "emergency_now",
      "rapid_spread_with_severe_systemic_symptoms",
      "Rapidly spreading redness or swelling with severe whole-body symptoms needs emergency assessment.",
      [
        "Spreading redness or swelling: yes",
        "Severe whole-body symptoms: yes",
      ],
      ["spreadingRednessOrSwelling", "severeSystemicSymptoms"],
    );
  }

  if (
    input.blackGreyBlisteringOrNumbSkin === true &&
    (input.trend === "rapidly_worsening" || isModerateOrSeverePain(input))
  ) {
    addTrigger(
      allTriggers,
      "emergency_now",
      "concerning_skin_change",
      "Black, grey, blistering, or numb skin around a rapidly worsening painful area needs emergency assessment.",
      compactFacts(
        "Black, grey, blistering, or numb skin: yes",
        painFact(input),
        input.trend === "rapidly_worsening"
          ? "Trend: rapidly worsening"
          : undefined,
      ),
      ["blackGreyBlisteringOrNumbSkin", "pain", "trend"],
    );
  }

  if (input.painOutOfProportion === true) {
    addTrigger(
      allTriggers,
      "emergency_now",
      "pain_out_of_proportion",
      "Severe pain that is markedly out of proportion to what is visible needs emergency assessment.",
      compactFacts(
        "Pain much worse than the visible change: yes",
        painFact(input),
      ),
      ["painOutOfProportion", "pain"],
    );
  }

  if (
    input.bodyRegion === "perianal" &&
    (hasPain(input) || input.swelling === true)
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "painful_perianal_lump",
      "A painful lump or swelling directly beside the anus needs same-day assessment.",
      compactFacts(
        regionFact,
        painFact(input),
        input.swelling === true ? "Swelling: yes" : undefined,
        input.feverOrChills === true ? "Fever or chills: yes" : undefined,
        drainageFact(input),
        input.trend === "rapidly_worsening"
          ? "Trend: rapidly worsening"
          : undefined,
      ),
      ["bodyRegion", "pain", "swelling", "feverOrChills", "drainage", "trend"],
    );
  }

  if (
    input.feverOrChills === true &&
    (hasPain(input) || input.rednessOrWarmth === true || hasDrainage(input))
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "fever_with_inflamed_lump",
      "Fever or chills with a painful, hot, red, or draining lump needs same-day assessment.",
      compactFacts(
        "Fever or chills: yes",
        painFact(input),
        input.rednessOrWarmth === true ? "Redness or warmth: yes" : undefined,
        drainageFact(input),
      ),
      ["feverOrChills", "pain", "rednessOrWarmth", "drainage"],
    );
  }

  if (input.pain === "severe") {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "severe_painful_lump",
      "Severe pain from a lump or swelling needs same-day clinical assessment, even when other details are uncertain.",
      compactFacts(regionFact, painFact(input)),
      ["bodyRegion", "pain"],
    );
  }

  if (
    input.trend === "rapidly_worsening" &&
    hasPain(input) &&
    input.swelling !== false
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "rapidly_worsening_painful_swelling",
      "Rapidly worsening painful swelling needs same-day assessment.",
      compactFacts(
        painFact(input),
        "Trend: rapidly worsening",
        input.swelling === true ? "Swelling: yes" : undefined,
      ),
      ["trend", "pain", "swelling"],
    );
  }

  if (
    input.diabetesOrImmunocompromised === true &&
    hasInfectionSignal(input)
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "infection_with_higher_health_risk",
      "Signs of infection with diabetes or a weakened immune system need same-day assessment.",
      compactFacts(
        "Diabetes or weakened immune system: yes",
        input.rednessOrWarmth === true ? "Redness or warmth: yes" : undefined,
        input.feverOrChills === true ? "Fever or chills: yes" : undefined,
        drainageFact(input),
        input.spreadingRednessOrSwelling === true
          ? "Spreading redness or swelling: yes"
          : undefined,
      ),
      [
        "diabetesOrImmunocompromised",
        "rednessOrWarmth",
        "feverOrChills",
        "drainage",
        "spreadingRednessOrSwelling",
      ],
    );
  }

  if (
    input.bodyRegion === "scalp_face" &&
    (input.nearEyeOrCentralFace === true || input.pain === "severe") &&
    (hasPain(input) || input.swelling === true)
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "painful_eye_or_central_face_swelling",
      "A painful swelling near the eye or central face needs same-day assessment.",
      compactFacts(
        regionFact,
        input.nearEyeOrCentralFace === true
          ? "Near the eye or central face: yes"
          : undefined,
        painFact(input),
        input.swelling === true ? "Swelling: yes" : undefined,
      ),
      ["nearEyeOrCentralFace", "pain", "swelling"],
    );
  }

  if (
    input.bodyRegion === "vulvar_opening" &&
    (hasPain(input) || input.swelling === true)
  ) {
    addTrigger(
      allTriggers,
      "same_day_urgent",
      "painful_genital_opening_swelling",
      "A painful swelling near a genital opening, including a possible Bartholin abscess, needs same-day assessment.",
      compactFacts(
        regionFact,
        painFact(input),
        input.swelling === true ? "Swelling: yes" : undefined,
      ),
      ["bodyRegion", "pain", "swelling"],
    );
  }

  if (
    input.hardOrFixed === true ||
    input.steadilyGrowing === true ||
    input.unexplained === true ||
    input.persistent === true
  ) {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "persistent_or_concerning_lump",
      "A new hard, fixed, steadily growing, unexplained, or persistent lump needs a clinician appointment.",
      compactFacts(
        input.hardOrFixed === true ? "Hard or fixed: yes" : undefined,
        input.steadilyGrowing === true ? "Steadily growing: yes" : undefined,
        input.unexplained === true ? "Unexplained: yes" : undefined,
        input.persistent === true ? "Persistent: yes" : undefined,
      ),
      ["hardOrFixed", "steadilyGrowing", "unexplained", "persistent"],
    );
  }

  if (input.bodyRegion === "inside_testicle") {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "new_lump_inside_testicle",
      "Any new lump felt inside a testicle needs prompt clinical assessment, even without pain.",
      compactFacts(regionFact, painFact(input)),
      ["bodyRegion", "pain"],
    );
  }

  if (
    input.layer === "deep_or_internal" &&
    input.bodyRegion !== "inside_testicle"
  ) {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "deep_or_internal_lump",
      "A lump that feels deep or inside an organ is outside this superficial atlas and needs clinical assessment.",
      compactFacts(
        regionFact,
        "Depth: feels deep or internal",
      ),
      ["bodyRegion", "layer"],
    );
  }

  if (input.recurrent === true || input.tunnelsPitsOrScars === true) {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "recurrent_or_tunnelling_pattern",
      "Recurrent boils or drainage, or a pattern with pits, tunnels, or scarring, needs a clinician appointment.",
      compactFacts(
        input.recurrent === true ? "Recurrence: yes" : undefined,
        input.tunnelsPitsOrScars === true
          ? "Pits, tunnels, or scars: yes"
          : undefined,
      ),
      ["recurrent", "tunnelsPitsOrScars"],
    );
  }

  if (
    input.bodyRegion === "vulvar_opening" &&
    typeof input.age === "number" &&
    input.age >= 40
  ) {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "bartholin_area_age_40_plus",
      "A new Bartholin-area lump at age 40 or older needs a prompt clinician appointment.",
      compactFacts(regionFact, `Age provided: ${input.age}`),
      ["bodyRegion", "age"],
    );
  }

  const durationAroundTwoWeeks =
    (typeof input.durationDays === "number" && input.durationDays >= 14) ||
    input.onset === "weeks" ||
    input.onset === "months_or_longer";
  const notImproving =
    input.trend === "stable" ||
    input.trend === "slowly_worsening" ||
    input.trend === "rapidly_worsening";

  if (durationAroundTwoWeeks && notImproving) {
    addTrigger(
      allTriggers,
      "prompt_appointment",
      "two_weeks_without_improvement",
      "Symptoms lasting around two weeks without improvement need a clinician appointment, sooner if worsening.",
      compactFacts(
        typeof input.durationDays === "number"
          ? `Duration: ${input.durationDays} days`
          : input.onset && input.onset !== "unknown"
            ? `Onset: ${input.onset.replaceAll("_", " ")}`
            : undefined,
        input.trend && input.trend !== "unknown"
          ? `Trend: ${input.trend.replaceAll("_", " ")}`
          : undefined,
      ),
      ["durationDays", "onset", "trend"],
    );
  }

  const category = allTriggers.reduce<TriageCategory>(
    (highest, trigger) =>
      categoryRank[trigger.category] > categoryRank[highest]
        ? trigger.category
        : highest,
    "lower_risk_monitoring",
  );

  const selectedTriggers = allTriggers.filter(
    (trigger) => trigger.category === category,
  );
  const copy = TRIAGE_COPY[category];
  const hasUnknownSafetyInformation =
    input.bodyRegion === undefined ||
    input.bodyRegion === "unknown" ||
    input.pain === undefined ||
    input.pain === "unknown" ||
    input.trend === undefined ||
    input.trend === "unknown" ||
    input.feverOrChills === undefined ||
    input.feverOrChills === null ||
    input.faintConfusedOrVeryUnwell === undefined ||
    input.faintConfusedOrVeryUnwell === null;

  return {
    category,
    level: category,
    ...copy,
    disclaimer:
      "This is not a diagnosis. It cannot confirm a condition or rule out a serious cause.",
    triggers: selectedTriggers,
    triggeredBy: [
      ...new Set(selectedTriggers.flatMap((trigger) => trigger.facts)),
    ],
    hasUnknownSafetyInformation,
    emergencyContextLine:
      category === "emergency_now" || category === "same_day_urgent"
        ? PAKISTAN_EMERGENCY_LINE
        : undefined,
  };
}

export const triageLump = evaluateTriage;
export const getTriage = evaluateTriage;

export function compareTriageCategories(
  left: TriageCategory,
  right: TriageCategory,
): number {
  return categoryRank[left] - categoryRank[right];
}

/**
 * The model is not a triage authority. This adapter exists for API consumers
 * that receive a model-shaped payload and makes the boundary explicit: the
 * deterministic decision is returned unchanged, so it cannot be downgraded.
 */
export function enforceDeterministicTriage(
  deterministicResult: TriageResult,
  _modelSuggestedCategory?: TriageCategory | null,
): TriageResult {
  void _modelSuggestedCategory;
  return deterministicResult;
}
