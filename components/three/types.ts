export const BODY_REGION_IDS = [
  "scalp_face",
  "neck",
  "armpit",
  "chest_back",
  "abdomen",
  "groin_fold",
  "vulvar_opening",
  "scrotal_skin",
  "inside_testicle",
  "buttock_skin",
  "natal_cleft",
  "perianal",
  "wrist_hand",
  "arms",
  "thighs_legs",
  "knees",
  "ankles_feet",
] as const;

export type BodyRegionId = (typeof BODY_REGION_IDS)[number];

export type BodyOrientation = "front" | "back";

export type AtlasRegion = {
  id: BodyRegionId;
  label: string;
  shortLabel: string;
  side: BodyOrientation | "both";
  position: readonly [number, number, number];
  cameraTargetY: number;
};

export const CUTAWAY_SCENE_IDS = [
  "ingrown_hair",
  "folliculitis",
  "boil_abscess",
  "skin_abscess",
  "epidermoid_cyst",
  "pilonidal_disease",
  "hidradenitis_suppurativa",
  "ganglion_cyst",
] as const;

export type CutawaySceneId = (typeof CUTAWAY_SCENE_IDS)[number];

export type CutawayStage = 0 | 1 | 2;

export type CutawaySceneDefinition = {
  id: CutawaySceneId;
  title: string;
  accent: string;
  stageLabels: readonly [string, string, string];
  stageDescriptions: readonly [string, string, string];
};

export const CUTAWAY_SCENES: Record<CutawaySceneId, CutawaySceneDefinition> = {
  ingrown_hair: {
    id: "ingrown_hair",
    title: "Ingrown hair",
    accent: "#79d7ca",
    stageLabels: ["Normal follicle", "Hair curves inward", "Local irritation"],
    stageDescriptions: [
      "A hair exits through the follicle opening.",
      "The hair tip curves back toward the skin.",
      "The nearby tissue becomes locally inflamed.",
    ],
  },
  folliculitis: {
    id: "folliculitis",
    title: "Folliculitis",
    accent: "#f2b46f",
    stageLabels: ["Normal follicle", "Follicle irritation", "Inflamed follicle"],
    stageDescriptions: [
      "A hair sits inside an open follicle.",
      "Inflammation begins around the follicle wall.",
      "The inflammation remains centered on the follicle.",
    ],
  },
  boil_abscess: {
    id: "boil_abscess",
    title: "Boil / skin abscess",
    accent: "#ef856f",
    stageLabels: ["Normal skin", "Tender pocket forms", "Established pocket"],
    stageDescriptions: [
      "Skin layers and a follicle are shown in section.",
      "A localized inflamed pocket begins beneath the surface.",
      "The pocket enlarges and may require clinical assessment.",
    ],
  },
  skin_abscess: {
    id: "skin_abscess",
    title: "Skin abscess",
    accent: "#ef856f",
    stageLabels: ["Normal skin", "Pocket forms", "Established abscess"],
    stageDescriptions: [
      "Skin layers are shown in section.",
      "A localized inflamed pocket begins beneath the surface.",
      "The pocket expands within the tissue.",
    ],
  },
  epidermoid_cyst: {
    id: "epidermoid_cyst",
    title: "Epidermoid cyst",
    accent: "#cbb8ee",
    stageLabels: ["Normal skin", "Small enclosed sac", "Established cyst"],
    stageDescriptions: [
      "The epidermis and deeper tissue are shown in section.",
      "A walled sac develops below the surface.",
      "The sac contains layered keratin material.",
    ],
  },
  pilonidal_disease: {
    id: "pilonidal_disease",
    title: "Pilonidal disease",
    accent: "#e7af6d",
    stageLabels: ["Normal natal cleft", "Pit + sinus", "Inflamed disease"],
    stageDescriptions: [
      "The cleft is shown with intact skin.",
      "Loose hairs enter a pit and a sinus tract forms.",
      "The tract and surrounding tissue become inflamed.",
    ],
  },
  hidradenitis_suppurativa: {
    id: "hidradenitis_suppurativa",
    title: "Hidradenitis suppurativa",
    accent: "#d98b9f",
    stageLabels: ["Fold anatomy", "Deep nodule", "Tunnels + scarring"],
    stageDescriptions: [
      "Hair-bearing fold skin is shown in section.",
      "A deep inflamed nodule forms.",
      "More than one nodule may connect beneath the skin.",
    ],
  },
  ganglion_cyst: {
    id: "ganglion_cyst",
    title: "Ganglion cyst",
    accent: "#7fc8e6",
    stageLabels: ["Joint + tendon sheath", "Small fluid sac", "Visible ganglion"],
    stageDescriptions: [
      "A wrist joint and tendon sheath are shown schematically.",
      "A fluid-filled sac begins beside the joint.",
      "A stalk connects the rounded sac to the joint or sheath.",
    ],
  },
};

export type SceneStatus = "checking" | "loading" | "ready" | "fallback";
