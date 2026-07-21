import { describe, expect, it } from "vitest";

import {
  ATLAS_SCOPE_NOTE,
  CONDITIONS,
  CONDITION_IDS,
  MEDICAL_REVIEW_NOTICE,
} from "../lib/conditions";
import {
  REGIONS,
  REGION_BY_ID,
  SELECTABLE_ATLAS_REGIONS,
} from "../lib/regions";

describe("curated medical content", () => {
  it("contains all 14 seeded condition families with complete source metadata", () => {
    expect(CONDITIONS).toHaveLength(14);
    expect(new Set(CONDITIONS.map((condition) => condition.id)).size).toBe(14);
    expect(CONDITIONS.map((condition) => condition.id)).toEqual([
      ...CONDITION_IDS,
    ]);

    for (const condition of CONDITIONS) {
      expect(condition.oneLineDefinition.length).toBeGreaterThan(20);
      expect(condition.typicalPattern.length).toBeGreaterThan(0);
      expect(condition.importantDistinctions.length).toBeGreaterThan(0);
      expect(condition.careOverview.length).toBeGreaterThan(0);
      expect(condition.riskReduction.length).toBeGreaterThan(0);
      expect(condition.doNot.length).toBeGreaterThan(0);
      expect(condition.urgencyNotes.length).toBeGreaterThan(0);
      expect(condition.sourceUrls.length).toBeGreaterThan(0);
      expect(
        condition.sourceUrls.every((sourceUrl) =>
          sourceUrl.startsWith("https://"),
        ),
      ).toBe(true);
      expect(condition.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(condition.scene3d.stageLabels).toHaveLength(3);
    }
  });

  it("clearly labels the two required non-cyst comparisons", () => {
    const lipoma = CONDITIONS.find((condition) => condition.id === "lipoma");
    const node = CONDITIONS.find(
      (condition) => condition.id === "swollen-lymph-node",
    );

    expect(lipoma?.isActuallyACyst).toBe(false);
    expect(lipoma?.name).toContain("not a cyst");
    expect(node?.isActuallyACyst).toBe(false);
    expect(node?.name).toContain("not a cyst");
  });

  it("keeps perianal and testicular locations safety-sensitive", () => {
    const perianal = REGIONS.find((region) => region.id === "perianal");
    const insideTesticle = REGIONS.find(
      (region) => region.id === "inside_testicle",
    );

    expect(perianal?.higherRiskLocation).toBe(true);
    expect(perianal?.safetyNote).toContain("same-day");
    expect(insideTesticle?.commonConditionIds).toEqual([]);
    expect(insideTesticle?.safetyNote).toContain("prompt clinical assessment");
  });

  it("exposes exactly 17 concrete regions in the selectable atlas", () => {
    expect(SELECTABLE_ATLAS_REGIONS).toHaveLength(17);
    expect(
      SELECTABLE_ATLAS_REGIONS.some((region) => region.id === "limb_other"),
    ).toBe(false);
    expect(REGION_BY_ID.limb_other).toBeDefined();
  });

  it("publishes the focused-atlas and clinician-review boundaries", () => {
    expect(ATLAS_SCOPE_NOTE).toContain("Internal-organ cysts");
    expect(MEDICAL_REVIEW_NOTICE).toBe(
      "Medical content should be reviewed by a licensed clinician before real-world clinical use.",
    );
  });
});
