import type { ConditionId } from "./conditions";

/**
 * The deliberately small location vocabulary used by the guided description
 * flow and the deterministic medical engine. More detailed atlas hotspots map
 * back to one of these values.
 */
export type BodyRegion =
  | "scalp_face"
  | "neck"
  | "armpit"
  | "chest_back"
  | "groin_fold"
  | "vulvar_opening"
  | "scrotal_skin"
  | "inside_testicle"
  | "buttock_skin"
  | "natal_cleft"
  | "perianal"
  | "wrist_hand"
  | "limb_other"
  | "unknown";

export type AtlasRegionId =
  | BodyRegion
  | "abdomen"
  | "arms"
  | "thighs_legs"
  | "knees"
  | "ankles_feet";

export type AtlasView = "front" | "back" | "both";

export interface RegionRecord {
  id: AtlasRegionId;
  /** Value supplied to the guide/matcher when this atlas hotspot is chosen. */
  bodyRegion: BodyRegion;
  label: string;
  shortLabel: string;
  view: AtlasView;
  searchTerms: string[];
  intro: string;
  commonConditionIds: ConditionId[];
  higherRiskLocation?: boolean;
  optionalSchematic?: boolean;
  safetyNote?: string;
}

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  scalp_face: "Scalp or face",
  neck: "Neck",
  armpit: "Armpit",
  chest_back: "Chest or back",
  groin_fold: "Groin fold",
  vulvar_opening: "Near the vulvar opening",
  scrotal_skin: "Scrotal skin",
  inside_testicle: "Inside a testicle",
  buttock_skin: "Buttock skin away from the cleft",
  natal_cleft: "Top of the buttock cleft",
  perianal: "Directly beside the anus",
  wrist_hand: "Wrist or hand",
  limb_other: "Arm or leg skin",
  unknown: "Location not yet clear",
};

/**
 * Editorial region copy and location comparisons. These are learning paths,
 * never a location-to-diagnosis lookup table.
 */
