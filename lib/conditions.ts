export const CONDITION_IDS = [
  "epidermoid-cyst",
  "folliculitis",
  "ingrown-hair",
  "boil-carbuncle",
  "skin-abscess",
  "pilonidal-disease",
  "hidradenitis-suppurativa",
  "perianal-abscess-fistula",
  "bartholin-cyst-abscess",
  "ganglion-cyst",
  "acne-nodule-cyst",
  "lipoma",
  "swollen-lymph-node",
  "hemorrhoid",
] as const;

export type ConditionId = (typeof CONDITION_IDS)[number];

export type SceneTemplate =
  | "epidermoid"
  | "follicle"
  | "ingrown_hair"
  | "abscess"
  | "pilonidal"
  | "hs_tunnels"
  | "perianal_schematic"
  | "bartholin_schematic"
  | "ganglion"
  | "acne"
  | "subcutaneous_mass"
  | "lymph_node"
  | "anal_vascular_schematic";

export interface ConditionRecord {
  id: ConditionId;
  name: string;
  aliases: string[];
  isActuallyACyst: boolean;
  oneLineDefinition: string;
  bodyRegions: string[];
  tissueOrigin: string;
  typicalPattern: string[];
  importantDistinctions: string[];
  possibleRiskFactors: string[];
  careOverview: string[];
  riskReduction: string[];
  doNot: string[];
  urgencyNotes: string[];
  sourceUrls: string[];
  lastReviewed: string;
  scene3d: {
    template: SceneTemplate;
    stageLabels: [string, string, string];
    accentColor: string;
  };
}

export const MEDICAL_CONTENT_LAST_REVIEWED = "2026-07-21";

export const MEDICAL_REVIEW_NOTICE =
  "Medical content should be reviewed by a licensed clinician before real-world clinical use.";

export const ATLAS_SCOPE_NOTE =
  "Why this atlas is focused: LumpMap 3D covers common visible or palpable superficial lumps. Internal-organ cysts, including ovarian, kidney, liver, pancreatic, and brain cysts, require a different kind of medical product and often imaging.";

const reviewed = MEDICAL_CONTENT_LAST_REVIEWED;

/**
 * Curated product content. Components should render medical statements from
 * these records instead of composing new claims or asking a model to do so.
 */
