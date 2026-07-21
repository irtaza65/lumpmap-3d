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
  "perianal_abscess_fistula",
  "bartholin_cyst_abscess",
  "acne_nodule_cyst",
  "lipoma",
  "swollen_lymph_node",
  "hemorrhoid",
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
    accent: "#147a78",
    stageLabels: ["Hair grows outward", "Hair curves inward", "Local inflammation"],
    stageDescriptions: [
      "A hair exits through the follicle opening.",
      "The hair tip curves back toward the skin.",
      "The nearby tissue becomes locally inflamed.",
    ],
  },
  folliculitis: {
    id: "folliculitis",
    title: "Folliculitis",
    accent: "#f57a00",
    stageLabels: ["Normal follicle", "Follicle irritation", "Inflamed follicle"],
    stageDescriptions: [
      "A hair sits inside an open follicle.",
      "Inflammation begins around the follicle wall.",
      "The inflammation remains centered on the follicle.",
    ],
  },
  boil_abscess: {
    id: "boil_abscess",
    title: "Boil (furuncle) & carbuncle",
    accent: "#df6547",
    stageLabels: ["Normal follicle", "Deep follicle infection", "Boil or connected carbuncle"],
    stageDescriptions: [
      "A hair and its follicle are shown within normal skin.",
      "A deep infection develops around one hair follicle.",
      "A primary boil may enlarge, and adjacent connected boil pockets form a carbuncle pattern.",
    ],
  },
  skin_abscess: {
    id: "skin_abscess",
    title: "Skin abscess",
    accent: "#df6547",
    stageLabels: ["Normal skin", "Local inflammation", "Pus pocket"],
    stageDescriptions: [
      "Skin layers are shown in section.",
      "A localized area of tissue becomes inflamed before a defined fluid pocket is shown.",
      "One localized pus pocket forms within the inflamed tissue.",
    ],
  },
  epidermoid_cyst: {
    id: "epidermoid_cyst",
    title: "Epidermoid cyst",
    accent: "#6e8ca8",
    stageLabels: ["Normal skin", "Cyst wall forms", "Keratin-filled sac"],
    stageDescriptions: [
      "The epidermis and deeper tissue are shown in section.",
      "A small walled sac develops below the surface without mature layered contents.",
      "The established sac contains layered keratin material.",
    ],
  },
  pilonidal_disease: {
    id: "pilonidal_disease",
    title: "Pilonidal disease",
    accent: "#f57a00",
    stageLabels: ["Normal cleft", "Pit + sinus", "Inflamed disease"],
    stageDescriptions: [
      "The cleft is shown with intact skin.",
      "Loose hairs enter a pit and a sinus tract forms.",
      "The tract and surrounding tissue become inflamed.",
    ],
  },
  hidradenitis_suppurativa: {
    id: "hidradenitis_suppurativa",
    title: "Hidradenitis suppurativa",
    accent: "#c96374",
    stageLabels: ["Normal fold skin", "Inflamed nodules", "Tunnels + scarring"],
    stageDescriptions: [
      "Hair-bearing fold skin is shown in section.",
      "A deep inflamed nodule forms.",
      "More than one nodule may connect beneath the skin.",
    ],
  },
  ganglion_cyst: {
    id: "ganglion_cyst",
    title: "Ganglion cyst",
    accent: "#147a78",
    stageLabels: ["Joint + tendon", "Fluid sac begins", "Ganglion + stalk"],
    stageDescriptions: [
      "A wrist joint and tendon sheath are shown schematically.",
      "A fluid-filled sac begins beside the joint.",
      "A stalk connects the rounded sac to the joint or sheath.",
    ],
  },
  perianal_abscess_fistula: {
    id: "perianal_abscess_fistula",
    title: "Perianal abscess / fistula",
    accent: "#d65f49",
    stageLabels: ["Normal glands", "Localized abscess", "Possible fistula tract"],
    stageDescriptions: [
      "Small glands beside the anal canal are shown schematically.",
      "A blocked gland develops a localized inflamed pocket beside the canal.",
      "A persistent channel may connect the canal or abscess to nearby skin.",
    ],
  },
  bartholin_cyst_abscess: {
    id: "bartholin_cyst_abscess",
    title: "Bartholin duct cyst / abscess",
    accent: "#a7689d",
    stageLabels: ["Open duct", "Blocked duct", "Inflamed abscess"],
    stageDescriptions: [
      "A Bartholin gland and its open duct are shown schematically near the vulvar opening.",
      "Fluid collects behind a blocked duct and forms a rounded cyst.",
      "The blocked gland and nearby tissue become inflamed.",
    ],
  },
  acne_nodule_cyst: {
    id: "acne_nodule_cyst",
    title: "Acne nodule / acne cyst",
    accent: "#c96374",
    stageLabels: ["Open follicle", "Blocked follicle", "Solid acne nodule shown"],
    stageDescriptions: [
      "Oil and shed cells can leave through an open follicle.",
      "A plug blocks the follicular opening and material collects within it.",
      "This scene depicts a deep solid inflammatory nodule; some lesions called acne cysts can instead contain fluid.",
    ],
  },
  lipoma: {
    id: "lipoma",
    title: "Lipoma — not a cyst",
    accent: "#c7962e",
    stageLabels: ["Normal fat layer", "Small fatty lump", "Defined lipoma"],
    stageDescriptions: [
      "Normal subcutaneous fat is shown beneath the skin.",
      "A localized cluster of mature fat cells begins to enlarge.",
      "A soft, lobulated fatty mass sits within the subcutaneous layer.",
    ],
  },
  swollen_lymph_node: {
    id: "swollen_lymph_node",
    title: "Swollen lymph node — not a cyst",
    accent: "#438879",
    stageLabels: ["Normal node", "Reactive enlargement", "Still enlarged over time"],
    stageDescriptions: [
      "A small lymph node and connecting lymphatic vessels are shown beneath the skin.",
      "The node enlarges while responding to nearby inflammation or illness.",
      "Persistence means the enlarged node remains over time; it does not imply further growth or a cyst-like change.",
    ],
  },
  hemorrhoid: {
    id: "hemorrhoid",
    title: "Hemorrhoid — comparison only",
    accent: "#80669c",
    stageLabels: ["Normal vascular cushion", "Swollen tissue", "Symptomatic hemorrhoid"],
    stageDescriptions: [
      "Normal vascular cushions are shown schematically at the anal canal.",
      "Vascular tissue becomes enlarged without forming a cyst or pus pocket.",
      "An enlarged cushion may protrude and cause local symptoms.",
    ],
  },
};

export type SceneStatus = "checking" | "loading" | "ready" | "fallback";