export const REGIONS: RegionRecord[] = [
  {
    id: "scalp_face",
    bodyRegion: "scalp_face",
    label: "Scalp & face",
    shortLabel: "Face",
    view: "front",
    searchTerms: ["scalp", "face", "cheek", "chin", "forehead", "eye"],
    intro: "Commonly confused in this area: inflamed follicles, acne lesions, cysts, and other superficial lumps.",
    commonConditionIds: [
      "acne-nodule-cyst",
      "epidermoid-cyst",
      "boil-carbuncle",
      "skin-abscess",
      "swollen-lymph-node",
      "lipoma",
    ],
    higherRiskLocation: true,
    safetyNote:
      "A painful swelling near the eye or central face deserves same-day clinical advice; rapidly worsening or severe symptoms need more urgent care.",
  },
  {
    id: "neck",
    bodyRegion: "neck",
    label: "Neck",
    shortLabel: "Neck",
    view: "both",
    searchTerms: ["neck", "jaw", "under jaw", "gland"],
    intro: "Patterns worth learning about include skin cysts, boils, fatty lumps, and lymph nodes beneath the skin.",
    commonConditionIds: [
      "acne-nodule-cyst",
      "epidermoid-cyst",
      "boil-carbuncle",
      "skin-abscess",
      "swollen-lymph-node",
      "lipoma",
    ],
  },
  {
    id: "armpit",
    bodyRegion: "armpit",
    label: "Armpits",
    shortLabel: "Armpit",
    view: "front",
    searchTerms: ["armpit", "underarm", "axilla", "baghal"],
    intro: "Repeated painful lumps, drainage, tunnels, or scars in a fold are important patterns to discuss with a clinician.",
    commonConditionIds: [
      "hidradenitis-suppurativa",
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "swollen-lymph-node",
    ],
  },
  {
    id: "chest_back",
    bodyRegion: "chest_back",
    label: "Chest & back",
    shortLabel: "Torso",
    view: "both",
    searchTerms: ["chest", "back", "shoulder", "torso", "breast skin"],
    intro: "Commonly confused here are acne nodules, epidermoid cysts, inflamed lumps, and soft fatty lumps.",
    commonConditionIds: [
      "acne-nodule-cyst",
      "epidermoid-cyst",
      "boil-carbuncle",
      "skin-abscess",
      "swollen-lymph-node",
      "lipoma",
    ],
  },
  {
    id: "abdomen",
    bodyRegion: "chest_back",
    label: "Abdomen",
    shortLabel: "Abdomen",
    view: "front",
    searchTerms: ["abdomen", "belly", "stomach skin", "waist"],
    intro: "This atlas compares superficial skin and fatty-tissue lumps; it does not cover lumps arising inside abdominal organs.",
    commonConditionIds: [
      "epidermoid-cyst",
      "folliculitis",
      "boil-carbuncle",
      "skin-abscess",
      "lipoma",
    ],
    safetyNote:
      "A lump that feels deep inside the abdomen is outside this superficial atlas and should be assessed clinically.",
  },
  {
    id: "groin_fold",
    bodyRegion: "groin_fold",
    label: "Groin folds",
    shortLabel: "Groin",
    view: "front",
    searchTerms: ["groin", "groin fold", "bikini line", "inner thigh fold"],
    intro: "Fold-area lumps may involve follicles, ingrown hairs, abscesses, lymph nodes, or a recurring HS pattern.",
    commonConditionIds: [
      "hidradenitis-suppurativa",
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "swollen-lymph-node",
    ],
  },
  {
    id: "vulvar_opening",
    bodyRegion: "vulvar_opening",
    label: "Near the vulvar opening",
    shortLabel: "Vulvar area",
    view: "front",
    searchTerms: ["vulva", "vaginal opening", "labia", "bartholin"],
    intro: "A respectful schematic compares a Bartholin-area lump with conditions affecting hair-bearing outer skin.",
    commonConditionIds: [
      "bartholin-cyst-abscess",
      "folliculitis",
      "ingrown-hair",
      "skin-abscess",
    ],
    higherRiskLocation: true,
    optionalSchematic: true,
    safetyNote:
      "Painful swelling near a genital opening needs timely clinical assessment. A new Bartholin-area lump at age 40 or older also needs a prompt appointment.",
  },
  {
    id: "scrotal_skin",
    bodyRegion: "scrotal_skin",
    label: "Scrotal skin",
    shortLabel: "Scrotal skin",
    view: "front",
    searchTerms: ["scrotum", "scrotal skin", "skin of scrotum"],
    intro: "Surface bumps can involve follicles or skin cysts. A lump felt inside a testicle follows a different safety path.",
    commonConditionIds: ["folliculitis", "ingrown-hair", "epidermoid-cyst"],
    higherRiskLocation: true,
    optionalSchematic: true,
    safetyNote:
      "Sudden severe testicular pain or rapidly developing scrotal swelling is an emergency. Any new lump felt inside a testicle needs prompt clinical assessment.",
  },
  {
    id: "inside_testicle",
    bodyRegion: "inside_testicle",
    label: "Inside a testicle",
    shortLabel: "Inside testicle",
    view: "front",
    searchTerms: ["inside testicle", "testicular lump", "testicle"],
    intro: "This is not treated as a superficial skin-lump match. The anatomy distinction changes the care guidance.",
    commonConditionIds: [],
    higherRiskLocation: true,
    optionalSchematic: true,
    safetyNote:
      "Arrange prompt clinical assessment for any new lump felt inside a testicle. Sudden severe pain or rapid swelling is an emergency.",
  },
  {
    id: "buttock_skin",
    bodyRegion: "buttock_skin",
    label: "Buttock skin",
    shortLabel: "Buttock",
    view: "back",
    searchTerms: ["buttock", "bottom", "glute", "away from cleft"],
    intro: "Away from the cleft, follicle-centred bumps, ingrown hairs, boils, abscesses, and epidermoid cysts can look alike.",
    commonConditionIds: [
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "epidermoid-cyst",
    ],
  },
  {
    id: "natal_cleft",
    bodyRegion: "natal_cleft",
    label: "Top of the buttock cleft",
    shortLabel: "Natal cleft",
    view: "back",
    searchTerms: ["natal cleft", "buttock cleft", "top of bottom", "tailbone", "pilonidal"],
    intro: "The exact top-of-cleft location is a useful clue, but symptoms and tissue pattern still matter.",
    commonConditionIds: [
      "pilonidal-disease",
      "epidermoid-cyst",
      "folliculitis",
      "boil-carbuncle",
      "skin-abscess",
    ],
  },
  {
    id: "perianal",
    bodyRegion: "perianal",
    label: "Directly beside the anus",
    shortLabel: "Perianal",
    view: "back",
    searchTerms: ["anus", "anal", "perianal", "beside anus", "rectal"],
    intro: "Location directly beside the anus changes urgency and should not be treated as an ordinary skin-cyst lookup.",
    commonConditionIds: [
      "perianal-abscess-fistula",
      "hemorrhoid",
      "skin-abscess",
    ],
    higherRiskLocation: true,
    optionalSchematic: true,
    safetyNote:
      "A painful lump or swelling directly beside the anus needs same-day assessment, particularly with fever, drainage, or worsening pain.",
  },
  {
    id: "arms",
    bodyRegion: "limb_other",
    label: "Arms",
    shortLabel: "Arms",
    view: "both",
    searchTerms: ["arm", "forearm", "elbow", "upper arm"],
    intro: "Patterns worth learning about include follicle bumps, ingrown hairs, boils, skin abscesses, and epidermoid cysts.",
    commonConditionIds: [
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "epidermoid-cyst",
      "lipoma",
    ],
  },
  {
    id: "wrist_hand",
    bodyRegion: "wrist_hand",
    label: "Wrists & hands",
    shortLabel: "Wrist",
    view: "both",
    searchTerms: ["wrist", "hand", "finger", "joint", "ganglion"],
    intro: "A ganglion can connect to a joint or tendon sheath; an unexplained mass still deserves assessment if persistent or changing.",
    commonConditionIds: ["ganglion-cyst", "epidermoid-cyst"],
  },
  {
    id: "thighs_legs",
    bodyRegion: "limb_other",
    label: "Thighs & legs",
    shortLabel: "Legs",
    view: "both",
    searchTerms: ["thigh", "leg", "shin", "calf"],
    intro: "Hair-follicle inflammation and superficial lumps can share a similar surface appearance here.",
    commonConditionIds: [
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "epidermoid-cyst",
      "lipoma",
    ],
  },
  {
    id: "knees",
    bodyRegion: "limb_other",
    label: "Knees",
    shortLabel: "Knee",
    view: "both",
    searchTerms: ["knee", "kneecap", "behind knee"],
    intro: "This atlas covers superficial skin and fatty-tissue lumps, not every joint or bone-related swelling.",
    commonConditionIds: ["epidermoid-cyst", "skin-abscess", "lipoma"],
  },
  {
    id: "ankles_feet",
    bodyRegion: "limb_other",
    label: "Ankles & feet",
    shortLabel: "Feet",
    view: "both",
    searchTerms: ["ankle", "foot", "feet", "toe"],
    intro: "Surface inflammation can occur here, but unexplained joint, tendon, or bone-area masses are outside this focused atlas.",
    commonConditionIds: [
      "folliculitis",
      "boil-carbuncle",
      "skin-abscess",
      "epidermoid-cyst",
      "ganglion-cyst",
    ],
  },
  {
    id: "limb_other",
    bodyRegion: "limb_other",
    label: "Other arm or leg area",
    shortLabel: "Other limb",
    view: "both",
    searchTerms: ["limb", "skin", "other"],
    intro: "Use symptoms such as follicle relationship, warmth, drainage, duration, and change over time to guide what to learn about.",
    commonConditionIds: [
      "folliculitis",
      "ingrown-hair",
      "boil-carbuncle",
      "skin-abscess",
      "epidermoid-cyst",
      "lipoma",
    ],
  },
  {
    id: "unknown",
    bodyRegion: "unknown",
    label: "Location not yet clear",
    shortLabel: "Not sure",
    view: "both",
    searchTerms: ["unknown", "not sure"],
    intro: "Location is only one clue. Add the surface or depth, timing, pain, warmth, drainage, recurrence, and general symptoms when you can.",
    commonConditionIds: [],
  },
];

export const regions = REGIONS;

export const REGION_BY_ID = Object.fromEntries(
  REGIONS.map((region) => [region.id, region]),
) as Record<AtlasRegionId, RegionRecord>;

export function getRegion(id: AtlasRegionId): RegionRecord | undefined {
  return REGION_BY_ID[id];
}

export function getRegionsForBodyRegion(bodyRegion: BodyRegion): RegionRecord[] {
  return REGIONS.filter((region) => region.bodyRegion === bodyRegion);
}

export function getConditionIdsForBodyRegion(bodyRegion: BodyRegion): ConditionId[] {
  const ids = getRegionsForBodyRegion(bodyRegion).flatMap(
    (region) => region.commonConditionIds,
  );
  return [...new Set(ids)];
}