export const CONDITIONS: ConditionRecord[] = [
  {
    id: "epidermoid-cyst",
    name: "Epidermoid cyst",
    aliases: ["epidermal inclusion cyst", "epidermal cyst", "skin cyst"],
    isActuallyACyst: true,
    oneLineDefinition:
      "A usually slow-growing sac beneath the skin filled with keratin; it is often imprecisely called a “sebaceous cyst.”",
    bodyRegions: [
      "scalp_face",
      "neck",
      "chest_back",
      "abdomen",
      "buttock_skin",
      "natal_cleft",
      "scrotal_skin",
      "limb_other",
      "wrist_hand",
    ],
    tissueOrigin:
      "Surface skin cells form a sac in the skin rather than shedding normally at the surface.",
    typicalPattern: [
      "Often a round bump just beneath the skin that grows slowly.",
      "May have a small central opening and can become tender or inflamed.",
      "Can occur on the face, neck, and trunk, as well as other skin sites.",
    ],
    importantDistinctions: [
      "It is not the same thing as a boil or a pus-filled skin abscess.",
      "A red, hot, rapidly worsening, or draining lump needs assessment for inflammation or infection.",
      "A hard, fixed, steadily growing, or otherwise unexplained lump should not be assumed to be a cyst.",
    ],
    possibleRiskFactors: [
      "Damage or irritation involving a hair follicle or the skin surface.",
      "Some inherited conditions can be associated with multiple cysts, but most people do not have one.",
    ],
    careOverview: [
      "A small, comfortable, unchanged cyst may only need observation after its nature is clear.",
      "A clinician may discuss treatment if it is painful, inflamed, infected, repeatedly troublesome, or unwanted.",
      "Removing the intact cyst wall is different from simply emptying its contents; a clinician can explain options.",
    ],
    riskReduction: [
      "Reduce repeated rubbing or picking at the area.",
      "Monitor for a change in size, pain, warmth, redness, or drainage.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or try to empty it yourself.",
      "Do not assume every long-standing lump is harmless without assessment if it changes.",
    ],
    urgencyNotes: [
      "Contact a clinician sooner if the lump becomes painful, hot, red, rapidly larger, or starts draining.",
      "Arrange an appointment for a persistent, hard, fixed, steadily growing, or unexplained lump.",
    ],
    sourceUrls: [
      "https://www.mayoclinic.org/diseases-conditions/epidermoid-cysts/symptoms-causes/syc-20352701",
    ],
    lastReviewed: reviewed,
    scene3d: {
      template: "epidermoid",
      stageLabels: ["Normal skin", "Cyst wall forms", "Keratin-filled sac"],
      accentColor: "#b9a9e8",
    },
  },
  {
    id: "folliculitis",
    name: "Folliculitis",
    aliases: ["inflamed hair follicles", "follicle rash"],
    isActuallyACyst: false,
    oneLineDefinition:
      "Inflammation around one or more hair follicles that can look like small acne-like bumps.",
    bodyRegions: [
      "scalp_face",
      "neck",
      "armpit",
      "chest_back",
      "groin_fold",
      "vulvar_opening",
      "scrotal_skin",
      "buttock_skin",
      "natal_cleft",
      "limb_other",
    ],
    tissueOrigin:
      "The inflammation is centred on a hair follicle near the skin surface.",
    typicalPattern: [
      "Small bumps or pustules arranged around hair follicles.",
      "The area may itch, feel tender, or burn.",
      "Several follicles can be involved at the same time.",
    ],
    importantDistinctions: [
      "Folliculitis is usually more superficial and follicle-centred than a deep abscess.",
      "A larger, deeper, increasingly painful pus-filled lump may fit a boil or abscess pattern instead.",
      "Repeated deep lumps with tunnels or scarring in folds raise a different pattern, including HS.",
    ],
    possibleRiskFactors: [
      "Shaving, waxing, friction, tight clothing, or occlusion around hair follicles.",
      "Microbes, irritation, and some skin or health conditions can contribute.",
    ],
    careOverview: [
      "Mild cases may settle when irritation and friction stop, but the right care depends on the cause.",
      "A clinician can assess persistent, spreading, recurrent, or painful disease and whether testing or treatment is needed.",
    ],
    riskReduction: [
      "Pause irritating hair removal and reduce rubbing while the skin settles.",
      "Use clean hair-removal equipment and avoid sharing personal grooming items.",
      "Choose breathable, less restrictive clothing where friction is a problem.",
    ],
    doNot: [
      "Do not pick, squeeze, pierce, or cut the bumps.",
      "Do not keep shaving directly over inflamed skin.",
    ],
    urgencyNotes: [
      "Seek timely care if redness is spreading, pain or swelling is worsening, fever develops, or you feel unwell.",
      "Discuss recurrent episodes or any tunnels and scars with a clinician.",
    ],
    sourceUrls: ["https://www.aad.org/public/diseases/a-z/folliculitis"],
    lastReviewed: reviewed,
    scene3d: {
      template: "follicle",
      stageLabels: ["Normal follicle", "Follicle irritation", "Inflamed follicle"],
      accentColor: "#61d4ca",
    },
  },
  {
    id: "ingrown-hair",
    name: "Ingrown hair",
    aliases: ["pseudofolliculitis", "razor bump", "shaving bump"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A hair that curves or grows back into the skin, producing a small local bump and inflammation.",
    bodyRegions: [
      "scalp_face",
      "neck",
      "armpit",
      "groin_fold",
      "vulvar_opening",
      "scrotal_skin",
      "buttock_skin",
      "limb_other",
    ],
    tissueOrigin:
      "A cut or emerging hair enters nearby skin instead of growing freely away from the surface.",
    typicalPattern: [
      "A small bump close to a visible or recently removed hair.",
      "It may be itchy, tender, red or darker than nearby skin, and sometimes contain a little pus.",
      "It often follows shaving, waxing, or other hair removal.",
    ],
    importantDistinctions: [
      "An ingrown hair is not a cyst.",
      "Increasing heat, spreading redness, marked pain, or a growing pus pocket can indicate a more significant infection pattern.",
    ],
    possibleRiskFactors: [
      "Close shaving, waxing, plucking, and repeated friction.",
      "Coarse or tightly curled hair is more likely to curve back into skin.",
    ],
    careOverview: [
      "Reducing further hair removal and friction can let a mild bump settle.",
      "A clinician can help if it is very painful, infected-looking, recurrent, or leaving significant marks.",
    ],
    riskReduction: [
      "Avoid an excessively close shave and use clean equipment with the direction of hair growth.",
      "Reduce repeated friction and give irritated skin time to recover.",
    ],
    doNot: [
      "Do not dig for the hair, squeeze the bump, pierce it, or cut the skin.",
    ],
    urgencyNotes: [
      "Contact a clinician if pain, warmth, swelling, drainage, or redness is worsening or spreading.",
      "Fever or feeling unwell with an inflamed lump needs urgent assessment.",
    ],
    sourceUrls: ["https://www.healthdirect.gov.au/ingrown-hair"],
    lastReviewed: reviewed,
    scene3d: {
      template: "ingrown_hair",
      stageLabels: ["Hair grows outward", "Hair curves inward", "Local inflammation"],
      accentColor: "#55c7bd",
    },
  },
  {
    id: "boil-carbuncle",
    name: "Boil (furuncle) & carbuncle",
    aliases: ["furuncle", "carbuncle", "boil"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A boil is a painful pus-filled infection around a hair follicle; a carbuncle is a connected group of boils.",
    bodyRegions: [
      "scalp_face",
      "neck",
      "armpit",
      "chest_back",
      "groin_fold",
      "buttock_skin",
      "natal_cleft",
      "limb_other",
    ],
    tissueOrigin:
      "Infection extends from a hair follicle into nearby skin; grouped connected boils form a carbuncle.",
    typicalPattern: [
      "Often begins as an itchy or tender spot and becomes a firm, painful lump.",
      "It may develop a pus-filled centre or drain.",
      "Several joined boils are called a carbuncle.",
    ],
    importantDistinctions: [
      "A boil is an infection, not an epidermoid cyst.",
      "Repeated boil-like lumps in armpits, groin, under breasts, or around the buttocks can reflect HS rather than isolated boils.",
    ],
    possibleRiskFactors: [
      "Skin conditions or breaks that make it easier for microbes to enter.",
      "Diabetes, a weakened immune system, and close contact with someone who has boils can increase risk.",
    ],
    careOverview: [
      "Some small boils settle, while a clinician may need to drain a larger or persistent pus collection.",
      "Antibiotics may be used in some cases, but they do not replace drainage whenever drainage is needed.",
      "Recurrent boils or a carbuncle should be clinically assessed.",
    ],
    riskReduction: [
      "Keep draining areas covered with a clean dressing and wash hands after touching the dressing.",
      "Avoid sharing towels and personal items while a boil is active.",
    ],
    doNot: [
      "Do not pick, squeeze, pierce, cut, or try to drain a boil yourself.",
    ],
    urgencyNotes: [
      "Seek same-day advice for a painful hot swelling, spreading redness, fever or chills, a facial boil, or infection signs with diabetes or weakened immunity.",
      "Arrange an appointment if it persists for around two weeks or keeps returning.",
    ],
    sourceUrls: ["https://www.nhs.uk/conditions/boils/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "abscess",
      stageLabels: ["Normal follicle", "Deep follicle infection", "Boil or connected carbuncle"],
      accentColor: "#f0a66f",
    },
  },
  {
    id: "skin-abscess",
    name: "Skin abscess",
    aliases: ["cutaneous abscess", "pus pocket"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A painful lump or swelling in the skin that contains pus and may require clinician drainage.",
    bodyRegions: [
      "scalp_face",
      "neck",
      "armpit",
      "chest_back",
      "abdomen",
      "groin_fold",
      "vulvar_opening",
      "buttock_skin",
      "natal_cleft",
      "perianal",
      "limb_other",
    ],
    tissueOrigin:
      "A localized pus collection forms within skin or nearby soft tissue, often after microbes enter through a break or follicle.",
    typicalPattern: [
      "A round or localized swelling that is often painful and warm.",
      "The centre may feel softer, pus may drain, and fever can occur.",
      "Redness can be less obvious on brown or black skin, so warmth, pain, swelling, and change also matter.",
    ],
    importantDistinctions: [
      "An abscess is a pus collection, not simply another name for a cyst.",
      "An abscess beside the anus, near the eye or central face, or at a genital opening follows a more urgent location pathway.",
    ],
    possibleRiskFactors: [
      "A break in the skin or entry through a hair follicle.",
      "Diabetes, weakened immunity, and inflammatory skin conditions can increase risk.",
    ],
    careOverview: [
      "Some small abscesses settle, but others require a clinician to drain the pus.",
      "A clinician decides whether antibiotics are also appropriate; antibiotics alone do not always resolve a drainable abscess.",
    ],
    riskReduction: [
      "Protect broken skin, wash hands, and keep any spontaneous drainage covered with a clean dressing.",
      "Seek care early when symptoms are spreading or health conditions increase infection risk.",
    ],
    doNot: [
      "Do not squeeze, pop, pierce, cut, or attempt to drain an abscess yourself.",
    ],
    urgencyNotes: [
      "Fever or chills with a painful, hot, red, or draining lump needs same-day assessment.",
      "Rapid worsening, spreading redness, severe pain, high-risk locations, or signs of serious illness require urgent care.",
    ],
    sourceUrls: ["https://www.nhs.uk/conditions/skin-abscess/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "abscess",
      stageLabels: ["Normal skin", "Local inflammation", "Pus pocket"],
      accentColor: "#ef806f",
    },
  },
  {
    id: "pilonidal-disease",
    name: "Pilonidal disease",
    aliases: ["pilonidal sinus", "pilonidal pit", "pilonidal abscess"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A pit or tunnel at the top of the buttock cleft that can contain hair and may become inflamed or form an abscess.",
    bodyRegions: ["natal_cleft"],
    tissueOrigin:
      "A small opening and sinus tract develop in the natal cleft; loose or inward-pushed hair can collect in the tract.",
    typicalPattern: [
      "A small pit, opening, tender lump, or drainage at the top of the buttock cleft.",
      "Infection can cause pain and swelling over a few days, sometimes with pus or blood.",
      "Some people have repeated discomfort or drainage, while an uninfected sinus may cause no symptoms.",
    ],
    importantDistinctions: [
      "The exact top-of-cleft location and a pit or sinus distinguish the pattern from a bump on buttock skin away from the cleft.",
      "The condition is not caused by poor hygiene, and prolonged sitting is not its sole cause.",
      "Possible progression is not a prediction: a pit does not inevitably become an abscess.",
    ],
    possibleRiskFactors: [
      "Hair, pressure, friction, individual susceptibility, and prolonged sitting can contribute.",
      "No single risk factor fully explains why it occurs.",
    ],
    careOverview: [
      "An uninfected sinus may be monitored after clinical advice.",
      "A painful swollen pilonidal abscess often needs clinician drainage and sometimes additional treatment.",
      "Repeatedly painful or draining disease may have procedural or surgical options that a clinician can discuss.",
    ],
    riskReduction: [
      "Keep the cleft clean and dry and reduce prolonged pressure or friction where practical.",
      "Ask a clinician before shaving an affected cleft; hair-management advice should be individualized.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or try to drain the pit or lump yourself.",
      "Do not assume sitting alone caused it or that avoiding sitting guarantees prevention.",
    ],
    urgencyNotes: [
      "A painful, bleeding, or pus-draining lump at the top of the cleft needs prompt clinical advice.",
      "Fever, rapidly worsening swelling, spreading redness, or feeling unwell increases urgency.",
    ],
    sourceUrls: ["https://www.nhs.uk/conditions/pilonidal-sinus/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "pilonidal",
      stageLabels: ["Normal cleft", "Pit + sinus", "Inflamed disease"],
      accentColor: "#e2aa68",
    },
  },
  {
    id: "hidradenitis-suppurativa",
    name: "Hidradenitis suppurativa (HS)",
    aliases: ["HS", "acne inversa"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A long-term inflammatory skin condition that can cause repeated painful lumps, abscess-like lesions, drainage, tunnels, and scarring in skin folds.",
    bodyRegions: ["armpit", "groin_fold", "buttock_skin", "chest_back"],
    tissueOrigin:
      "Inflammation develops around hair follicles in characteristic fold areas and can extend into tunnels beneath the skin.",
    typicalPattern: [
      "Repeated painful boil-like lumps in armpits, groin, under breasts, or around the buttocks.",
      "Several lesions, repeated drainage, narrow channels under the skin, and scars can occur.",
      "Episodes may recur in the same areas over time.",
    ],
    importantDistinctions: [
      "HS is not caused by poor hygiene and is not simply a one-off infection.",
      "It can resemble repeated boils; recurrence in folds with tunnels or scarring is an important pattern to flag.",
      "HS is not contagious.",
    ],
    possibleRiskFactors: [
      "The exact cause is not known; individual biology, smoking, and body weight can influence risk or severity.",
      "Friction can aggravate symptoms but is not the sole cause.",
    ],
    careOverview: [
      "Early clinical assessment can help distinguish HS from isolated boils and plan long-term care.",
      "Care is individualized and may include skin care, medicines, or procedures; the app does not prescribe treatment.",
    ],
    riskReduction: [
      "Reduce rubbing, pressure, and skin injury in affected folds where practical.",
      "Choose breathable clothing and discuss smoking or weight support without blame if relevant.",
      "Track recurrence, drainage, tunnels, and scarring for a clinician visit.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or attempt to drain lesions yourself.",
      "Do not blame hygiene or repeatedly scrub painful skin.",
    ],
    urgencyNotes: [
      "Arrange a clinician appointment for recurrent lumps, drainage, tunnels, or scarring.",
      "Fever, rapidly spreading inflammation, severe pain, or feeling very unwell needs more urgent assessment.",
    ],
    sourceUrls: [
      "https://www.nhs.uk/conditions/hidradenitis-suppurativa/",
    ],
    lastReviewed: reviewed,
    scene3d: {
      template: "hs_tunnels",
      stageLabels: ["Normal fold skin", "Inflamed nodules", "Tunnels + scarring"],
      accentColor: "#ca8dc9",
    },
  },
  {
    id: "perianal-abscess-fistula",
    name: "Perianal abscess & anal fistula",
    aliases: ["anal abscess", "perianal abscess", "anal fistula"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A perianal abscess is an infected pus collection near the anus; a fistula is an abnormal channel that can remain between the anal canal and skin.",
    bodyRegions: ["perianal"],
    tissueOrigin:
      "Infection can begin in a small anal gland and create a pus pocket; a channel may persist after drainage.",
    typicalPattern: [
      "Painful swelling directly beside the anus, often with worsening pain.",
      "Fever, pus or blood drainage, or feeling unwell may occur.",
      "Repeated drainage from a nearby opening can fit a fistula pattern.",
    ],
    importantDistinctions: [
      "This higher-risk location is different from the top of the buttock cleft, where pilonidal disease occurs.",
      "A hemorrhoid is swollen vascular tissue at or inside the anus; a hot, very painful, fever-associated swelling beside it needs abscess assessment.",
    ],
    possibleRiskFactors: [
      "Blockage and infection of an anal gland.",
      "Some bowel or inflammatory conditions can be associated, but the app cannot determine the cause.",
    ],
    careOverview: [
      "A suspected perianal abscess needs same-day clinical assessment and commonly requires clinician drainage.",
      "A persistent fistula usually needs specialist evaluation; antibiotics alone do not reliably remove a drainable abscess or established tract.",
    ],
    riskReduction: [
      "There is no guaranteed prevention; seek care early for pain, swelling, drainage, or fever in this location.",
      "Keep the area gently clean without harsh scrubbing while arranging care.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or try to drain a perianal lump yourself.",
      "Do not delay assessment because the lump was initially assumed to be a hemorrhoid.",
    ],
    urgencyNotes: [
      "A painful lump or swelling directly beside the anus needs same-day urgent assessment, especially with fever, drainage, or worsening pain.",
      "Severe or rapidly worsening symptoms, confusion, faintness, or feeling very unwell may require emergency care.",
    ],
    sourceUrls: [
      "https://generalsurgery.ucsf.edu/condition/perianal-and-perirectal-abscessfistula",
    ],
    lastReviewed: reviewed,
    scene3d: {
      template: "perianal_schematic",
      stageLabels: ["Normal glands", "Localized abscess", "Possible fistula tract"],
      accentColor: "#ef806f",
    },
  },
  {
    id: "bartholin-cyst-abscess",
    name: "Bartholin duct cyst & abscess",
    aliases: ["Bartholin cyst", "Bartholin abscess"],
    isActuallyACyst: true,
    oneLineDefinition:
      "A blocked Bartholin duct can form a fluid-filled lump near one side of the vulvar opening; infection can turn it into a painful abscess.",
    bodyRegions: ["vulvar_opening"],
    tissueOrigin:
      "Fluid collects when the duct from a Bartholin gland near the vulvar opening is blocked; infection can create an abscess.",
    typicalPattern: [
      "A lump near one side of the vulvar opening, which may be painless when small.",
      "An abscess can become very painful, swollen, hot, or make sitting and walking difficult.",
    ],
    importantDistinctions: [
      "The gland location is near the opening, unlike folliculitis or an ingrown hair on outer hair-bearing skin.",
      "A new Bartholin-area lump at age 40 or older needs prompt clinical assessment.",
    ],
    possibleRiskFactors: [
      "Blockage of the gland duct; infection can then develop.",
      "The app cannot determine why a duct became blocked.",
    ],
    careOverview: [
      "A painless small lump still deserves assessment if it persists or if its identity is unclear.",
      "A painful abscess may require clinician drainage and other treatment chosen after assessment.",
    ],
    riskReduction: [
      "There is no guaranteed way to prevent a blocked duct.",
      "Seek timely care when pain, heat, swelling, fever, or rapid worsening develops.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or try to drain the lump yourself.",
      "Do not submit an intimate photo; the guided flow does not use photo classification.",
    ],
    urgencyNotes: [
      "A severely painful or rapidly worsening swelling near the vulvar opening needs same-day assessment.",
      "A new Bartholin-area lump at age 40 or older needs a prompt clinician appointment even if it is not painful.",
    ],
    sourceUrls: ["https://www.nhs.uk/conditions/bartholins-cyst/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "bartholin_schematic",
      stageLabels: ["Open duct", "Blocked duct", "Inflamed abscess"],
      accentColor: "#d4a3cf",
    },
  },
  {
    id: "ganglion-cyst",
    name: "Ganglion cyst",
    aliases: ["wrist ganglion", "hand ganglion"],
    isActuallyACyst: true,
    oneLineDefinition:
      "A noncancerous fluid-filled lump that most often develops near a wrist or hand joint or tendon.",
    bodyRegions: ["wrist_hand", "limb_other"],
    tissueOrigin:
      "A fluid-filled sac forms next to a joint or tendon sheath and can connect through a small stalk.",
    typicalPattern: [
      "A smooth round or oval lump near a wrist or hand joint or tendon.",
      "Its size may change and it can be painless or ache with joint movement.",
    ],
    importantDistinctions: [
      "It arises from joint or tendon-sheath structures rather than a hair follicle.",
      "Not every wrist or hand mass is a ganglion; unexplained, hard, fixed, or growing masses need assessment.",
    ],
    possibleRiskFactors: [
      "Joint or tendon irritation may be associated, but a clear cause is often not known.",
      "Ganglia are more common around particular wrist and hand joints.",
    ],
    careOverview: [
      "A painless confirmed ganglion may only be monitored.",
      "A clinician can discuss options if it causes pain, limits movement, presses on a nerve, or remains uncertain.",
    ],
    riskReduction: [
      "There is no guaranteed prevention; avoid repeatedly aggravating a painful joint area while seeking advice.",
      "Monitor changes in size, pain, sensation, or movement.",
    ],
    doNot: [
      "Do not hit, crush, puncture, cut, or try to drain a wrist lump.",
    ],
    urgencyNotes: [
      "Arrange assessment if the diagnosis is uncertain, the lump is persistent or growing, or pain, weakness, numbness, or movement problems occur.",
    ],
    sourceUrls: [
      "https://www.mayoclinic.org/diseases-conditions/ganglion-cyst/symptoms-causes/syc-20351156",
    ],
    lastReviewed: reviewed,
    scene3d: {
      template: "ganglion",
      stageLabels: ["Joint + tendon", "Fluid sac begins", "Ganglion + stalk"],
      accentColor: "#8eb9df",
    },
  },
  {
    id: "acne-nodule-cyst",
    name: "Acne nodule or acne cyst",
    aliases: ["nodular acne", "cystic acne", "deep acne lesion"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A deep inflammatory acne lesion caused by a blocked follicular unit; nodules are firm while some lesions described as acne cysts contain fluid.",
    bodyRegions: ["scalp_face", "neck", "chest_back"],
    tissueOrigin:
      "Oil, shed cells, inflammation, and microbes interact within a blocked hair follicle and can produce a deep lesion.",
    typicalPattern: [
      "Deep, tender bumps on acne-prone areas such as the face, chest, shoulders, or back.",
      "Several acne lesion types may be present, and deep lesions can leave marks or scars.",
    ],
    importantDistinctions: [
      "An acne nodule is solid inflammation and is not an epidermoid cyst.",
      "A single rapidly enlarging hot lump with pus or fever needs assessment for an abscess pattern rather than being assumed to be acne.",
    ],
    possibleRiskFactors: [
      "Blocked follicles, oil production, inflammation, microbes, and hormonal influences all play roles.",
      "Oily or occlusive products and friction can aggravate acne in some people.",
    ],
    careOverview: [
      "Deep, painful, persistent, or scarring acne is worth discussing with a clinician or dermatologist.",
      "Treatment depends on the pattern and person; this atlas does not recommend medicines or doses.",
    ],
    riskReduction: [
      "Use gentle skin care and choose products labelled non-comedogenic when practical.",
      "Seek help early for deep lesions or scarring rather than repeatedly manipulating them.",
    ],
    doNot: [
      "Do not squeeze, pierce, or cut deep acne lesions.",
      "Do not scrub aggressively; irritation can make skin feel worse.",
    ],
    urgencyNotes: [
      "A painful swelling near the eye or central face, spreading redness, fever, or rapid worsening needs same-day assessment.",
      "Arrange routine care for persistent deep lesions or scarring.",
    ],
    sourceUrls: ["https://www.niams.nih.gov/health-topics/acne"],
    lastReviewed: reviewed,
    scene3d: {
      template: "acne",
      stageLabels: ["Open follicle", "Blocked follicle", "Solid acne nodule shown"],
      accentColor: "#cf8fa2",
    },
  },
  {
    id: "lipoma",
    name: "Lipoma — not a cyst",
    aliases: ["fatty lump", "fatty tumor"],
    isActuallyACyst: false,
    oneLineDefinition:
      "A usually harmless, slow-growing lump made of fat beneath the skin—not a cyst.",
    bodyRegions: ["neck", "chest_back", "abdomen", "limb_other", "buttock_skin"],
    tissueOrigin:
      "A localized growth of mature fat cells develops in the subcutaneous layer.",
    typicalPattern: [
      "Usually soft or rubbery, slow-growing, and easy to move a little under the skin.",
      "Often painless, although location or size can sometimes cause discomfort.",
    ],
    importantDistinctions: [
      "A lipoma is solid fatty tissue, not a fluid- or keratin-filled cyst.",
      "A hard, fixed, painful, rapidly growing, deep, or otherwise changing mass should not be labelled a lipoma without assessment.",
    ],
    possibleRiskFactors: [
      "The cause is often unclear, and some people have a family tendency.",
    ],
    careOverview: [
      "A clinician can confirm whether a lump has a typical lipoma pattern and whether imaging or other evaluation is needed.",
      "A confirmed lipoma may be observed or removed if troublesome; options depend on the individual case.",
    ],
    riskReduction: [
      "There is no proven way to prevent most lipomas.",
      "Track meaningful changes rather than repeatedly pressing or manipulating the lump.",
    ],
    doNot: [
      "Do not cut, puncture, squeeze, or attempt to remove a fatty lump yourself.",
      "Do not assume a deep or changing lump is a lipoma based on feel alone.",
    ],
    urgencyNotes: [
      "Arrange a clinician appointment for a new, unexplained, hard, fixed, deep, painful, or steadily growing lump.",
    ],
    sourceUrls: [
      "https://www.mayoclinic.org/diseases-conditions/lipoma/symptoms-causes/syc-20374470",
    ],
    lastReviewed: reviewed,
    scene3d: {
      template: "subcutaneous_mass",
      stageLabels: ["Normal fat layer", "Small fatty lump", "Defined lipoma"],
      accentColor: "#e2c16f",
    },
  },
  {
    id: "swollen-lymph-node",
    name: "Swollen lymph node — not a cyst",
    aliases: ["swollen gland", "lymph gland", "lymph node lump"],
    isActuallyACyst: false,
    oneLineDefinition:
      "An enlarged immune-system node beneath the skin—not a cyst—often noticed in the neck, armpit, or groin.",
    bodyRegions: ["neck", "armpit", "groin_fold"],
    tissueOrigin:
      "A lymph node within the immune and lymphatic system enlarges, commonly while responding to nearby illness or inflammation.",
    typicalPattern: [
      "One or more lumps beneath the skin in the neck, armpit, or groin.",
      "Nodes can feel tender during an infection and may settle as the trigger improves.",
    ],
    importantDistinctions: [
      "A lymph node is an anatomical immune structure, not a skin cyst or hair-follicle bump.",
      "A hard, fixed, enlarging, persistent, or unexplained node needs clinical assessment.",
    ],
    possibleRiskFactors: [
      "Nearby infections are a common reason for nodes to swell.",
      "Other inflammatory or less common causes exist and cannot be distinguished by the app.",
    ],
    careOverview: [
      "A clinician may examine the lump and nearby areas and decide whether observation, tests, or imaging are appropriate.",
      "The cause, duration, location, and other symptoms guide that decision.",
    ],
    riskReduction: [
      "There is no single prevention method because many different conditions can cause nodes to enlarge.",
      "Note duration, growth, tenderness, and associated illness for a clinician visit.",
    ],
    doNot: [
      "Do not squeeze, puncture, cut, or repeatedly manipulate the lump.",
      "Do not assume every armpit or groin lump is a swollen node.",
    ],
    urgencyNotes: [
      "Arrange an appointment if the lump is hard, fixed, growing, unexplained, or not improving over roughly two weeks.",
      "Trouble breathing or swallowing, severe illness, or rapid worsening needs urgent care.",
    ],
    sourceUrls: ["https://www.nhs.uk/symptoms/swollen-glands/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "lymph_node",
      stageLabels: ["Normal node", "Reactive enlargement", "Still enlarged over time"],
      accentColor: "#99bcae",
    },
  },
  {
    id: "hemorrhoid",
    name: "Hemorrhoid — comparison only",
    aliases: ["haemorrhoid", "pile", "piles"],
    isActuallyACyst: false,
    oneLineDefinition:
      "Swollen vascular tissue in or around the anus—not a cyst—shown only to clarify a commonly confused location.",
    bodyRegions: ["perianal"],
    tissueOrigin:
      "Vascular cushions in the anal canal become enlarged or symptomatic.",
    typicalPattern: [
      "May cause a lump at the anus, itching, discomfort, or bright red bleeding.",
      "Symptoms vary, and other anal conditions can look or feel similar.",
    ],
    importantDistinctions: [
      "A hemorrhoid is swollen vascular tissue, not a cyst or pus pocket.",
      "Severe or worsening pain and swelling beside the anus, especially with fever or drainage, must be assessed for a perianal abscess rather than assumed to be hemorrhoids.",
      "Bleeding should not automatically be attributed to hemorrhoids without appropriate assessment.",
    ],
    possibleRiskFactors: [
      "Straining, constipation, pregnancy, and pressure on anal veins can contribute.",
    ],
    careOverview: [
      "This atlas provides comparison only; a clinician or pharmacist can advise on symptoms that fit a hemorrhoid pattern.",
      "Persistent symptoms, a new unexplained anal lump, or bleeding need appropriate clinical advice.",
    ],
    riskReduction: [
      "Avoid prolonged straining and support soft regular bowel movements through appropriate fluids, fibre, and activity when suitable for you.",
    ],
    doNot: [
      "Do not squeeze, pierce, cut, or attempt to drain an anal lump.",
      "Do not let a presumed hemorrhoid delay same-day care for painful swelling with fever, drainage, or worsening symptoms.",
    ],
    urgencyNotes: [
      "A painful swelling directly beside the anus needs same-day assessment, especially with fever, drainage, or worsening pain.",
      "Heavy or ongoing bleeding, faintness, or severe illness requires urgent medical care.",
    ],
    sourceUrls: ["https://www.nhs.uk/conditions/piles-haemorrhoids/"],
    lastReviewed: reviewed,
    scene3d: {
      template: "anal_vascular_schematic",
      stageLabels: ["Normal vascular cushion", "Swollen tissue", "Symptomatic hemorrhoid"],
      accentColor: "#b6a2ce",
    },
  },
];

export const conditions = CONDITIONS;

export const CONDITION_BY_ID = Object.fromEntries(
  CONDITIONS.map((condition) => [condition.id, condition]),
) as Record<ConditionId, ConditionRecord>;

export function getCondition(id: ConditionId): ConditionRecord {
  return CONDITION_BY_ID[id];
}

export function findCondition(idOrAlias: string): ConditionRecord | undefined {
  const query = idOrAlias.trim().toLocaleLowerCase();
  return CONDITIONS.find(
    (condition) =>
      condition.id === query ||
      condition.name.toLocaleLowerCase() === query ||
      condition.aliases.some(
        (alias) => alias.toLocaleLowerCase() === query,
      ),
  );
}
