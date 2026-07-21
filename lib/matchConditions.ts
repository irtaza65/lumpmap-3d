import {
  CONDITION_BY_ID,
  type ConditionId,
  type ConditionRecord,
} from "./conditions";
import {
  BODY_REGION_LABELS,
  getConditionIdsForBodyRegion,
} from "./regions";
import type { TriageInput } from "./triage";

export interface ConditionMatch {
  conditionId: ConditionId;
  condition: ConditionRecord;
  whyRelevant: string;
  /** Structured, non-diagnostic reasons suitable for chips or tests. */
  matchedSignals: string[];
}

export interface MatchOptions {
  limit?: number;
}

export interface MatchContext {
  eyebrow: "Patterns worth learning about";
  notice: string;
  outsideAtlas: boolean;
}

interface Candidate {
  id: ConditionId;
  score: number;
  signals: string[];
}

const conditionOrder = new Map<ConditionId, number>(
  Object.keys(CONDITION_BY_ID).map((id, index) => [id as ConditionId, index]),
);

function isPainful(input: TriageInput): boolean {
  return (
    input.pain === "mild" ||
    input.pain === "moderate" ||
    input.pain === "severe"
  );
}

function hasInflammation(input: TriageInput): boolean {
  return (
    input.rednessOrWarmth === true ||
    input.drainage === "pus" ||
    input.feverOrChills === true ||
    (input.trend === "rapidly_worsening" && isPainful(input))
  );
}

function isLongStanding(input: TriageInput): boolean {
  return input.onset === "months_or_longer" || input.persistent === true;
}

function isCalmSubcutaneousPattern(input: TriageInput): boolean {
  return (
    input.layer === "subcutaneous" &&
    (input.pain === "none" || input.pain === undefined || input.pain === "unknown") &&
    input.rednessOrWarmth !== true &&
    !hasInflammation(input)
  );
}

function addScore(
  candidates: Map<ConditionId, Candidate>,
  id: ConditionId,
  score: number,
  signal: string,
): void {
  const candidate = candidates.get(id) ?? { id, score: 0, signals: [] };
  candidate.score += score;
  if (!candidate.signals.includes(signal)) candidate.signals.push(signal);
  candidates.set(id, candidate);
}

function describeLocation(input: TriageInput): string | undefined {
  return input.bodyRegion && input.bodyRegion !== "unknown"
    ? BODY_REGION_LABELS[input.bodyRegion].toLocaleLowerCase()
    : undefined;
}

