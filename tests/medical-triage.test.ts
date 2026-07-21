import { describe, expect, it } from "vitest";

import {
  enforceDeterministicTriage,
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
    bodyRegion: "limb_other",
    layer: "surface",
    onset: "days",
    trend: "stable",
    pain: "mild",
    rednessOrWarmth: false,
    drainage: "none",
    feverOrChills: false,
    faintConfusedOrVeryUnwell: false,
    recurrent: false,
    multipleLesions: false,
    tunnelsPitsOrScars: false,
    recentHairRemoval: false,
    frictionOrProlongedSitting: false,
    diabetesOrImmunocompromised: false,
    unknowns: [],
    suggestedFollowUpQuestions: [],
    ...overrides,
  };
}

describe("deterministic emergency rules", () => {
  it("routes sudden severe testicular pain to emergency care", () => {
    const result = evaluateTriage(
      answers({
        bodyRegion: "inside_testicle",
        layer: "deep_or_internal",
        onset: "hours",
        suddenOnset: true,
        pain: "severe",
      }),
    );

    expect(result.category).toBe("emergency_now");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "acute_testicular_pain_or_swelling",
    );
    expect(result.triggeredBy).toContain("Location: Inside a testicle");
  });

  it("routes rapidly developing scrotal swelling to emergency care", () => {
    const result = evaluateTriage(
      answers({
        bodyRegion: "scrotal_skin",
        trend: "rapidly_worsening",
        swelling: true,
      }),
    );

    expect(result.category).toBe("emergency_now");
    expect(result.triggers[0]?.facts).toContain("Swelling: yes");
  });

  it.each([
    ["faint/confused/very unwell", { faintConfusedOrVeryUnwell: true }],
    ["trouble breathing", { troubleBreathing: true }],
  ])("routes %s to emergency care", (_label, override) => {
    const result = evaluateTriage(answers(override));
    expect(result.category).toBe("emergency_now");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "severe_general_illness",
    );
  });

  it("routes spreading inflammation with severe systemic symptoms to emergency care", () => {
    const result = evaluateTriage(
      answers({
        spreadingRednessOrSwelling: true,
        severeSystemicSymptoms: true,
      }),
    );

    expect(result.category).toBe("emergency_now");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "rapid_spread_with_severe_systemic_symptoms",
    );
  });

  it("routes black, grey, blistering, or numb skin with rapid painful worsening to emergency care", () => {
    const result = evaluateTriage(
      answers({
        blackGreyBlisteringOrNumbSkin: true,
        trend: "rapidly_worsening",
        pain: "severe",
      }),
    );

    expect(result.category).toBe("emergency_now");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "concerning_skin_change",
    );
  });

  it("routes pain markedly out of proportion to emergency care", () => {
    const result = evaluateTriage(
      answers({ pain: "severe", painOutOfProportion: true }),
    );

    expect(result.category).toBe("emergency_now");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "pain_out_of_proportion",
    );
  });
});

describe("other deterministic care levels", () => {
  it("routes the perianal pain and fever case to same-day care", () => {
    const result = evaluateTriage(
      answers({
        bodyRegion: "perianal",
        pain: "severe",
        swelling: true,
        feverOrChills: true,
      }),
    );

    expect(result.category).toBe("same_day_urgent");
    expect(result.triggeredBy).toContain("Location: Directly beside the anus");
    expect(result.triggeredBy).toContain("Fever or chills: yes");
  });

  it("keeps a mild surface bump on scrotal skin distinct from a lump inside a testicle", () => {
    const skinResult = evaluateTriage(
      answers({ bodyRegion: "scrotal_skin", layer: "surface" }),
    );
    const internalResult = evaluateTriage(
      answers({
        bodyRegion: "inside_testicle",
        layer: "deep_or_internal",
        pain: "none",
      }),
    );

    expect(skinResult.category).toBe("lower_risk_monitoring");
    expect(internalResult.category).toBe("prompt_appointment");
    expect(internalResult.triggers.map((trigger) => trigger.ruleId)).toContain(
      "new_lump_inside_testicle",
    );
  });

  it("routes infection signs with diabetes or weakened immunity to same-day care", () => {
    const result = evaluateTriage(
      answers({
        diabetesOrImmunocompromised: true,
        rednessOrWarmth: true,
      }),
    );

    expect(result.category).toBe("same_day_urgent");
  });

  it("routes a new Bartholin-area lump at age 40 or older to a prompt appointment", () => {
    const result = evaluateTriage(
      answers({
        bodyRegion: "vulvar_opening",
        pain: "none",
        swelling: false,
        age: 40,
      }),
    );

    expect(result.category).toBe("prompt_appointment");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "bartholin_area_age_40_plus",
    );
  });

  it("routes a deep or internal lump outside the focused atlas to an appointment", () => {
    const result = evaluateTriage(
      answers({ bodyRegion: "chest_back", layer: "deep_or_internal" }),
    );

    expect(result.category).toBe("prompt_appointment");
    expect(result.triggers.map((trigger) => trigger.ruleId)).toContain(
      "deep_or_internal_lump",
    );
  });

  it("does not invent safety answers when fields are missing", () => {
    const result = evaluateTriage({ bodyRegion: "unknown" });

    expect(result.category).toBe("lower_risk_monitoring");
    expect(result.triggers).toEqual([]);
    expect(result.triggeredBy).toEqual([]);
    expect(result.hasUnknownSafetyInformation).toBe(true);
  });

  it("never lets a model suggestion downgrade deterministic urgency", () => {
    const deterministic = evaluateTriage(
      answers({ troubleBreathing: true }),
    );
    const merged = enforceDeterministicTriage(
      deterministic,
      "lower_risk_monitoring",
    );

    expect(merged).toEqual(deterministic);
    expect(merged.category).toBe("emergency_now");
  });
});
