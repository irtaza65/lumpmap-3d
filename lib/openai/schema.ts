import { z } from "zod";

export const MAX_DESCRIPTION_CHARS = 4_000;

export const LumpDescriptionSchema = z
  .object({
    language: z.enum(["english", "urdu", "roman_urdu", "mixed"]),
    originalText: z.string(),
    normalizedPlainLanguage: z.string(),
    bodyRegion: z.enum([
      "scalp_face",
      "neck",
      "armpit",
      "chest_back",
      "groin_fold",
      "vulvar_opening",
      "scrotal_skin",
      "inside_testicle",
      "buttock_skin",
      "natal_cleft",
      "perianal",
      "wrist_hand",
      "limb_other",
      "unknown",
    ]),
    layer: z.enum([
      "surface",
      "subcutaneous",
      "deep_or_internal",
      "unknown",
    ]),
    onset: z.enum([
      "hours",
      "days",
      "weeks",
      "months_or_longer",
      "unknown",
    ]),
    trend: z.enum([
      "improving",
      "stable",
      "slowly_worsening",
      "rapidly_worsening",
      "unknown",
    ]),
    pain: z.enum(["none", "mild", "moderate", "severe", "unknown"]),
    rednessOrWarmth: z.boolean().nullable(),
    drainage: z.enum(["none", "pus", "blood", "clear_or_other", "unknown"]),
    feverOrChills: z.boolean().nullable(),
    faintConfusedOrVeryUnwell: z.boolean().nullable(),
    recurrent: z.boolean().nullable(),
    multipleLesions: z.boolean().nullable(),
    tunnelsPitsOrScars: z.boolean().nullable(),
    recentHairRemoval: z.boolean().nullable(),
    frictionOrProlongedSitting: z.boolean().nullable(),
    diabetesOrImmunocompromised: z.boolean().nullable(),
    unknowns: z.array(z.string()),
    suggestedFollowUpQuestions: z.array(z.string()).max(3),
  })
  .strict();

export type LumpDescription = z.infer<typeof LumpDescriptionSchema>;

/** The only accepted client payload. Unknown keys are rejected. */
export const NavigateRequestSchema = z
  .object({
    text: z
      .string()
      .refine((value) => value.trim().length > 0, "Description is required")
      .refine(
        (value) => value.length <= MAX_DESCRIPTION_CHARS,
        `Description must be ${MAX_DESCRIPTION_CHARS} characters or fewer`,
      ),
  })
  .strict();

export type NavigateRequest = z.infer<typeof NavigateRequestSchema>;

export type NavigateResponse = {
  mode: "openai" | "demo";
  description: LumpDescription;
};