function sentenceJoin(parts: string[]): string {
  if (parts.length === 0) return "the structured answers supplied";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function whyRelevant(candidate: Candidate, input: TriageInput): string {
  const reasons: string[] = [];
  const location = describeLocation(input);
  const hasSpecificLocation = candidate.signals.some((signal) =>
    [
      "natal-cleft-location",
      "perianal-location",
      "vulvar-opening-location",
      "wrist-joint-location",
    ].includes(signal),
  );
  if (
    location &&
    candidate.signals.includes("location") &&
    !hasSpecificLocation
  ) {
    reasons.push(`the selected location is ${location}`);
  }

  const signalCopy: Partial<Record<string, string>> = {
    "recurrent-fold-pattern": "you reported repeated fold-area lumps",
    "tunnels-or-scars": "you reported pits, tunnels, or scars",
    "multiple-lesions": "you reported several lesions",
    "after-hair-removal": "the bump followed hair removal",
    "surface-follicle-pattern": "you described a surface-level pattern",
    "painful-inflammation": "you reported pain with inflammation",
    drainage: "you reported drainage",
    "rapid-change": "you reported rapid worsening",
    "natal-cleft-location": "you selected the top of the buttock cleft",
    "perianal-location": "you selected a location directly beside the anus",
    "vulvar-opening-location": "you selected the vulvar opening area",
    "wrist-joint-location": "you selected the wrist or hand",
    "calm-subcutaneous-pattern":
      "you described a non-inflamed lump just beneath the skin",
    "long-standing-pattern": "you reported a longer-lasting lump",
    "acne-prone-location": "you selected an acne-prone area",
    "lymph-node-location": "you selected the neck, armpit, or groin",
  };

  for (const signal of candidate.signals) {
    const copy = signalCopy[signal];
    if (copy && !reasons.includes(copy)) reasons.push(copy);
    if (reasons.length >= 3) break;
  }

  return `Included for education because ${sentenceJoin(reasons)}. This pattern match is not a diagnosis.`;
}

export function getMatchContext(input: TriageInput): MatchContext {
  if (input.bodyRegion === "inside_testicle") {
    return {
      eyebrow: "Patterns worth learning about",
      outsideAtlas: true,
      notice:
        "A lump felt inside a testicle is not matched to superficial skin conditions. Arrange prompt clinical assessment; sudden severe pain or rapid swelling needs emergency care.",
    };
  }

  if (input.layer === "deep_or_internal") {
    return {
      eyebrow: "Patterns worth learning about",
      outsideAtlas: true,
      notice:
        "This focused atlas covers visible or palpable superficial lumps. A lump that feels deep or inside an organ needs clinical assessment and may require a different evaluation, such as imaging.",
    };
  }

  return {
    eyebrow: "Patterns worth learning about",
    outsideAtlas: false,
    notice:
      "These are curated educational comparisons based on the location and pattern you supplied. They cannot identify the lump or rule out other causes.",
  };
}

/**
 * Deterministic educational ranking. Scores are intentionally private and are
 * never probabilities. The public result includes only cautious relevance
 * wording backed by structured answers and curated records.
 */
export function matchConditions(
  input: TriageInput,
  options: MatchOptions | number = {},
): ConditionMatch[] {
  const context = getMatchContext(input);
  if (context.outsideAtlas) return [];

  const limit =
    typeof options === "number" ? options : (options.limit ?? 3);
  const safeLimit = Math.max(0, Math.min(3, Math.floor(limit)));
  if (safeLimit === 0) return [];

  const candidates = new Map<ConditionId, Candidate>();
  if (input.bodyRegion && input.bodyRegion !== "unknown") {
    for (const id of getConditionIdsForBodyRegion(input.bodyRegion)) {
      addScore(candidates, id, 24, "location");
    }
  }

  if (input.bodyRegion === "natal_cleft") {
    addScore(candidates, "pilonidal-disease", 110, "natal-cleft-location");
    if (input.tunnelsPitsOrScars === true || input.drainage === "pus") {
      addScore(candidates, "pilonidal-disease", 30, "tunnels-or-scars");
    }
  }

  if (input.bodyRegion === "perianal") {
    addScore(
      candidates,
      "perianal-abscess-fistula",
      125,
      "perianal-location",
    );
    addScore(candidates, "skin-abscess", 18, "perianal-location");
    addScore(candidates, "hemorrhoid", 12, "perianal-location");
    if (
      isPainful(input) ||
      input.feverOrChills === true ||
      input.drainage === "pus"
    ) {
      addScore(
        candidates,
        "perianal-abscess-fistula",
        45,
        "painful-inflammation",
      );
    }
  }

  if (input.bodyRegion === "vulvar_opening") {
    addScore(
      candidates,
      "bartholin-cyst-abscess",
      85,
      "vulvar-opening-location",
    );
    if (isPainful(input) || input.rednessOrWarmth === true) {
      addScore(
        candidates,
        "bartholin-cyst-abscess",
        25,
        "painful-inflammation",
      );
    }
  }

  if (input.bodyRegion === "wrist_hand") {
    addScore(candidates, "ganglion-cyst", 100, "wrist-joint-location");
    if (isCalmSubcutaneousPattern(input)) {
      addScore(
        candidates,
        "ganglion-cyst",
        25,
        "calm-subcutaneous-pattern",
      );
    }
  }

  const isFold =
    input.bodyRegion === "armpit" || input.bodyRegion === "groin_fold";
  if (isFold && input.recurrent === true) {
    addScore(
      candidates,
      "hidradenitis-suppurativa",
      115,
      "recurrent-fold-pattern",
    );
  }
  if (isFold && input.tunnelsPitsOrScars === true) {
    addScore(
      candidates,
      "hidradenitis-suppurativa",
      115,
      "tunnels-or-scars",
    );
  }
  if (isFold && input.multipleLesions === true) {
    addScore(
      candidates,
      "hidradenitis-suppurativa",
      45,
      "multiple-lesions",
    );
  }

  if (input.recentHairRemoval === true) {
    addScore(candidates, "ingrown-hair", 125, "after-hair-removal");
    addScore(candidates, "folliculitis", 75, "after-hair-removal");
  }

  if (input.layer === "surface") {
    addScore(candidates, "folliculitis", 28, "surface-follicle-pattern");
    addScore(candidates, "ingrown-hair", 18, "surface-follicle-pattern");
  }
  if (input.multipleLesions === true) {
    addScore(candidates, "folliculitis", 28, "multiple-lesions");
  }

  if (isPainful(input) && hasInflammation(input)) {
    addScore(candidates, "skin-abscess", 65, "painful-inflammation");
    addScore(candidates, "boil-carbuncle", 58, "painful-inflammation");
  } else if (isPainful(input)) {
    addScore(candidates, "boil-carbuncle", 24, "painful-inflammation");
  }

  if (input.drainage && input.drainage !== "none" && input.drainage !== "unknown") {
    addScore(candidates, "skin-abscess", 34, "drainage");
    addScore(candidates, "boil-carbuncle", 24, "drainage");
  }
  if (input.trend === "rapidly_worsening") {
    addScore(candidates, "skin-abscess", 28, "rapid-change");
  }

  if (isCalmSubcutaneousPattern(input)) {
    addScore(candidates, "epidermoid-cyst", 44, "calm-subcutaneous-pattern");
    addScore(candidates, "lipoma", 42, "calm-subcutaneous-pattern");
  }
  if (isLongStanding(input)) {
    addScore(candidates, "lipoma", 20, "long-standing-pattern");
    addScore(candidates, "epidermoid-cyst", 18, "long-standing-pattern");
  }

  if (
    input.bodyRegion === "scalp_face" ||
    input.bodyRegion === "chest_back"
  ) {
    addScore(candidates, "acne-nodule-cyst", 30, "acne-prone-location");
    if (input.multipleLesions === true) {
      addScore(candidates, "acne-nodule-cyst", 34, "multiple-lesions");
    }
  }

  if (
    input.bodyRegion === "neck" ||
    input.bodyRegion === "armpit" ||
    input.bodyRegion === "groin_fold"
  ) {
    addScore(candidates, "swollen-lymph-node", 18, "lymph-node-location");
    if (isCalmSubcutaneousPattern(input)) {
      addScore(
        candidates,
        "swollen-lymph-node",
        28,
        "calm-subcutaneous-pattern",
      );
    }
  }

  return [...candidates.values()]
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      if (scoreDifference !== 0) return scoreDifference;
      return (
        (conditionOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (conditionOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .slice(0, safeLimit)
    .map((candidate) => ({
      conditionId: candidate.id,
      condition: CONDITION_BY_ID[candidate.id],
      whyRelevant: whyRelevant(candidate, input),
      matchedSignals: candidate.signals,
    }));
}

export const getConditionMatches = matchConditions;
