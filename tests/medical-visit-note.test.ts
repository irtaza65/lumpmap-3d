import { describe, expect, it } from "vitest";

import {
  buildVisitNote,
  getVisitNoteFacts,
} from "../lib/visitNote";
import type { TriageInput } from "../lib/triage";

describe("factual Visit Note", () => {
  it("includes only allow-listed facts the user provided", () => {
    const input = {
      bodyRegion: "armpit",
      onset: "weeks",
      pain: "moderate",
      recurrent: true,
      rednessOrWarmth: null,
      drainage: "unknown",
      feverOrChills: false,
      faintConfusedOrVeryUnwell: null,
      recentHairRemoval: null,
      frictionOrProlongedSitting: true,
      diabetesOrImmunocompromised: null,
      originalText: "Maybe this is HS",
      normalizedPlainLanguage: "Possible hidradenitis suppurativa",
      diagnosis: "hidradenitis suppurativa",
    } as TriageInput & { diagnosis: string };

    const note = buildVisitNote(input);

    expect(note).toContain("Location: Armpit");
    expect(note).toContain("Onset: Within weeks");
    expect(note).toContain("Pain: Moderate");
    expect(note).toContain("Occurred before in the same area: Yes");
    expect(note).toContain("Fever or chills: No");
    expect(note).toContain("Friction, tight clothing, or prolonged sitting");
    expect(note).not.toMatch(/HS|hidradenitis|diagnos/i);
    expect(note).not.toContain("Redness or warmth");
    expect(note).not.toContain("Drainage");
    expect(note).not.toContain("Faint, confused, or very unwell");
  });

  it("does not turn missing values into negative findings", () => {
    const facts = getVisitNoteFacts({ bodyRegion: "unknown" });
    const note = buildVisitNote({ bodyRegion: "unknown" });

    expect(facts).toEqual([]);
    expect(note).toBe(
      "Visit Note — facts provided\nNo visit-note details were provided.",
    );
  });

  it("records explicit negatives because they were actually provided", () => {
    const note = buildVisitNote({
      recurrent: false,
      rednessOrWarmth: false,
      drainage: "none",
      feverOrChills: false,
      faintConfusedOrVeryUnwell: false,
    });

    expect(note).toContain("Occurred before in the same area: No");
    expect(note).toContain("Redness or warmth: No");
    expect(note).toContain("Drainage: None");
    expect(note).toContain("Fever or chills: No");
    expect(note).toContain("Faint, confused, or very unwell: No");
  });
});

