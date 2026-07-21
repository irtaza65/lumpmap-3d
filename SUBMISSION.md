# OpenAI Build Week Submission - LumpMap 3D

This file contains the prepared Devpost copy and judge-testing information. The
video URL is intentionally left blank until the final public YouTube upload is
available.

## Project overview

**Project name:** LumpMap 3D

**Elevator pitch:** LumpMap 3D turns everyday lump descriptions into safe,
multilingual anatomy education through an interactive 3D atlas, GPT-5.6
interpretation, and deterministic care guidance.

**Submitter type:** Individual

**Country:** Pakistan

**Category:** Apps for Your Life

**Primary Codex session ID:** `019f83ba-d355-7490-a9b2-464a168f195b`

**Live application:** https://lumpmap3d.vercel.app/

**Repository:** https://github.com/irtaza65/lumpmap-3d

## Built with

- Codex
- GPT-5.6
- OpenAI Responses API
- Structured Outputs
- Next.js
- React
- TypeScript
- React Three Fiber
- Three.js
- Zod
- Motion
- Vitest
- Vercel

## About the project

### Inspiration

After dealing with cyst-related concerns myself, I saw how easily very
different lumps are collapsed into one everyday word. The uncertainty is not
only about what a lump might represent; it is also about understanding what is
happening beneath the skin, recognizing warning signs, and explaining the
important facts clearly to a clinician.

People commonly use words such as *cyst*, *daana*, *phinsi*, *phora*, *gilti*,
*boil*, and *ingrown hair* as if they mean the same thing. They do not. I built
LumpMap 3D to replace that false certainty with understandable anatomy,
care-navigation guidance, and better questions.

### What it does

LumpMap 3D is an anatomy-first educational navigator for common visible or
palpable superficial lumps. It offers three connected ways to begin:

1. Describe a concern in everyday English, Urdu, or Roman Urdu.
2. Explore a rotatable 3D body and select one of seventeen body regions.
3. Compare different conditions at the same beneath-the-skin scale.

The atlas contains fourteen curated condition families, including epidermoid
cysts, folliculitis, ingrown hairs, boils and carbuncles, skin abscesses,
pilonidal disease, hidradenitis suppurativa, perianal abscess/fistula, Bartholin
cyst/abscess, ganglion cyst, acne nodules, lipoma, swollen lymph nodes, and a
limited hemorrhoid comparison. Each lesson has a distinct procedural 3D scene,
three educational stages, condition patterns, care information, risk reduction,
and visible medical sources.

Users can also complete an eight-stage guided flow covering location, depth,
timing, pain, surface inflammation, recurrence patterns, whole-body symptoms,
and relevant context. Results place safety before educational comparisons and
use four care levels: emergency, same-day urgent, prompt appointment, or no
urgent pattern identified from the answers provided. A factual Visit Note
contains only information the user actually supplied.

This is explicitly not a diagnostic system. It never says "you have X," never
provides probabilities, and never lets a visual or text match rule out a serious
cause.

### How I built it

The application is built with Next.js, React, TypeScript, React Three Fiber,
Three.js, Motion, Zod, and the OpenAI Responses API. The 3D anatomy is procedural:
the body, tissue layers, follicles, cyst walls, fluid pockets, tracts, glands,
fat lobules, fascia, and condition-specific structures are assembled in code
rather than downloaded as opaque medical models.

The OpenAI route has one narrow responsibility: GPT-5.6 converts everyday
multilingual language into a strict structured symptom record. It uses
Structured Outputs, `store: false`, a server-only key, request-size limits, and
privacy-preserving abuse controls. Deterministic local code then evaluates
urgency, ranks educational comparisons, produces care copy, and creates the
Visit Note. A model cannot set or reduce urgency.

### How I used Codex and GPT-5.6

I used Codex with GPT-5.6 as my primary engineering and design collaborator. I
defined the problem, scope, safety boundaries, and product direction. Codex
turned those decisions into the application architecture, implemented the 3D
scene system and interface, wrote medical-safety and API regression tests,
performed browser-based accessibility and responsive QA, and iterated on the
visual design after inspecting the rendered product.

