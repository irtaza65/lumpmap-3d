import {
  LumpDescriptionSchema,
  type LumpDescription,
} from "./schema";

const SAMPLE_NORMALIZATIONS = new Map<string, string>([
  [
    "there is a painful lump at the top of my buttock cleft after several days of sitting.",
    "Painful lump at the top of the buttock cleft after several days of sitting.",
  ],
  [
    "baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.",
    "A painful lump keeps returning in the armpit and leaves a scar.",
  ],
  [
    "shave karne ke baad baal ke paas chota red bump hai.",
    "A small red bump is beside a hair after shaving.",
  ],
  [
    "there is severe pain and swelling right beside the anus and i feel feverish.",
    "Severe pain and swelling directly beside the anus, with feeling feverish.",
  ],
]);

const ROMAN_URDU_WORDS =
  /\b(?:aur|baal|baad|baar|baghal|bohat|chota|dard|daana|gilti|hai|hain|hoti|jata|mein|nishan|paas|phinsi|phora|reh|se|wali)\b/i;
const ENGLISH_WORDS =
  /\b(?:anus|bump|cleft|fever|hair|lump|pain|red|severe|shave|skin|sitting|swelling)\b/i;

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `(?:^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,
      "iu",
    ).test(text);
  });
}

function detectLanguage(text: string): LumpDescription["language"] {
  const hasUrduScript = /[\u0600-\u06ff]/u.test(text);
  const hasRomanUrdu = ROMAN_URDU_WORDS.test(text);
  const hasEnglish = ENGLISH_WORDS.test(text);

  if (hasUrduScript && (hasEnglish || hasRomanUrdu)) return "mixed";
  if (hasUrduScript) return "urdu";
  if (hasRomanUrdu && hasEnglish) return "mixed";
  if (hasRomanUrdu) return "roman_urdu";
  return "english";
}

function detectBodyRegion(text: string): LumpDescription["bodyRegion"] {
  if (
    includesAny(text, [
      "inside my testicle",
      "inside the testicle",
      "inside a testicle",
      "within my testicle",
      "testicular lump",
      "lump in my testicle",
      "anday ke andar",
    ])
  ) {
    return "inside_testicle";
  }
  if (
    includesAny(text, [
      "beside the anus",
      "beside my anus",
      "next to the anus",
      "next to my anus",
      "around the anus",
      "perianal",
      "anus ke paas",
      "maqad ke paas",
    ])
  ) {
    return "perianal";
  }
  if (
    includesAny(text, [
      "top of my buttock cleft",
      "top of the buttock cleft",
      "natal cleft",
      "top of my butt crack",
      "top of the butt crack",
      "tailbone crease",
    ])
  ) {
    return "natal_cleft";
  }
  if (includesAny(text, ["vulvar opening", "vaginal opening", "bartholin"])) {
    return "vulvar_opening";
  }
  if (
    includesAny(text, [
      "scrotal skin",
      "skin of my scrotum",
      "skin of the scrotum",
      "scrotum ki skin",
    ])
  ) {
    return "scrotal_skin";
  }
  if (includesAny(text, ["armpit", "underarm", "baghal", "بغل"])) {
    return "armpit";
  }
  if (includesAny(text, ["groin fold", "groin crease", "inner groin"])) {
    return "groin_fold";
  }
  if (includesAny(text, ["wrist", "hand", "kalai", "ہاتھ", "کلائی"])) {
    return "wrist_hand";
  }
  if (includesAny(text, ["scalp", "face", "cheek", "forehead", "chin", "eye"])) {
    return "scalp_face";
  }
  if (includesAny(text, ["neck", "gardan", "گردن"])) return "neck";
  if (includesAny(text, ["chest", "back", "shoulder blade", "سینہ"])) {
    return "chest_back";
  }
  if (includesAny(text, ["buttock", "butt cheek", "glute"] )) {
    return "buttock_skin";
  }
  if (
    includesAny(text, [
      "arm",
      "elbow",
      "leg",
      "thigh",
      "knee",
      "ankle",
      "foot",
      "forearm",
    ])
  ) {
    return "limb_other";
  }
  return "unknown";
}

function detectLayer(text: string): LumpDescription["layer"] {
  if (
    includesAny(text, [
      "inside an organ",
      "inside my testicle",
      "inside the testicle",
      "deep inside",
      "feels deep",
    ])
  ) {
    return "deep_or_internal";
  }
  if (
    includesAny(text, [
      "just beneath the skin",
      "just under the skin",
      "beneath my skin",
      "under my skin",
      "subcutaneous",
    ])
  ) {
    return "subcutaneous";
  }
  if (includesAny(text, ["on the skin", "skin surface", "surface of the skin"])) {
    return "surface";
  }
  return "unknown";
}

function detectOnset(text: string): LumpDescription["onset"] {
  if (/\b(?:for|over|past|since)\s+(?:an?\s+)?(?:hour|few hours|\d+\s*hours?)\b/i.test(text)) {
    return "hours";
  }
  if (/\b(?:for|over|past|since)\s+(?:a\s+)?(?:day|few days|\d+\s*days?)\b/i.test(text) || /\b\d+\s*din\s+se\b/i.test(text)) {
    return "days";
  }
  if (/\b(?:for|over|past|since)\s+(?:a\s+)?(?:week|few weeks|\d+\s*weeks?)\b/i.test(text)) {
    return "weeks";
  }
  if (/\b(?:for|over|past|since)\s+(?:a\s+)?(?:month|months|year|years|long time|\d+\s*(?:months?|years?))\b/i.test(text)) {
    return "months_or_longer";
  }
  return "unknown";
}

function detectTrend(text: string): LumpDescription["trend"] {
  if (
    !includesAny(text, [
      "not rapidly worsening",
      "not getting worse quickly",
      "isn't getting worse quickly",
    ]) &&
    includesAny(text, ["rapidly worsening", "quickly worsening", "getting worse quickly", "spreading quickly"])
  ) {
    return "rapidly_worsening";
  }
  if (includesAny(text, ["slowly worsening", "gradually worsening", "slowly getting worse"])) {
    return "slowly_worsening";
  }
  if (includesAny(text, ["getting better", "improving", "shrinking"])) return "improving";
  if (includesAny(text, ["staying the same", "has not changed", "unchanged", "stable"])) {
    return "stable";
  }
  return "unknown";
}

function detectPain(text: string): LumpDescription["pain"] {
  if (includesAny(text, ["no pain", "not painful", "painless", "without pain"])) return "none";
  if (
    !includesAny(text, [
      "no severe pain",
      "pain is not severe",
      "not severely painful",
    ]) &&
    includesAny(text, ["severe pain", "severely painful", "unbearable pain", "bohat zyada dard", "شدید درد"])
  ) {
    return "severe";
  }
  if (includesAny(text, ["moderate pain", "moderately painful"])) return "moderate";
  if (includesAny(text, ["mild pain", "mildly painful", "slightly painful"])) return "mild";
  return "unknown";
}

function detectNullableBoolean(
  text: string,
  positive: readonly string[],
  negative: readonly string[],
): boolean | null {
  if (includesAny(text, negative)) return false;
  if (includesAny(text, positive)) return true;
  return null;
}

function detectDrainage(text: string): LumpDescription["drainage"] {
  if (includesAny(text, ["no drainage", "not draining", "nothing coming out", "dry lump"])) return "none";
  if (
    !includesAny(text, ["no pus", "without pus", "not pus"]) &&
    includesAny(text, ["draining pus", "pus coming", "pus", "peep", "پیپ"])
  ) {
    return "pus";
  }
  if (
    !includesAny(text, ["no blood", "without blood", "not bleeding"]) &&
    includesAny(text, ["draining blood", "bleeding", "blood coming", "blood"])
  ) {
    return "blood";
  }
  if (includesAny(text, ["clear fluid", "watery fluid", "other fluid", "discharge"])) {
    return "clear_or_other";
  }
  return "unknown";
}

function buildUnknowns(
  values: Pick<
    LumpDescription,
    | "bodyRegion"
    | "layer"
    | "onset"
    | "trend"
    | "pain"
    | "rednessOrWarmth"
    | "drainage"
    | "feverOrChills"
    | "recurrent"
  >,
): string[] {
  const unknowns: string[] = [];
  if (values.bodyRegion === "unknown") unknowns.push("Exact body location is not stated.");
  if (values.layer === "unknown") unknowns.push("Depth is not stated.");
  if (values.onset === "unknown") unknowns.push("Onset or duration is not stated.");
  if (values.trend === "unknown") unknowns.push("Whether it is changing is not stated.");
  if (values.pain === "unknown") unknowns.push("Pain severity is not stated.");
  if (values.rednessOrWarmth === null) unknowns.push("Redness or warmth is not stated.");
  if (values.drainage === "unknown") unknowns.push("Drainage is not stated.");
  if (values.feverOrChills === null) unknowns.push("Fever or chills are not stated.");
  if (values.recurrent === null) unknowns.push("Recurrence is not stated.");
  return unknowns;
}

function buildFollowUpQuestions(
  values: Pick<
    LumpDescription,
    | "bodyRegion"
    | "layer"
    | "onset"
    | "trend"
    | "pain"
    | "feverOrChills"
  >,
): string[] {
  const questions: string[] = [];
  if (values.bodyRegion === "unknown") questions.push("Where on your body is the lump?");
  if (values.layer === "unknown") {
    questions.push("Is it on the surface, just beneath the skin, or deeper inside?");
  }
  if (values.onset === "unknown" || values.trend === "unknown") {
    questions.push("When did it begin, and is it getting worse quickly?");
  }
  if (values.pain === "unknown") questions.push("How severe is the pain, if any?");
  if (values.feverOrChills === null) questions.push("Do you have fever or chills?");
  return questions.slice(0, 3);
}

/**
 * Privacy-preserving no-key fallback. It recognizes only explicitly stated facts;
 * an unrecognized detail remains unknown rather than being guessed.
 */
export function parseDemoDescription(originalText: string): LumpDescription {
  const preservedText = originalText;
  const normalizedInput = originalText.trim();
  const text = normalizedInput.toLocaleLowerCase("en-US");

  const bodyRegion = detectBodyRegion(text);
  const layer = detectLayer(text);
  const onset = detectOnset(text);
  const trend = detectTrend(text);
  const pain = detectPain(text);
  const rednessOrWarmth = detectNullableBoolean(
    text,
    ["red bump", "redness", "red and", "warm", "hot lump", "surkh", "سرخ", "گرم"],
    [
      "no redness",
      "without redness",
      "not red",
      "no warmth",
      "without warmth",
      "not warm",
      "neither red nor warm",
    ],
  );
  const drainage = detectDrainage(text);
  const feverOrChills = detectNullableBoolean(
    text,
    ["feverish", "fever", "chills", "bukhar", "بخار", "کپکپی"],
    [
      "no fever",
      "without fever",
      "not feverish",
      "no chills",
      "without chills",
      "neither fever nor chills",
    ],
  );
  const faintConfusedOrVeryUnwell = detectNullableBoolean(
    text,
    ["fainted", "fainting", "confused", "very unwell", "severely unwell", "trouble breathing"],
    [
      "not faint",
      "not fainting",
      "not confused",
      "not feeling unwell",
      "not very unwell",
      "not severely unwell",
      "no trouble breathing",
      "breathing normally",
    ],
  );
  const recurrent = detectNullableBoolean(
    text,
    ["recurrent", "keeps returning", "comes back", "baar baar", "same place again"],
    ["first time", "never happened before", "does not come back", "doesn't come back"],
  );
  const multipleLesions = detectNullableBoolean(
    text,
    ["multiple lumps", "several lumps", "many lumps", "more than one lump"],
    ["one lump", "single lump", "only one"],
  );
  const tunnelsPitsOrScars = detectNullableBoolean(
    text,
    ["tunnel", "sinus opening", "pit", "scarring", "scar", "nishan", "داغ"],
    [
      "no tunnel",
      "no tunnels",
      "no pit",
      "no pits",
      "no scar",
      "no scars",
      "no scarring",
    ],
  );
  const recentHairRemoval = detectNullableBoolean(
    text,
    ["after shaving", "after i shaved", "after waxing", "recent hair removal", "shave karne ke baad"],
    ["did not shave", "no shaving", "no waxing", "no hair removal"],
  );
  const frictionOrProlongedSitting = detectNullableBoolean(
    text,
    ["prolonged sitting", "sitting for days", "several days of sitting", "tight clothing", "friction"],
    [
      "no prolonged sitting",
      "no friction",
      "without friction",
      "no tight clothing",
    ],
  );
  const diabetesOrImmunocompromised = detectNullableBoolean(
    text,
    ["diabetes", "diabetic", "weakened immune", "immunocompromised", "immune suppression"],
    [
      "no diabetes",
      "without diabetes",
      "not diabetic",
      "not immunocompromised",
      "normal immune system",
    ],
  );

  const coreValues = {
    bodyRegion,
    layer,
    onset,
    trend,
    pain,
    rednessOrWarmth,
    drainage,
    feverOrChills,
    recurrent,
  };

  return LumpDescriptionSchema.parse({
    language: detectLanguage(normalizedInput),
    originalText: preservedText,
    normalizedPlainLanguage:
      SAMPLE_NORMALIZATIONS.get(text) ?? normalizedInput,
    ...coreValues,
    faintConfusedOrVeryUnwell,
    multipleLesions,
    tunnelsPitsOrScars,
    recentHairRemoval,
    frictionOrProlongedSitting,
    diabetesOrImmunocompromised,
    unknowns: buildUnknowns(coreValues),
    suggestedFollowUpQuestions: buildFollowUpQuestions(coreValues),
  });
}
