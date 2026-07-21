import { describe, expect, it } from "vitest";

import { DEMO_CASE_BY_ID, DEMO_CASES } from "../lib/demoCases";
import {
  getMatchContext,
  matchConditions,
} from "../lib/matchConditions";
import {
  evaluateTriage,
  type LumpDescription,
  type SafetySignals,
} from "../lib/triage";

function answers(
  overrides: Partial<LumpDescription & SafetySignals> = {},
): LumpDescription & SafetySignals {
  return {
    language: "english",
    originalText: "",
    normalizedPlainLanguage: "",
    bodyRegion: "unknown",
    layer: "unknown",
    onset: "unknown",
    trend: "unknown",
    pain: "unknown",
    rednessOrWarmth: null,
    drainage: "unknown",
    feverOrChills: null,
    faintConfusedOrVeryUnwell: null,
    recurrent: null,
    multipleLesions: null,
    tunnelsPitsOrScars: null,
    recentHairRemoval: null,
    frictionOrProlongedSitting: null,
    diabetesOrImmunocompromised: null,
    unknowns: [],
    suggestedFollowUpQuestions: [],
    ...overrides,
  };
}

describe("deterministic educational matching", () => {
  it("surfaces HS first for recurrent fold lesions with tunnels or scars", () => {
    const matches = matchConditions(
      answers({
        bodyRegion: "armpit",
        recurrent: true,
        multipleLesions: true,
        tunnelsPitsOrScars: true,
        pain: "moderate",
      }),
    );

    expect(matches[0]?.conditionId).toBe("hidradenitis-suppurativa");
    expect(matches[0]?.matchedSignals).toEqual(
      expect.arrayContaining(["recurrent-fold-pattern", "tunnels-or-scars"]),
    );
    expect(matches[0]?.whyRelevant).toContain("not a diagnosis");
  });

  it("surfaces ingrown hair and folliculitis for a mild post-shaving follicle bump", () => {
    const input = answers({
      bodyRegion: "limb_other",
      layer: "surface",
      pain: "mild",
      rednessOrWarmth: true,
      recentHairRemoval: true,
      multipleLesions: false,
      feverOrChills: false,
      trend: "stable",
    });
    const matches = matchConditions(input);

    expect(matches.map((match) => match.conditionId).slice(0, 2)).toEqual([
      "ingrown-hair",
      "folliculitis",
    ]);
    expect(evaluateTriage(input).category).toBe("lower_risk_monitoring");
  });

  it("surfaces pilonidal education for the natal-cleft sample", () => {
    const matches = matchConditions(
      DEMO_CASE_BY_ID["pilonidal-after-sitting"].description,
    );
    expect(matches[0]?.conditionId).toBe("pilonidal-disease");
  });

  it("surfaces the higher-location-specific record beside the anus", () => {
    const matches = matchConditions(
      DEMO_CASE_BY_ID["perianal-fever"].description,
    );
    expect(matches[0]?.conditionId).toBe("perianal-abscess-fistula");
  });

  it("does not map an inside-testicle lump to a superficial condition", () => {
    const input = answers({
      bodyRegion: "inside_testicle",
      layer: "deep_or_internal",
    });

    expect(matchConditions(input)).toEqual([]);
    expect(getMatchContext(input).outsideAtlas).toBe(true);
    expect(getMatchContext(input).notice).toContain("prompt clinical assessment");
  });

  it("keeps surface scrotal-skin comparisons in the superficial atlas", () => {
    const input = answers({
      bodyRegion: "scrotal_skin",
      layer: "surface",
      recentHairRemoval: true,
    });

    expect(getMatchContext(input).outsideAtlas).toBe(false);
    expect(matchConditions(input)[0]?.conditionId).toBe("ingrown-hair");
  });

  it("surfaces ganglion education at the wrist", () => {
    const matches = matchConditions(
      answers({
        bodyRegion: "wrist_hand",
        layer: "subcutaneous",
        pain: "none",
        rednessOrWarmth: false,
      }),
    );

    expect(matches[0]?.conditionId).toBe("ganglion-cyst");
  });

  it("ships all four required no-key demo descriptions", () => {
    expect(DEMO_CASES).toHaveLength(4);
    expect(DEMO_CASES.map((demoCase) => demoCase.text)).toEqual([
      "There is a painful lump at the top of my buttock cleft after several days of sitting.",
      "Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.",
      "Shave karne ke baad baal ke paas chota red bump hai.",
      "There is severe pain and swelling right beside the anus and I feel feverish.",
    ]);
  });

  it("does not invent severity, duration, or negative findings in demo fixtures", () => {
    const cleft = DEMO_CASE_BY_ID["pilonidal-after-sitting"].description;
    const armpit = DEMO_CASE_BY_ID["recurrent-armpit-scarring"].description;
    const shaving = DEMO_CASE_BY_ID["post-shaving-bump"].description;

    expect(cleft.onset).toBe("unknown");
    expect(cleft.pain).toBe("unknown");
    expect(cleft.multipleLesions).toBeNull();
    expect(armpit.onset).toBe("unknown");
    expect(armpit.pain).toBe("unknown");
    expect(armpit.multipleLesions).toBeNull();
    expect(shaving.onset).toBe("unknown");
    expect(shaving.layer).toBe("unknown");
    expect(shaving.multipleLesions).toBeNull();
    expect(shaving.tunnelsPitsOrScars).toBeNull();
  });
});
