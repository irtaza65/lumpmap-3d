# LumpMap 3D

> People use words like cyst, daana, phinsi, boil, and ingrown hair for very different problems. LumpMap 3D turns body location into an interactive anatomy lesson, uses OpenAI to understand everyday multilingual descriptions, and keeps medical safety deterministic. It does not diagnose; it helps people understand what may be happening beneath the skin, recognize red flags, and communicate clearly with a clinician.

LumpMap 3D is an anatomy-first educational navigator for common visible or palpable superficial lumps. It connects an interactive body map to clean, procedural beneath-the-skin scenes, then combines curated condition records with a deterministic care-navigation engine.

Medical content should be reviewed by a licensed clinician before real-world clinical use.

## OpenAI Build Week 2026

LumpMap 3D was created from an empty repository during the OpenAI Build Week
submission period on July 21, 2026. Codex with GPT-5.6 was the primary
implementation partner. The entrant set the product direction, medical-safety
boundary, scope, and design standard; Codex translated those decisions into the
working application, tests, procedural 3D scenes, and deployment package.

- **Track:** Apps for Your Life
- **Primary Codex build thread:** `019f83ba-d355-7490-a9b2-464a168f195b`
- **Public application:** [lumpmap3d.vercel.app](https://lumpmap3d.vercel.app/)
- **Build window evidence:** the repository's first commit and all subsequent
  implementation commits are dated July 21, 2026.

## How I collaborated with Codex and GPT-5.6

I brought the core problem from personal experience: people use the same casual
word, such as *cyst*, *daana*, *phinsi*, *phora*, or *gilti*, for lumps that can
begin in very different structures and require very different levels of care. I
made the central product decisions:

- teach anatomy and care navigation without claiming a diagnosis;
- focus on visible or palpable superficial lumps rather than internal-organ
  cysts;
- keep urgency deterministic so a language model can never lower a red-flag
  result;
- support everyday English, Urdu, and Roman Urdu without treating colloquial
  words as diagnoses;
- avoid photo diagnosis and intimate image uploads;
- connect a whole-body location map to condition-specific beneath-the-skin
  lessons; and
- use a calm, respectful, non-gory editorial design for sensitive health
  education.

Codex accelerated the work by scaffolding the Next.js application, turning the
medical-safety requirements into typed schemas and deterministic rules, creating
the reusable React Three Fiber scene system, implementing fourteen distinct
three-stage cutaways, and building the responsive interaction layer. It also
generated regression tests, exercised the app in a real browser at phone,
tablet, and desktop sizes, found safety and accessibility gaps, and iterated on
the implementation until lint, typecheck, tests, and the production build all
passed.

GPT-5.6 contributes in two ways. First, it powered the Codex implementation and
review workflow. Second, the running product uses the GPT-5.6 Responses API with
strict Structured Outputs to normalize an everyday multilingual description
into a fixed symptom record. GPT-5.6 is deliberately not allowed to diagnose,
choose urgency, invent treatments, or provide medical sources. Deterministic
local code performs triage, educational matching, care messaging, and Visit Note
generation.

### Key engineering and design decisions

1. **Two connected 3D scales.** A procedural body atlas answers "where is it?";
   a separate tissue cutaway answers "what can differ beneath the skin?"
2. **Model interpretation, rules-based safety.** Model output is parsed through
   a strict Zod schema and is structurally unable to set a care level.
3. **Explicit red-flag preservation.** Deterministic parsing protects critical
   facts even if a model extraction omits them.
4. **Curated content rather than generated medicine.** Fourteen typed condition
   records contain reviewed-at-source educational copy and visible URLs.
5. **Privacy by design.** There are no accounts, analytics, uploads, saved
   histories, or client-exposed API keys; Responses requests use `store: false`.
6. **Graceful no-key path.** Demo Mode and the complete guided flow remain usable
   without an API key while never inventing unmentioned facts.

### Build-period commit record

| Commit | Time (Pakistan) | Milestone |
| --- | --- | --- |
| `0035922` | 2026-07-21 14:03 | Initial working anatomy navigator |
| `d5864ea` | 2026-07-21 14:26 | Safety, privacy, and accessibility hardening |
| `140d1ac` | 2026-07-21 14:33 | Edge-safe request limiting |
| `6e0328f` | 2026-07-21 15:06 | Atlas and procedural anatomy redesign |
| `c6752e2` | 2026-07-21 15:53 | Guided safety-flow polish |
| `7ceacf4` | 2026-07-21 20:17 | Final editorial experience and distinct scenes |

## The problem

Everyday words such as *cyst*, *daana*, *phinsi*, *phora*, *gilti*, *boil*, and *ingrown hair* are non-specific. A location can narrow what is worth learning about, but it cannot identify a condition. Depth, duration, pain, heat, redness, recurrence, drainage, follicle relationship, and whole-body symptoms also matter.

LumpMap avoids presenting body location as a diagnostic lookup table. The UI consistently uses “Patterns worth learning about” and “Commonly confused in this area,” then shows the care level before any educational match.

## Strongest product moments

- A tactile procedural mannequin supports rotation, front/back focus, constrained zoom, keyboard-accessible region selection, readable hotspot clusters, reduced motion, and a WebGL fallback.
- Seven visually distinct three-stage cutaways cover ingrown hair, folliculitis, boil/skin abscess, epidermoid cyst, pilonidal disease, hidradenitis suppurativa, and ganglion cyst.
- Normal → early change → established condition transitions are explicitly labelled “Possible progression, not a prediction.”
- The comparison tray keeps the tissue scale consistent while explaining how similar surface lumps can begin in different structures.
- English, Urdu, Roman Urdu, and mixed-language descriptions become a strict structured symptom record; a full one-question-at-a-time path is available without an API key.
- A deterministic rules engine renders emergency, same-day, prompt-appointment, or lower-risk education before educational condition cards.
- The Visit Note contains only facts supplied by the user and never includes a diagnosis.

## Two connected 3D scales

### Scale A — body location map

`components/three/BodyAtlas.tsx` builds a gender-neutral frosted mannequin from procedural geometry. Regions can be selected through the model or through the accessible searchable region rail. Sensitive regions remain respectful and schematic.

### Scale B — tissue cutaway

`components/three/SkinCutaway.tsx` and `components/three/scenes/CutawayScenes.tsx` reuse procedural epidermis, dermis, subcutaneous tissue, follicles, glands, fluid pockets, cyst walls, tracts, tunnels, scars, and a ganglion stalk. No external anatomical model or texture download is required.

## Medical safety boundary

Medical facts live in the typed records in `lib/conditions.ts`; the UI does not ask a model to invent medical content or sources.

`lib/triage.ts` runs before condition matching. It covers:

- emergency patterns such as sudden severe testicular pain, severe systemic illness, concerning rapidly worsening skin changes, or pain out of proportion;
- same-day patterns such as painful perianal swelling, fever with an inflamed lump, rapidly worsening painful swelling, infection signs with diabetes/weakened immunity, or painful eye/central-face/genital-opening swelling;
- prompt appointments for a new inside-testicle lump, deep/internal lumps, hard/fixed/growing/persistent lumps, recurring lesions or tunnels/scars, selected Bartholin-area concerns, and symptoms not improving around two weeks;
- cautious monitoring only when no red-flag rule fires.

`lib/matchConditions.ts` ranks up to three curated educational records without exposing scores or probabilities. Model output is structurally unable to set care urgency, and the API route protects explicit high-risk facts from being erased by a conflicting model extraction.

The app never instructs a user to squeeze, pop, pierce, cut, or drain a lump. It does not provide medication doses, promise prevention, call HS a hygiene problem, or claim antibiotics alone always resolve an abscess.

## OpenAI feature

`app/api/navigate/route.ts` uses the server-only OpenAI Responses API. The default is controlled by `OPENAI_MODEL`, with `gpt-5.6` as the fallback. It uses Structured Outputs with Zod because the model’s role is narrow: normalize everyday multilingual wording into the fixed `LumpDescription` shape and suggest at most three missing questions.

The route uses `store: false`, disables SDK logging, rejects unknown fields, caps descriptions at 4,000 characters and request bodies at 16 KiB, and never logs raw health text. A bounded process-local rate limit hashes short-lived client identifiers before any model call; it retains neither raw IP addresses nor health descriptions. `OPENAI_API_KEY` is referenced only in the server route and cannot enter the client bundle.

The model does **not** diagnose, choose urgency, invent treatments, recommend medicines/doses, or add medical facts and sources. Matching, red flags, care messages, condition copy, and sources remain deterministic and local.

## Privacy and accessibility

- No accounts, analytics, trackers, uploads, or cloud storage.
- Health descriptions are not persisted in local or session storage.
- “Clear my answers” resets the in-memory session immediately.
- No intimate photo upload or photo classification.
- Key flows work from the keyboard and without dragging the canvas.
- Minimum 44 px touch targets, visible focus states, semantic headings, and ARIA labels.
- `prefers-reduced-motion` is respected and a visible motion control is available.
- Three.js DPR is capped; 3D is lazy-loaded and has an attractive non-WebGL fallback.
- The canvas preserves normal vertical page scrolling on touch devices.

## Focused atlas

The MVP covers epidermoid cyst, folliculitis, ingrown hair, boil/carbuncle, skin abscess, pilonidal disease, hidradenitis suppurativa, perianal abscess/fistula, Bartholin duct cyst/abscess, ganglion cyst, acne nodule/cyst, lipoma, swollen lymph node, and a limited hemorrhoid comparison.

Internal-organ cysts (ovarian, kidney, liver, pancreatic, brain, and similar) are intentionally excluded. They require a different medical product and often imaging.

## Setup

Prerequisite: Node.js 22.13 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS or Linux, use `cp .env.example .env.local` instead of `copy`.

The development server prints the local URL. The app works immediately without an API key.

### Environment variables

```dotenv
OPENAI_API_KEY=optional_server_only_key
OPENAI_MODEL=gpt-5.6
```

Leave `OPENAI_API_KEY` blank for Demo Mode. Never expose it through a `NEXT_PUBLIC_` variable.

## Demo Mode

No-key Demo Mode supports the complete guided flow and deterministic parsing for these one-click examples:

1. “There is a painful lump at the top of my buttock cleft after several days of sitting.”
2. “Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.”
3. “Shave karne ke baad baal ke paas chota red bump hai.”
4. “There is severe pain and swelling right beside the anus and I feel feverish.”

Missing facts stay `unknown` or `null`; Demo Mode never fills in unmentioned negatives, timing, or severity.

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The focused suite covers every emergency rule family, same-day perianal + fever, inside-testicle versus scrotal-skin routing, the HS fold recurrence/tunnels pattern, a mild post-shaving bump, no-inference handling, deterministic urgency protection, allow-listed Visit Notes, route validation/limits, model downgrade protection, and no-key Demo Mode.

## 60-second submission demo

1. Rotate the mannequin, switch to the back, and select **Top of the buttock cleft**.
2. Open **Pilonidal disease** and move through **Normal cleft → Pit + sinus → Inflamed disease**.
3. In **Compare**, place it beside **Boil & carbuncle** and **Epidermoid cyst**.
4. In **Describe a lump**, load: “Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.”
5. Show the structured Roman Urdu interpretation, prompt-appointment banner, HS education card, and factual Visit Note.
6. Start again and load the perianal + fever sample to show the deterministic same-day urgent message and its exact trigger facts.
7. Finish on visible source links, the privacy promise, motion control, and **Clear my answers**.

## Medical sources

- [NHS — Pilonidal sinus](https://www.nhs.uk/conditions/pilonidal-sinus/)
- [NHS — Skin abscess](https://www.nhs.uk/conditions/skin-abscess/)
- [NHS — Boils](https://www.nhs.uk/conditions/boils/)
- [NHS — Hidradenitis suppurativa](https://www.nhs.uk/conditions/hidradenitis-suppurativa/)
- [American Academy of Dermatology — Folliculitis](https://www.aad.org/public/diseases/a-z/folliculitis)
- [Healthdirect Australia — Ingrown hair](https://www.healthdirect.gov.au/ingrown-hair)
- [Mayo Clinic — Epidermoid cyst](https://www.mayoclinic.org/diseases-conditions/epidermoid-cysts/symptoms-causes/syc-20352701)
- [UCSF Surgery — Perianal and perirectal abscess/fistula](https://generalsurgery.ucsf.edu/condition/perianal-and-perirectal-abscessfistula)
- [NHS — Bartholin’s cyst](https://www.nhs.uk/conditions/bartholins-cyst/)
- [Mayo Clinic — Ganglion cyst](https://www.mayoclinic.org/diseases-conditions/ganglion-cyst/symptoms-causes/syc-20351156)
- [Mayo Clinic — Lipoma](https://www.mayoclinic.org/diseases-conditions/lipoma/symptoms-causes/syc-20374470)
- [NHS — Swollen glands](https://www.nhs.uk/symptoms/swollen-glands/)
- [NIAMS — Acne](https://www.niams.nih.gov/health-topics/acne)

Every displayed condition exposes its own URLs and `lastReviewed` date from the local dataset.

## Limitations and next steps

- This is an educational prototype, not a regulated medical device or diagnostic service.
- A licensed clinician must review the content, triage language, and country-specific care pathways before real-world clinical use.
- Procedural anatomy is intentionally schematic and cannot represent every body or presentation.
- Demo parsing recognizes representative phrasing; broader natural language requires the optional OpenAI route.
- The included rate limiter is a bounded per-process safeguard; a public clinical pilot should add a shared edge-level quota or managed abuse-control service.
- Before public deployment, add clinical governance, content review/versioning, localization review by native speakers, accessibility testing with assistive-technology users, and region-specific emergency-care configuration.