Codex was especially valuable when one change affected several safety layers at
once. It traced the schema, multilingual parser, guided form, triage engine,
condition matching, results UI, and tests together rather than treating them as
isolated components. It also caught issues during review, including stale
answers surviving a reset, rare emergency phrases that needed explicit schema
support, edge-runtime initialization constraints, and condition scenes that
looked too similar.

GPT-5.6 also powers the optional live language interpretation path. Its output is
intentionally constrained to normalization and missing-question suggestions;
the medical content and safety decisions remain local and deterministic.

### Challenges

The hardest challenge was using AI without letting it become the medical
authority. Everyday multilingual descriptions are ambiguous, but urgent care
decisions cannot depend on a creative model response. The solution was a strict
separation: GPT-5.6 structures language, while deterministic rules preserve and
evaluate red flags.

The second challenge was making fourteen conditions visually distinct without
becoming graphic, repetitive, or falsely realistic. The final scene system uses
condition-specific anatomy and meaningful stage changes: a carbuncle develops
connected follicular pockets, a pilonidal lesson forms a pit and sinus tract,
HS develops multiple nodules and tunnels, and a ganglion connects to a joint by
a stalk.

The third challenge was preserving a useful 3D experience on small screens and
for people who cannot or do not want to drag a canvas. The product includes a
searchable region list, keyboard controls, 44-pixel touch targets, reduced
motion, constrained camera behavior, and a non-WebGL fallback.

### Accomplishments

- A complete, coherent consumer product rather than a technical proof of concept.
- Seventeen respectful body regions and fourteen distinct three-stage lessons.
- English, Urdu, Roman Urdu, and mixed-language interpretation.
- Deterministic protection for emergency and same-day red-flag patterns.
- A Visit Note that cannot acquire a diagnosis or an unprovided symptom.
- No accounts, trackers, uploads, saved health history, or exposed API key.
- 33 focused product tests plus 24 API and safety tests.
- Verified production build and responsive browser QA.

### What I learned

The project reinforced that safe AI products often become better when the model
is given a smaller role. GPT-5.6 is excellent at understanding varied everyday
language, while typed local records and explicit rules are better for stable
medical boundaries. I also learned that anatomical education needs more than a
beautiful model: scale, stage labels, source transparency, accessibility, and
care wording all have to agree.

### What's next

The next step is licensed-clinician review, native-speaker localization review,
assistive-technology testing, and region-specific care configuration. A future
pilot would add managed edge-level abuse controls and content governance. The
atlas would expand only after those safeguards, rather than adding conditions
faster than they can be reviewed.

## Judge testing instructions

The public application requires no account and can be tested free of charge.

1. Open the live application in a modern desktop or mobile browser.
2. In **Explore the 3D body**, switch to the back view and select **Top of the
   buttock cleft**.
3. Open **Pilonidal disease** and move through **Normal cleft -> Pit + sinus ->
   Inflamed disease**.
4. Compare it with **Boil & carbuncle** and **Epidermoid cyst**.
5. In **Describe a lump**, load the Roman Urdu sample: `Baghal mein baar baar
   dard wali phinsi hoti hai aur nishan reh jata hai.`
6. Review the structured interpretation, care level, HS educational comparison,
   visible sources, and factual Visit Note.
7. Clear the answers, load the perianal pain and fever sample, and confirm the
   deterministic same-day urgent result.
8. The complete one-question-at-a-time guided path works without an API key.

The public deployment may report **Demo Mode** when no production API key is
configured. The repository contains the complete GPT-5.6 Responses API path;
setting the documented server-side `OPENAI_API_KEY` enables live multilingual
Structured Output extraction without changing the client.

## Video field

**Public YouTube URL:** Pending.

The final video must remain under three minutes and include audio explaining the
working product, Codex collaboration, and GPT-5.6 contribution.
