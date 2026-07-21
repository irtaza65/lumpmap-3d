import type {
  LumpDescription,
  SafetySignals,
} from "./triage";

export type DemoDescription = LumpDescription & SafetySignals;

export interface DemoCase {
  id:
    | "pilonidal-after-sitting"
    | "recurrent-armpit-scarring"
    | "post-shaving-bump"
    | "perianal-fever";
  title: string;
  text: string;
  shortDescription: string;
  description: DemoDescription;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: "pilonidal-after-sitting",
    title: "Top-of-cleft lump",
    text: "There is a painful lump at the top of my buttock cleft after several days of sitting.",
    shortDescription: "Painful natal-cleft lump after prolonged sitting",
    description: {
      language: "english",
      originalText:
        "There is a painful lump at the top of my buttock cleft after several days of sitting.",
      normalizedPlainLanguage:
        "A painful lump at the top of the buttock cleft after several days of sitting.",
      bodyRegion: "natal_cleft",
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
      frictionOrProlongedSitting: true,
      diabetesOrImmunocompromised: null,
      unknowns: [
        "when the lump began",
        "pain severity",
        "whether the area is red or warm",
        "whether there is drainage",
        "whether fever or chills are present",
      ],
      suggestedFollowUpQuestions: [
        "How severe is the pain, and is it rapidly getting worse?",
        "Is there pus, blood, or another type of drainage?",
        "Do you have fever, chills, or feel generally unwell?",
      ],
    },
  },
  {
    id: "recurrent-armpit-scarring",
    title: "Repeated armpit bumps",
    text: "Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.",
    shortDescription: "Roman Urdu: repeated painful armpit bumps with marks",
    description: {
      language: "roman_urdu",
      originalText:
        "Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.",
      normalizedPlainLanguage:
        "Repeated painful lumps occur in the armpit and leave marks or scars.",
      bodyRegion: "armpit",
      layer: "unknown",
      onset: "unknown",
      trend: "unknown",
      pain: "unknown",
      rednessOrWarmth: null,
      drainage: "unknown",
      feverOrChills: null,
      faintConfusedOrVeryUnwell: null,
      recurrent: true,
      multipleLesions: null,
      tunnelsPitsOrScars: true,
      recentHairRemoval: null,
      frictionOrProlongedSitting: null,
      diabetesOrImmunocompromised: null,
      unknowns: [
        "when the pattern began",
        "pain severity",
        "whether several lumps are present at once",
        "whether there are openings, tunnels, or drainage",
        "whether fever or chills are present",
      ],
      suggestedFollowUpQuestions: [
        "Are there several lumps, open areas, or drainage?",
        "Do you notice tunnels beneath the skin as well as marks or scars?",
        "Do you have fever, chills, or feel generally unwell?",
      ],
    },
  },
  {
    id: "post-shaving-bump",
    title: "Bump after shaving",
    text: "Shave karne ke baad baal ke paas chota red bump hai.",
    shortDescription: "Roman Urdu: small red follicle bump after shaving",
    description: {
      language: "roman_urdu",
      originalText: "Shave karne ke baad baal ke paas chota red bump hai.",
      normalizedPlainLanguage:
        "There is a small red bump beside a hair after shaving.",
      bodyRegion: "unknown",
      layer: "unknown",
      onset: "unknown",
      trend: "unknown",
      pain: "unknown",
      rednessOrWarmth: true,
      drainage: "unknown",
      feverOrChills: null,
      faintConfusedOrVeryUnwell: null,
      recurrent: null,
      multipleLesions: null,
      tunnelsPitsOrScars: null,
      recentHairRemoval: true,
      frictionOrProlongedSitting: null,
      diabetesOrImmunocompromised: null,
      unknowns: [
        "specific body location",
        "whether the bump is at the surface or deeper",
        "when the bump began",
        "pain level",
        "whether there is drainage",
      ],
      suggestedFollowUpQuestions: [
        "Where on the body is the bump?",
        "How painful is it, and is it getting worse?",
        "Is there warmth, swelling, pus, or other drainage?",
      ],
    },
  },
  {
    id: "perianal-fever",
    title: "Perianal pain + fever",
    text: "There is severe pain and swelling right beside the anus and I feel feverish.",
    shortDescription: "Severe perianal pain and swelling with fever",
    description: {
      language: "english",
      originalText:
        "There is severe pain and swelling right beside the anus and I feel feverish.",
      normalizedPlainLanguage:
        "Severe pain and swelling directly beside the anus with feeling feverish.",
      bodyRegion: "perianal",
      layer: "unknown",
      onset: "unknown",
      trend: "unknown",
      pain: "severe",
      rednessOrWarmth: null,
      drainage: "unknown",
      feverOrChills: true,
      faintConfusedOrVeryUnwell: null,
      recurrent: null,
      multipleLesions: null,
      tunnelsPitsOrScars: null,
      recentHairRemoval: null,
      frictionOrProlongedSitting: null,
      diabetesOrImmunocompromised: null,
      unknowns: [
        "how quickly the swelling developed",
        "whether there is drainage",
        "whether the person feels faint, confused, or very unwell",
      ],
      suggestedFollowUpQuestions: [
        "How quickly did the swelling develop or worsen?",
        "Is there pus, blood, or another type of drainage?",
        "Do you feel faint, confused, or very unwell?",
      ],
      swelling: true,
    },
  },
];

export const demoCases = DEMO_CASES;

export const DEMO_CASE_BY_ID = Object.fromEntries(
  DEMO_CASES.map((demoCase) => [demoCase.id, demoCase]),
) as Record<DemoCase["id"], DemoCase>;
