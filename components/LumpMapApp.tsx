"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  Eye,
  EyeOff,
  Focus,
  HeartPulse,
  Info,
  Languages,
  Layers3,
  LocateFixed,
  Menu,
  MessageSquareText,
  MousePointer2,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  ATLAS_SCOPE_NOTE,
  CONDITION_BY_ID,
  CONDITIONS,
  MEDICAL_CONTENT_LAST_REVIEWED,
  MEDICAL_REVIEW_NOTICE,
  type ConditionId,
  type ConditionRecord,
} from "@/lib/conditions";
import {
  REGION_BY_ID,
  REGIONS,
  type AtlasRegionId,
  type RegionRecord,
} from "@/lib/regions";
import { evaluateTriage } from "@/lib/triage";
import { getMatchContext, matchConditions } from "@/lib/matchConditions";
import { buildVisitNote } from "@/lib/visitNote";
import {
  LumpDescriptionSchema,
  type LumpDescription,
} from "@/lib/openai/schema";
import type {
  BodyRegionId,
  CutawaySceneId,
  CutawayStage,
} from "@/components/three";

const BodyAtlas = dynamic(
  () => import("@/components/three").then((module) => module.BodyAtlas),
  {
    ssr: false,
    loading: () => <SceneLoading label="Preparing the body atlas" />,
  },
);

const SkinCutaway = dynamic(
  () => import("@/components/three").then((module) => module.SkinCutaway),
  {
    ssr: false,
    loading: () => <SceneLoading label="Preparing the tissue model" />,
  },
);

const FEATURED_REGIONS: AtlasRegionId[] = [
  "scalp_face",
  "armpit",
  "chest_back",
  "groin_fold",
  "wrist_hand",
  "buttock_skin",
  "natal_cleft",
  "perianal",
];

const DEFAULT_COMPARE: ConditionId[] = [
  "pilonidal-disease",
  "boil-carbuncle",
  "epidermoid-cyst",
];

const SCENE_MAP: Record<string, CutawaySceneId> = {
  epidermoid: "epidermoid_cyst",
  follicle: "folliculitis",
  ingrown_hair: "ingrown_hair",
  abscess: "boil_abscess",
  pilonidal: "pilonidal_disease",
  hs_tunnels: "hidradenitis_suppurativa",
  perianal_schematic: "skin_abscess",
  bartholin_schematic: "skin_abscess",
  ganglion: "ganglion_cyst",
  acne: "folliculitis",
  subcutaneous_mass: "epidermoid_cyst",
  lymph_node: "epidermoid_cyst",
  anal_vascular_schematic: "skin_abscess",
};

const NAV_ITEMS = [
  ["Atlas", "#atlas"],
  ["Compare", "#compare"],
  ["Describe a lump", "#guide"],
  ["Sources", "#sources"],
] as const;

function SceneLoading({ label }: { label: string }) {
  return (
    <div className="scene-loading" role="status" aria-live="polite">
      <div className="scene-loading-orbit" aria-hidden="true">
        <span />
      </div>
      <p>{label}</p>
    </div>
  );
}

function sceneFor(condition: ConditionRecord): CutawaySceneId {
  return SCENE_MAP[condition.scene3d.template] ?? "epidermoid_cyst";
}

function getRegionRecord(id: BodyRegionId | AtlasRegionId): RegionRecord {
  return REGION_BY_ID[id as AtlasRegionId] ?? REGION_BY_ID.unknown;
}

function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  window.history.pushState(null, "", `#${id}`);
  target.scrollIntoView({ behavior: "auto", block: "start" });
}

export default function LumpMapApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] =
    useState<BodyRegionId>("natal_cleft");
  const [selectedCondition, setSelectedCondition] =
    useState<ConditionId>("pilonidal-disease");
  const [sceneMode, setSceneMode] = useState<"body" | "cutaway">("body");
  const [orientation, setOrientation] = useState<"front" | "back">("back");
  const [stage, setStage] = useState<CutawayStage>(1);
  const [showLabels, setShowLabels] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [regionSearch, setRegionSearch] = useState("");
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [detailTab, setDetailTab] = useState<
    "pattern" | "care" | "reduce" | "sources"
  >("pattern");
  const [compareIds, setCompareIds] =
    useState<ConditionId[]>(DEFAULT_COMPARE);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideResetKey, setGuideResetKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const atlasHeadingRef = useRef<HTMLHeadingElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileMenuId = useId();

  const selectedRegionRecord = getRegionRecord(selectedRegion);
  const condition = CONDITION_BY_ID[selectedCondition];
  const regionConditions = selectedRegionRecord.commonConditionIds
    .map((id) => CONDITION_BY_ID[id])
    .filter(Boolean);

  const filteredRegions = useMemo(() => {
    const normalized = regionSearch.trim().toLowerCase();
    const allRegions = REGIONS.filter((region) => region.id !== "unknown");
    if (!normalized) {
      return showAllRegions
        ? allRegions
        : FEATURED_REGIONS.map((id) => REGION_BY_ID[id]);
    }
    return allRegions.filter((region) =>
      [region.label, region.shortLabel, ...region.searchTerms]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [regionSearch, showAllRegions]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);
    const frame = window.requestAnimationFrame(syncPreference);
    media.addEventListener("change", syncPreference);
    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener("change", syncPreference);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const focusFrame = window.requestAnimationFrame(() => {
      mobileNavRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    });
    const closeAndRestoreFocus = () => {
      setMobileMenuOpen(false);
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !mobileNavRef.current?.contains(target) &&
        !mobileMenuButtonRef.current?.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileMenuOpen]);

  function selectRegion(regionId: BodyRegionId | AtlasRegionId) {
    const region = getRegionRecord(regionId);
    setSelectedRegion(region.id as BodyRegionId);
    if (region.view === "front" || region.view === "back") {
      setOrientation(region.view);
    }
    if (region.commonConditionIds[0]) {
      setSelectedCondition(region.commonConditionIds[0]);
    }
    setSceneMode("body");
    setDetailTab("pattern");
  }

  function openCondition(id: ConditionId) {
    setSelectedCondition(id);
    setSceneMode("cutaway");
    setStage(1);
    setDetailTab("pattern");
  }

  function openConditionInAtlas(id: ConditionId, preferredRegion?: string) {
    const targetCondition = CONDITION_BY_ID[id];
    const isAtlasRegion = (regionId: string | undefined): regionId is AtlasRegionId =>
      Boolean(
        regionId &&
          regionId !== "unknown" &&
          Object.prototype.hasOwnProperty.call(REGION_BY_ID, regionId),
      );
    const targetRegionId = isAtlasRegion(preferredRegion)
      ? preferredRegion
      : targetCondition.bodyRegions.find(isAtlasRegion);

    if (targetRegionId) {
      const region = REGION_BY_ID[targetRegionId];
      setSelectedRegion(region.id as BodyRegionId);
      if (region.view === "front" || region.view === "back") {
        setOrientation(region.view);
      }
    }

    openCondition(id);
    window.requestAnimationFrame(() => {
      scrollToId("atlas");
      atlasHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function clearSession() {
    setSelectedRegion("natal_cleft");
    setSelectedCondition("pilonidal-disease");
    setSceneMode("body");
    setOrientation("back");
    setStage(1);
    setGuideOpen(false);
    setGuideResetKey((key) => key + 1);
    setRegionSearch("");
    setShowAllRegions(false);
    setCompareIds(DEFAULT_COMPARE);
    setMobileMenuOpen(false);
    setCopied(false);
    setCopyFailed(false);
  }

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
    <main className={reducedMotion ? "reduce-motion" : undefined}>
      <a className="skip-link" href="#atlas">
        Skip to anatomy explorer
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="LumpMap 3D home">
          <span className="brand-wordmark" aria-hidden="true">
            LUMPMAP <b>3D</b>
          </span>
          <small>Visual anatomy atlas</small>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <span className="demo-pill">
            <span className="status-dot" aria-hidden="true" /> Educational atlas
          </span>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            ref={mobileMenuButtonRef}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              id={mobileMenuId}
              ref={mobileNavRef}
              className="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {NAV_ITEMS.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                  <ChevronRight />
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section id="top" className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-index" aria-hidden="true">01</span>
            Anatomy-first health education
          </p>
          <h1>
            Not every lump
            <span>is a cyst.</span>
          </h1>
          <p className="hero-lede">
            Explore common skin lumps by location, depth, and symptoms—then
            learn what kind of care may be appropriate.
          </p>
          <div className="hero-actions">
            <a
              className="primary-button"
              href="#atlas"
            >
              Explore the body <ArrowDown />
            </a>
            <a
              className="secondary-button"
              href="#guide"
              onClick={() => {
                setGuideOpen(true);
              }}
            >
              <MessageSquareText /> Describe a lump
            </a>
          </div>
          <p className="safety-line">
            <ShieldCheck aria-hidden="true" /> Educational guidance only. It
            cannot diagnose you.
          </p>

          <div className="hero-proof" aria-label="Product principles">
            <div>
              <strong>2 scales</strong>
              <span>Body to beneath the skin</span>
            </div>
            <div>
              <strong>3 languages</strong>
              <span>English, Urdu, Roman Urdu</span>
            </div>
            <div>
              <strong>Safety first</strong>
              <span>Deterministic red flags</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-halo hero-halo-one" />
          <div className="hero-halo hero-halo-two" />
          <div className="hero-anatomy-card">
            <div className="hero-plate-head">
              <span>Tissue section / 01</span>
              <strong>Surface &rarr; fascia</strong>
            </div>
            <div className="hero-cross-section">
              <div className="skin-layer skin-epidermis" />
              <div className="skin-layer skin-dermis">
                <span className="follicle-demo" />
                <span className="follicle-demo second" />
              </div>
              <div className="skin-layer skin-fat">
                {Array.from({ length: 13 }).map((_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
            <div className="floating-label label-surface">Skin surface</div>
            <div className="floating-label label-follicle">Hair follicle</div>
            <div className="floating-label label-depth">Depth matters</div>
            <div className="hero-plate-foot">
              <span>Location</span><i />
              <span>Depth</span><i />
              <span>Pattern</span>
            </div>
          </div>
        </div>
      </section>

      <section id="atlas" className="atlas-section section-shell">
        <div className="section-heading atlas-heading">
          <div>
            <p className="eyebrow">Interactive atlas</p>
            <h2 ref={atlasHeadingRef} tabIndex={-1}>Start with where it is.</h2>
          </div>
          <p>
            Location is a useful clue—never a diagnosis. Rotate the body or use
            the accessible region list.
          </p>
        </div>

        <div className="atlas-workspace">
          <aside className="region-rail" aria-label="Body regions">
            <div className="rail-heading">
              <span>Body map</span>
              <span className="step-chip">01</span>
            </div>
            <label className="search-field">
              <Search aria-hidden="true" />
              <span className="sr-only">Search body regions</span>
              <input
                type="search"
                value={regionSearch}
                onChange={(event) => setRegionSearch(event.target.value)}
                placeholder="Find a region"
              />
            </label>
            <div className="region-list" id="region-list">
              {filteredRegions.map((region, index) => (
                <button
                  type="button"
                  key={region.id}
                  className={
                    selectedRegion === region.id ? "region-button active" : "region-button"
                  }
                  aria-pressed={selectedRegion === region.id}
                  onClick={() => selectRegion(region.id)}
                >
                  <span className="region-glyph" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{region.shortLabel}</strong>
                    <small>{region.view === "both" ? "Front & back" : `${region.view} view`}</small>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))}
              {filteredRegions.length === 0 && (
                <div className="region-empty" role="status">
                  <strong>No regions found</strong>
                  <span>Try a broader search or clear it to browse the atlas.</span>
                  <button type="button" onClick={() => setRegionSearch("")}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
            <button
              className="all-regions-link"
              type="button"
              aria-controls="region-list"
              aria-expanded={showAllRegions}
              onClick={() => {
                setRegionSearch("");
                setShowAllRegions((value) => !value);
              }}
            >
              {showAllRegions ? "Show featured regions" : "View all regions"}
              {showAllRegions ? <X /> : <Plus />}
            </button>
          </aside>

          <div className="anatomy-stage">
            <div className="stage-topbar">
              <div>
                <span className="stage-kicker">
                  {sceneMode === "body" ? "Scale A" : "Scale B"}
                </span>
                <strong>
                  {sceneMode === "body"
                    ? "Body location map"
                    : condition.name.replace(/ —.*/, "")}
                </strong>
              </div>
              <div className="segmented-control" role="group" aria-label="Anatomy scale">
                <button
                  type="button"
                  className={sceneMode === "body" ? "active" : undefined}
                  aria-pressed={sceneMode === "body"}
                  onClick={() => setSceneMode("body")}
                >
                  Body
                </button>
                <button
                  type="button"
                  className={sceneMode === "cutaway" ? "active" : undefined}
                  aria-pressed={sceneMode === "cutaway"}
                  onClick={() => setSceneMode("cutaway")}
                >
                  Cutaway
                </button>
              </div>
            </div>

            <div className="canvas-wrap">
              <AnimatePresence mode="wait">
                {sceneMode === "body" ? (
                  <motion.div
                    key="body"
                    className="canvas-motion-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <BodyAtlas
                      selectedRegion={selectedRegion}
                      onRegionSelect={selectRegion}
                      orientation={orientation}
                      onOrientationChange={setOrientation}
                      showLabels={showLabels}
                      reducedMotion={reducedMotion}
                      resetKey={resetKey}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="cutaway"
                    className="canvas-motion-wrap"
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SkinCutaway
                      condition={sceneFor(condition)}
                      stage={stage}
                      showLabels={showLabels}
                      reducedMotion={reducedMotion}
                      resetKey={resetKey}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="stage-tools" aria-label="3D view controls">
                <button
                  type="button"
                  className="stage-tool"
                  aria-label="Reset 3D view"
                  onClick={() => setResetKey((key) => key + 1)}
                >
                  <Focus /> <span>Reset</span>
                </button>
                <button
                  type="button"
                  className={showLabels ? "stage-tool active" : "stage-tool"}
                  aria-label={showLabels ? "Hide anatomy labels" : "Show anatomy labels"}
                  aria-pressed={showLabels}
                  onClick={() => setShowLabels((value) => !value)}
                >
                  {showLabels ? <Eye /> : <EyeOff />} <span>Labels</span>
                </button>
                <button
                  type="button"
                  className={reducedMotion ? "stage-tool active" : "stage-tool"}
                  aria-label={reducedMotion ? "Enable motion" : "Reduce motion"}
                  aria-pressed={reducedMotion}
                  onClick={() => setReducedMotion((value) => !value)}
                >
                  <Activity /> <span>Motion</span>
                </button>
              </div>

              <div className="stage-instruction">
                <MousePointer2 aria-hidden="true" />
                {sceneMode === "body"
                  ? "Drag to rotate • Select a region"
                  : "Drag to inspect • Scroll to zoom"}
              </div>
            </div>

            {sceneMode === "body" ? (
              <div className="view-toggle" role="group" aria-label="Body orientation">
                <button
                  type="button"
                  className={orientation === "front" ? "active" : undefined}
                  aria-pressed={orientation === "front"}
                  onClick={() => setOrientation("front")}
                >
                  Front
                </button>
                <RotateCcw aria-hidden="true" />
                <button
                  type="button"
                  className={orientation === "back" ? "active" : undefined}
                  aria-pressed={orientation === "back"}
                  onClick={() => setOrientation("back")}
                >
                  Back
                </button>
              </div>
            ) : (
              <Timeline
                stage={stage}
                onStageChange={setStage}
                labels={condition.scene3d.stageLabels}
              />
            )}
          </div>

          <aside className="insight-panel" aria-live="polite">
            <div className="panel-index">
              <span>{sceneMode === "body" ? "Selected region" : "Condition lesson"}</span>
              <span className="step-chip">02</span>
            </div>

            {sceneMode === "body" ? (
              <RegionInsight
                region={selectedRegionRecord}
                conditions={regionConditions}
                onConditionSelect={openCondition}
              />
            ) : (
              <ConditionInsight
                condition={condition}
                tab={detailTab}
                onTabChange={setDetailTab}
              />
            )}
          </aside>
        </div>
      </section>

      <section id="compare" className="compare-section section-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Same surface, different structure</p>
            <h2>Compare beneath the skin.</h2>
          </div>
          <p>
            Keep every scene at the same scale, then compare its origin, depth,
            and pattern.
          </p>
        </div>

        <div className="comparison-grid">
          {compareIds.map((id, index) => {
            const item = CONDITION_BY_ID[id];
            return (
              <article
                className={id === selectedCondition ? "comparison-card selected" : "comparison-card"}
                key={id}
              >
                <div className="comparison-number">0{index + 1}</div>
                <MiniCutaway template={item.scene3d.template} accent={item.scene3d.accentColor} />
                <div className="comparison-copy">
                  <p>{item.isActuallyACyst ? "True cyst family" : "Not simply a cyst"}</p>
                  <h3>{item.name}</h3>
                  <span>{item.tissueOrigin}</span>
                  <button type="button" onClick={() => openConditionInAtlas(item.id)}>
                    Inspect in 3D <ArrowRight />
                  </button>
                </div>
              </article>
            );
          })}
          <ComparisonPicker
            selected={compareIds}
            onChange={setCompareIds}
          />
        </div>
      </section>

      <GuideSection
        key={guideResetKey}
        open={guideOpen}
        onOpenChange={setGuideOpen}
        onExploreRegion={(region) => {
          selectRegion(region as AtlasRegionId);
          window.requestAnimationFrame(() => {
            scrollToId("atlas");
            atlasHeadingRef.current?.focus({ preventScroll: true });
          });
        }}
        onExploreCondition={(id, region) => openConditionInAtlas(id, region)}
      />

      <section id="sources" className="source-section section-shell">
        <div className="source-card">
          <div className="source-icon" aria-hidden="true">
            <BookOpen />
          </div>
          <div>
            <p className="eyebrow">A focused atlas</p>
            <h2>Clear scope. Visible sources.</h2>
            <p>{ATLAS_SCOPE_NOTE}</p>
          </div>
          <div className="source-meta">
            <span>Content last reviewed</span>
            <strong>{MEDICAL_CONTENT_LAST_REVIEWED}</strong>
            <span>{CONDITIONS.length} curated records</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <a className="brand footer-brand" href="#top" aria-label="LumpMap 3D home">
            <span className="brand-wordmark" aria-hidden="true">LUMPMAP <b>3D</b></span>
            <small>Understand what&apos;s beneath the skin.</small>
          </a>
          <p>{MEDICAL_REVIEW_NOTICE}</p>
          <div className="footer-actions">
            <button type="button" onClick={clearSession}>Clear my answers</button>
            <button
              type="button"
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion((value) => !value)}
            >
              <Activity /> {reducedMotion ? "Motion reduced" : "Reduce motion"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopyFailed(false);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                } catch {
                  setCopied(false);
                  setCopyFailed(true);
                  window.setTimeout(() => setCopyFailed(false), 2400);
                }
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Link copied" : copyFailed ? "Copy failed" : "Copy link"}
            </button>
            <span className="sr-only" role="status" aria-live="polite">
              {copied ? "Link copied to clipboard." : copyFailed ? "The link could not be copied." : ""}
            </span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Private by design • No accounts • No trackers</span>
          <span>Educational guidance only. Not a diagnosis.</span>
        </div>
      </footer>
    </main>
    </MotionConfig>
  );
}

function Timeline({
  stage,
  labels,
  onStageChange,
}: {
  stage: CutawayStage;
  labels: [string, string, string];
  onStageChange: (stage: CutawayStage) => void;
}) {
  return (
    <div className="timeline-wrap">
      <div className="timeline-head">
        <span>Possible progression, not a prediction.</span>
        <span>Stage {stage + 1} of 3</span>
      </div>
      <div className="timeline-track" aria-hidden="true">
        <span style={{ width: `${stage * 50}%` }} />
      </div>
      <div className="timeline-buttons">
        {labels.map((label, index) => (
          <button
            type="button"
            key={label}
            className={stage === index ? "active" : undefined}
            aria-pressed={stage === index}
            onClick={() => onStageChange(index as CutawayStage)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RegionInsight({
  region,
  conditions,
  onConditionSelect,
}: {
  region: RegionRecord;
  conditions: ConditionRecord[];
  onConditionSelect: (id: ConditionId) => void;
}) {
  return (
    <div className="region-insight-content">
      <p className="eyebrow">{region.view === "back" ? "Back body" : region.view === "front" ? "Front body" : "Body region"}</p>
      <h3>{region.label}</h3>
      <p className="panel-intro">{region.intro}</p>
      {region.safetyNote && (
        <div className="location-note">
          <CircleAlert />
          <p>{region.safetyNote}</p>
        </div>
      )}
      <div className="panel-divider" />
      <p className="panel-label">Patterns worth learning about</p>
      <div className="condition-list">
        {conditions.slice(0, 6).map((condition) => (
          <button
            type="button"
            key={condition.id}
            onClick={() => onConditionSelect(condition.id)}
          >
            <span
              className="condition-dot"
              style={{ backgroundColor: condition.scene3d.accentColor }}
            />
            <span>
              <strong>{condition.name}</strong>
              <small>{condition.oneLineDefinition}</small>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
      <p className="panel-disclaimer">
        <Info /> These are learning comparisons, not matches or diagnoses.
      </p>
    </div>
  );
}

function ConditionInsight({
  condition,
  tab,
  onTabChange,
}: {
  condition: ConditionRecord;
  tab: "pattern" | "care" | "reduce" | "sources";
  onTabChange: (tab: "pattern" | "care" | "reduce" | "sources") => void;
}) {
  const list =
    tab === "pattern"
      ? condition.typicalPattern
      : tab === "care"
        ? condition.careOverview
        : tab === "reduce"
          ? condition.riskReduction
          : condition.sourceUrls;

  return (
    <div className="condition-insight-content">
      <p className="eyebrow">{condition.isActuallyACyst ? "Cyst family" : "Important distinction"}</p>
      <h3>{condition.name}</h3>
      <p className="panel-intro">{condition.oneLineDefinition}</p>

      <div className="detail-tabs" aria-label="Condition information">
        {(["pattern", "care", "reduce", "sources"] as const).map((item) => (
          <button
            type="button"
            aria-pressed={tab === item}
            key={item}
            onClick={() => onTabChange(item)}
          >
            {item === "reduce" ? "Risk reduction" : item}
          </button>
        ))}
      </div>

      <ul className="detail-list">
        {list.slice(0, 4).map((item, index) => (
          <li key={item}>
            <span><Check /></span>
            {tab === "sources" ? (
              <a href={item} target="_blank" rel="noreferrer">
                Source {index + 1}: {sourceDomain(item)}
              </a>
            ) : item}
          </li>
        ))}
      </ul>

      <div className="do-not-card">
        <CircleAlert />
        <div>
          <strong>Do not do this</strong>
          <p>{condition.doNot[0]}</p>
        </div>
      </div>

      <div className="review-row">
        <span>Last reviewed</span>
        <strong>{condition.lastReviewed}</strong>
      </div>
    </div>
  );
}

function MiniCutaway({ template, accent }: { template: string; accent: string }) {
  return (
    <div className={`mini-cutaway mini-${template}`} style={{ "--mini-accent": accent } as React.CSSProperties} aria-hidden="true">
      <span className="mini-layer mini-surface" />
      <span className="mini-layer mini-dermis" />
      <span className="mini-layer mini-fat" />
      <span className="mini-layer mini-muscle" />
      <span className="mini-tract" />
      <span className="mini-pocket" />
      <span className="mini-hair hair-one" />
      <span className="mini-hair hair-two" />
    </div>
  );
}

function ComparisonPicker({
  selected,
  onChange,
}: {
  selected: ConditionId[];
  onChange: (ids: ConditionId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const available = CONDITIONS.filter((condition) => !selected.includes(condition.id));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;

    const focusFrame = window.requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    });
    const closeAndRestoreFocus = () => {
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !popoverRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className={open ? "compare-picker-wrap open" : "compare-picker-wrap"}>
      <button
        ref={triggerRef}
        className="add-comparison"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
      >
        <Plus />
        <span>Swap a comparison</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            id={popoverId}
            className="compare-popover"
            role="dialog"
            aria-label={`Replace ${CONDITION_BY_ID[selected[2]].name}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <strong>Replace {CONDITION_BY_ID[selected[2]].name}</strong>
            {available.map((condition) => (
              <button
                type="button"
                key={condition.id}
                onClick={() => {
                  onChange([selected[0], selected[1], condition.id]);
                  setOpen(false);
                  window.requestAnimationFrame(() => triggerRef.current?.focus());
                }}
              >
                {condition.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type GuideDescription = LumpDescription;

const DEMO_PROMPTS = [
  "There is a painful lump at the top of my buttock cleft after several days of sitting.",
  "Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai.",
  "Shave karne ke baad baal ke paas chota red bump hai.",
  "There is severe pain and swelling right beside the anus and I feel feverish.",
];

function GuideSection({
  open,
  onOpenChange,
  onExploreRegion,
  onExploreCondition,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExploreRegion: (region: string) => void;
  onExploreCondition: (condition: ConditionId, region: string) => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"openai" | "demo" | "guided" | null>(null);
  const [flowMode, setFlowMode] = useState<"text" | "guided">("text");
  const [description, setDescription] = useState<GuideDescription | null>(null);
  const [visitCopied, setVisitCopied] = useState(false);
  const [visitCopyFailed, setVisitCopyFailed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const requestAbortRef = useRef<AbortController | null>(null);
  const descriptionInputId = useId();
  const descriptionErrorId = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!description) return;
    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      resultsRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [description]);

  useEffect(
    () => () => {
      requestAbortRef.current?.abort();
    },
    [],
  );

  function cancelPendingRequest() {
    requestIdRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    setLoading(false);
  }

  function focusTextInput() {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function startGuidedFlow() {
    cancelPendingRequest();
    setError(null);
    setDescription(null);
    setMode(null);
    setFlowMode("guided");
    onOpenChange(true);
  }

  function restartWithText() {
    cancelPendingRequest();
    setDescription(null);
    setText("");
    setError(null);
    setMode(null);
    setFlowMode("text");
    setVisitCopied(false);
    setVisitCopyFailed(false);
    focusTextInput();
  }

  async function understandText() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Describe the location and what you have noticed first.");
      focusTextInput();
      return;
    }

    requestAbortRef.current?.abort();
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    requestAbortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/navigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });
      const responseText = await response.text();
      let payload: {
        mode?: "openai" | "demo";
        description?: GuideDescription;
        error?: string;
      } = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as typeof payload;
        } catch {
          throw new Error(
            response.ok
              ? "The response could not be read. Please try guided questions instead."
              : "The service is temporarily unavailable. Please try guided questions instead.",
          );
        }
      }
      if (!response.ok || !payload.description) {
        throw new Error(
          payload.error ??
            "The description could not be read. Please try guided questions instead.",
        );
      }
      if (requestId !== requestIdRef.current) return;
      setDescription(payload.description);
      setMode(payload.mode ?? "demo");
      onOpenChange(true);
    } catch (caught) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        requestAbortRef.current = null;
      }
    }
  }

  const likelyCards = useMemo(
    () => (description ? matchConditions(description, { limit: 3 }) : []),
    [description],
  );

  const triage = description ? evaluateTriage(description) : null;
  const needsMoreInformation = Boolean(
    triage?.category === "lower_risk_monitoring" &&
      triage.hasUnknownSafetyInformation,
  );
  const triageTone = needsMoreInformation
    ? "uncertain"
    : triage
    ? {
        emergency_now: "emergency",
        same_day_urgent: "urgent",
        prompt_appointment: "prompt",
        lower_risk_monitoring: "monitor",
      }[triage.category]
    : "monitor";
  const triageEyebrow = needsMoreInformation
    ? "More information needed"
    : triage
    ? {
        emergency_now: "Emergency now",
        same_day_urgent: "Same-day urgent assessment",
        prompt_appointment: "Prompt clinician appointment",
        lower_risk_monitoring: "Lower-risk education",
      }[triage.category]
    : "";
  const displayedTriageTitle = needsMoreInformation
    ? "There is not enough detail to assess urgency"
    : triage?.title;
  const displayedTriageGuidance = needsMoreInformation
    ? "A vague description can hide important warning signs. Answer the guided questions before relying on this educational result."
    : `${triage?.guidance ?? ""} ${triage?.action ?? ""}`.trim();
  const visitNote = description ? buildVisitNote(description) : "";
  const matchContext = description ? getMatchContext(description) : null;
  const interpretedLanguage = languagePresentation(
    description?.language ?? "english",
  );
  const interpretationModeLabel =
    mode === "openai"
      ? "Language model + safety rules"
      : mode === "guided"
        ? "Guided answers + safety rules"
        : "Local text rules + safety rules";

  return (
    <section id="guide" className="guide-section">
      <div className="section-shell guide-shell">
        <div className="guide-copy">
          <p className="eyebrow"><Languages /> English • Urdu • Roman Urdu</p>
          <h2>Use your own words.</h2>
          <p>
            Say where the lump is and what you have noticed. Everyday words like
            <em> daana</em>, <em>phinsi</em>, <em>phora</em>, and <em>gilti</em>{" "}
            are kept as clues—never turned into a diagnosis.
          </p>
          <div className="privacy-promise">
              <ShieldCheck />
              <div>
                <strong>No account or saved history</strong>
                <span>
                  The app does not store your description. Language-model mode sends
                  it to OpenAI for processing; guided questions use local rules.
                </span>
              </div>
          </div>
          <div className="guide-steps" aria-label="How the guide works">
            <div><span>1</span><p><strong>Describe</strong>Use ordinary language</p></div>
            <div><span>2</span><p><strong>Check safety</strong>Rules run before matches</p></div>
            <div><span>3</span><p><strong>Learn</strong>Get sourced comparisons</p></div>
          </div>
        </div>

        <div
          className={open ? "guide-console open" : "guide-console"}
          aria-busy={loading}
        >
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {loading
              ? "Checking your description."
              : description && triage
                ? `Educational guidance ready. Care level: ${triageEyebrow}.`
                : ""}
          </p>
          {!description ? (
            flowMode === "guided" ? (
              <GuidedQuestionFlow
                onCancel={() => {
                  setError(null);
                  setFlowMode("text");
                  focusTextInput();
                }}
                onComplete={(guidedDescription) => {
                  setDescription(guidedDescription);
                  setMode("guided");
                  onOpenChange(true);
                }}
              />
            ) : (
            <>
              <div className="console-heading">
                <div><span>Guided navigator</span><strong>What have you noticed?</strong></div>
                <span className="demo-mode"><Sparkles /> Demo mode available</span>
              </div>
              <label className="sr-only" htmlFor={descriptionInputId}>
                Describe your lump
              </label>
              <div className="description-box">
                <textarea
                  id={descriptionInputId}
                  ref={inputRef}
                  dir="auto"
                  value={text}
                  maxLength={4000}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? descriptionErrorId : undefined}
                  onFocus={() => onOpenChange(true)}
                  onChange={(event) => {
                    setText(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="For example: Baghal mein baar baar dard wali phinsi hoti hai aur nishan reh jata hai..."
                />
                <span className="char-count" aria-hidden="true">{text.length}/4000</span>
              </div>
              {error && <p id={descriptionErrorId} className="form-error" role="alert"><CircleAlert /> {error}</p>}
              <div className="sample-heading"><span>Try a sample</span><span>Fills the description</span></div>
              <div className="sample-list">
                {DEMO_PROMPTS.map((sample, index) => (
                  <button
                    type="button"
                    key={sample}
                    disabled={loading}
                    onClick={() => {
                      setText(sample);
                      setError(null);
                      onOpenChange(true);
                      focusTextInput();
                    }}
                  >
                    <span>0{index + 1}</span>{sample}<ArrowRight />
                  </button>
                ))}
              </div>
              <button className="primary-button guide-submit" type="button" onClick={understandText} disabled={loading}>
                {loading ? "Understanding your words…" : "Check my description"}
                {!loading && <ArrowRight />}
              </button>
              <button
                className="guided-choice"
                type="button"
                disabled={loading}
                onClick={startGuidedFlow}
              >
                Prefer one question at a time? <span>Use guided questions</span>
                <ChevronRight />
              </button>
              <p className="safety-line"><ShieldCheck /> Educational guidance only. It cannot diagnose you.</p>
            </>
            )
          ) : (
            <div
              id="guide-results"
              ref={resultsRef}
              className="guide-results"
              role="region"
              aria-label="Educational guidance results"
              tabIndex={-1}
            >
              <div className={`triage-banner ${triageTone}`}>
                <div><HeartPulse /><span>{triageEyebrow}</span></div>
                <h3>{displayedTriageTitle}</h3>
                <p>{displayedTriageGuidance}</p>
                {!needsMoreInformation && triage?.triggeredBy[0] && (
                  <strong>Why this appeared: {triage.triggeredBy.join(" ")}</strong>
                )}
              </div>

              {needsMoreInformation && (
                <div className="follow-up-card">
                  <div>
                    <CircleAlert />
                    <strong>Details that would make this safer</strong>
                  </div>
                  <ul>
                    {(description.suggestedFollowUpQuestions.length > 0
                      ? description.suggestedFollowUpQuestions
                      : description.unknowns.slice(0, 3)
                    ).map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <button className="secondary-button" type="button" onClick={startGuidedFlow}>
                    Answer guided questions <ArrowRight />
                  </button>
                </div>
              )}

              <div className="not-diagnosis"><Info /><p><strong>This is not a diagnosis.</strong> These are educational patterns selected from curated local records.</p></div>

              <div className="interpretation-card">
                <div className="result-section-head"><span>Structured interpretation</span><span>{interpretationModeLabel}</span></div>
                <p lang={interpretedLanguage.lang} dir={interpretedLanguage.dir}>
                  {description.normalizedPlainLanguage || description.originalText}
                </p>
                <div className="fact-chips">
                  <span><LocateFixed /> {humanize(description.bodyRegion)}</span>
                  <span><Layers3 /> {humanize(description.layer)}</span>
                  <span><Activity /> {humanize(description.pain)} pain</span>
                  <span><Languages /> {humanize(description.language)}</span>
                </div>
              </div>

              {matchContext?.outsideAtlas ? (
                <div className="match-scope-note">
                  <CircleAlert />
                  <div>
                    <strong>Outside this superficial-skin atlas</strong>
                    <p>{matchContext.notice}</p>
                  </div>
                </div>
              ) : likelyCards.length > 0 ? (
                <>
                  <div className="result-section-head"><span>Patterns worth learning about</span><span>Up to 3</span></div>
                  <p className="result-context-note">{matchContext?.notice}</p>
                  <div className="result-condition-list">
                    {likelyCards.map((match) => (
                      <article key={match.conditionId}>
                        <span className="condition-dot" style={{ backgroundColor: match.condition.scene3d.accentColor }} />
                        <div className="result-condition-copy">
                          <h4>{match.condition.name}</h4>
                          <p>{match.whyRelevant}</p>
                          <div className="result-condition-meta">
                            <span>Reviewed {match.condition.lastReviewed}</span>
                            {match.condition.sourceUrls.slice(0, 2).map((sourceUrl, index) => (
                              <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noreferrer">
                                Source {index + 1}: {sourceDomain(sourceUrl)}
                              </a>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Explore ${match.condition.name} in the 3D atlas`}
                          onClick={() => onExploreCondition(match.conditionId, description.bodyRegion)}
                        >
                          <span>Explore condition</span><ChevronRight />
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="match-scope-note neutral">
                  <Info />
                  <div>
                    <strong>No useful comparison yet</strong>
                    <p>Add the location and a few symptom details before comparing superficial patterns.</p>
                  </div>
                </div>
              )}

              <div className="safe-next-step">
                <CircleAlert />
                <p><strong>Safe next step</strong>Do not squeeze, pierce, cut, or try to drain the lump yourself.</p>
              </div>

              <div className="visit-note">
                <div className="result-section-head"><span>Visit Note</span><span>Facts you provided only</span></div>
                <pre>{visitNote}</pre>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(visitNote);
                      setVisitCopyFailed(false);
                      setVisitCopied(true);
                      window.setTimeout(() => setVisitCopied(false), 1600);
                    } catch {
                      setVisitCopied(false);
                      setVisitCopyFailed(true);
                      window.setTimeout(() => setVisitCopyFailed(false), 2400);
                    }
                  }}
                >
                  {visitCopied ? <Check /> : <Copy />} {visitCopied ? "Copied" : visitCopyFailed ? "Copy failed" : "Copy Visit Note"}
                </button>
                <span className="sr-only" role="status" aria-live="polite">
                  {visitCopied ? "Visit note copied to clipboard." : visitCopyFailed ? "The visit note could not be copied." : ""}
                </span>
              </div>

              <div className="result-actions">
                <button className="secondary-button" type="button" onClick={restartWithText}><RotateCcw /> Start again</button>
                {description.bodyRegion !== "unknown" && <button className="primary-button" type="button" onClick={() => onExploreRegion(description.bodyRegion)}>Explore this area <ArrowRight /></button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const GUIDED_STEP_TITLES = [
  "Location",
  "Depth",
  "Timing",
  "Pain",
  "Inflammation",
  "Pattern",
  "Whole-body symptoms",
  "Context",
] as const;

const GUIDE_REGION_OPTIONS: Array<{
  value: LumpDescription["bodyRegion"];
  label: string;
}> = [
  { value: "scalp_face", label: "Scalp or face" },
  { value: "neck", label: "Neck" },
  { value: "armpit", label: "Armpit" },
  { value: "chest_back", label: "Chest or back" },
  { value: "groin_fold", label: "Groin fold" },
  { value: "vulvar_opening", label: "Near vulvar opening" },
  { value: "scrotal_skin", label: "Scrotal skin" },
  { value: "inside_testicle", label: "Inside a testicle" },
  { value: "buttock_skin", label: "Buttock skin" },
  { value: "natal_cleft", label: "Top of buttock cleft" },
  { value: "perianal", label: "Directly beside anus" },
  { value: "wrist_hand", label: "Wrist or hand" },
  { value: "limb_other", label: "Other arm or leg" },
  { value: "unknown", label: "Not sure" },
];

function GuidedQuestionFlow({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: (description: LumpDescription) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<LumpDescription>>({});
  const [flowError, setFlowError] = useState<string | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      questionRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      questionRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  function setAnswer<K extends keyof LumpDescription>(
    key: K,
    value: LumpDescription[K],
  ) {
    setFlowError(null);
    setDraft((current) => {
      const next: Partial<LumpDescription> = { ...current, [key]: value };
      if (key === "bodyRegion") {
        const region = value as LumpDescription["bodyRegion"];
        if (region !== "scalp_face") next.nearEyeOrCentralFace = null;
        if (region !== "vulvar_opening") next.age = null;
        if (region !== "inside_testicle" && region !== "scrotal_skin") {
          next.suddenOnset = null;
        }
      }
      return next;
    });
  }

  function finish() {
    const unknowns: string[] = [];
    if (!draft.bodyRegion || draft.bodyRegion === "unknown") unknowns.push("body region");
    if (!draft.layer || draft.layer === "unknown") unknowns.push("depth");
    if (!draft.onset || draft.onset === "unknown") unknowns.push("onset");
    if (!draft.pain || draft.pain === "unknown") unknowns.push("pain level");

    const suggestedFollowUpQuestions: string[] = [];
    if (!draft.bodyRegion || draft.bodyRegion === "unknown") {
      suggestedFollowUpQuestions.push("Where exactly on the body is the lump?");
    }
    if (!draft.trend || draft.trend === "unknown") {
      suggestedFollowUpQuestions.push("Is it improving, stable, or getting worse?");
    }
    if (draft.feverOrChills === null || draft.feverOrChills === undefined) {
      suggestedFollowUpQuestions.push("Do you have fever or chills?");
    }

    const candidate = {
      language: "english",
      originalText: "",
      normalizedPlainLanguage:
        "Guided answers captured without adding unreported symptoms.",
      bodyRegion: draft.bodyRegion ?? "unknown",
      layer: draft.layer ?? "unknown",
      onset: draft.onset ?? "unknown",
      trend: draft.trend ?? "unknown",
      pain: draft.pain ?? "unknown",
      rednessOrWarmth: draft.rednessOrWarmth ?? null,
      drainage: draft.drainage ?? "unknown",
      feverOrChills: draft.feverOrChills ?? null,
      faintConfusedOrVeryUnwell:
        draft.faintConfusedOrVeryUnwell ?? null,
      recurrent: draft.recurrent ?? null,
      multipleLesions: draft.multipleLesions ?? null,
      tunnelsPitsOrScars: draft.tunnelsPitsOrScars ?? null,
      recentHairRemoval: draft.recentHairRemoval ?? null,
      frictionOrProlongedSitting:
        draft.frictionOrProlongedSitting ?? null,
      diabetesOrImmunocompromised:
        draft.diabetesOrImmunocompromised ?? null,
      troubleBreathing: draft.troubleBreathing ?? null,
      spreadingRednessOrSwelling: draft.spreadingRednessOrSwelling ?? null,
      severeSystemicSymptoms: draft.severeSystemicSymptoms ?? null,
      blackGreyBlisteringOrNumbSkin:
        draft.blackGreyBlisteringOrNumbSkin ?? null,
      painOutOfProportion: draft.painOutOfProportion ?? null,
      suddenOnset: draft.suddenOnset ?? null,
      swelling: draft.swelling ?? null,
      nearEyeOrCentralFace: draft.nearEyeOrCentralFace ?? null,
      hardOrFixed: draft.hardOrFixed ?? null,
      steadilyGrowing: draft.steadilyGrowing ?? null,
      unexplained: draft.unexplained ?? null,
      persistent: draft.persistent ?? null,
      durationDays: draft.durationDays ?? null,
      age: draft.age ?? null,
      unknowns,
      suggestedFollowUpQuestions: suggestedFollowUpQuestions.slice(0, 3),
    };
    const parsed = LumpDescriptionSchema.safeParse(candidate);
    if (!parsed.success) {
      setFlowError(
        "One of the numeric answers is outside the supported range. Review the duration or age and try again.",
      );
      return;
    }
    onComplete(parsed.data);
  }

  function next() {
    if (step === GUIDED_STEP_TITLES.length - 1) finish();
    else setStep((current) => current + 1);
  }

  const canContinue =
    step === 0
      ? Boolean(draft.bodyRegion)
      : step === 1
        ? Boolean(draft.layer)
        : step === 2
          ? Boolean(draft.onset) && Boolean(draft.trend)
          : step === 3
            ? Boolean(draft.pain)
            : true;

  return (
    <div id="guided-flow" className="guided-flow">
      <div className="console-heading">
        <div>
          <span>Question {step + 1} of {GUIDED_STEP_TITLES.length}</span>
          <strong>{GUIDED_STEP_TITLES[step]}</strong>
        </div>
        <button className="guided-close" type="button" onClick={onCancel}>
          <X /> <span>Use my own words</span>
        </button>
      </div>

      <div className="guided-progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / GUIDED_STEP_TITLES.length) * 100}%` }} />
      </div>

      {step > 0 && (
        <div className="answer-summary" aria-label="Your answers so far">
          {GUIDED_STEP_TITLES.slice(0, step).map((title, index) => (
            <button type="button" key={title} onClick={() => setStep(index)}>
              <Check /> {title}
            </button>
          ))}
        </div>
      )}

      <div
        ref={questionRef}
        className="guided-question"
        tabIndex={-1}
        role="group"
        aria-label={`Question ${step + 1} of ${GUIDED_STEP_TITLES.length}: ${GUIDED_STEP_TITLES[step]}`}
      >
        {step === 0 && (
          <>
            <h3>Where is the lump?</h3>
            <p>Choose the closest area. Sensitive anatomy stays schematic.</p>
            <OptionGrid
              value={draft.bodyRegion}
              options={GUIDE_REGION_OPTIONS}
              onChange={(value) => setAnswer("bodyRegion", value)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <h3>How deep does it feel?</h3>
            <p>A surface bump, a lump just beneath the skin, or something deeper?</p>
            <OptionGrid
              value={draft.layer}
              options={[
                { value: "surface", label: "On the skin surface" },
                { value: "subcutaneous", label: "Just beneath the skin" },
                { value: "deep_or_internal", label: "Feels deeper or internal" },
                { value: "unknown", label: "Not sure" },
              ]}
              onChange={(value) => setAnswer("layer", value as LumpDescription["layer"])}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h3>When did it begin, and how is it changing?</h3>
            <p>Choose one answer from each row.</p>
            <fieldset className="option-fieldset">
              <legend>When it began</legend>
              <OptionGrid
                value={draft.onset}
                compact
                options={[
                  { value: "hours", label: "Hours" },
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                  { value: "months_or_longer", label: "Months or longer" },
                  { value: "unknown", label: "Not sure" },
                ]}
                onChange={(value) => setAnswer("onset", value as LumpDescription["onset"])}
              />
            </fieldset>
            <fieldset className="option-fieldset">
              <legend>Change over time</legend>
              <OptionGrid
                value={draft.trend}
                compact
                options={[
                  { value: "improving", label: "Improving" },
                  { value: "stable", label: "About the same" },
                  { value: "slowly_worsening", label: "Slowly worsening" },
                  { value: "rapidly_worsening", label: "Worsening quickly" },
                  { value: "unknown", label: "Not sure" },
                ]}
                onChange={(value) => setAnswer("trend", value as LumpDescription["trend"])}
              />
            </fieldset>
            <label className="guided-number-field">
              <span>Exact duration in days <small>Optional</small></span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={36500}
                value={draft.durationDays ?? ""}
                 onChange={(event) => {
                   const nextValue = event.currentTarget.value;
                   const parsedValue = Number(nextValue);
                   setAnswer(
                     "durationDays",
                     nextValue === "" || !Number.isFinite(parsedValue)
                       ? null
                       : Math.min(36_500, Math.max(0, Math.round(parsedValue))),
                   );
                 }}
                placeholder="For example, 14"
              />
            </label>
            {(draft.bodyRegion === "inside_testicle" ||
              draft.bodyRegion === "scrotal_skin") && (
              <TriStateRow
                label="Did the pain or swelling start suddenly?"
                value={draft.suddenOnset}
                onChange={(value) => setAnswer("suddenOnset", value)}
              />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h3>How painful is it?</h3>
            <p>Choose the answer that best reflects the pain now.</p>
            <OptionGrid
              value={draft.pain}
              options={[
                { value: "none", label: "No pain" },
                { value: "mild", label: "Mild" },
                { value: "moderate", label: "Moderate" },
                { value: "severe", label: "Severe" },
                { value: "unknown", label: "Not sure" },
              ]}
              onChange={(value) => setAnswer("pain", value as LumpDescription["pain"])}
            />
            <TriStateRow
              label="Is the pain much worse than the visible change?"
              value={draft.painOutOfProportion}
              onChange={(value) => setAnswer("painOutOfProportion", value)}
            />
          </>
        )}

        {step === 4 && (
          <>
            <h3>What is happening at the surface?</h3>
            <p>These details can change the care level.</p>
            <TriStateRow
              label="Redness or warmth"
              value={draft.rednessOrWarmth}
              onChange={(value) => setAnswer("rednessOrWarmth", value)}
            />
            <TriStateRow
              label="Swelling"
              value={draft.swelling}
              onChange={(value) => setAnswer("swelling", value)}
            />
            <TriStateRow
              label="Redness or swelling spreading away from the lump"
              value={draft.spreadingRednessOrSwelling}
              onChange={(value) =>
                setAnswer("spreadingRednessOrSwelling", value)
              }
            />
            <TriStateRow
              label="Black, grey, blistering, or numb skin"
              value={draft.blackGreyBlisteringOrNumbSkin}
              onChange={(value) =>
                setAnswer("blackGreyBlisteringOrNumbSkin", value)
              }
            />
            {draft.bodyRegion === "scalp_face" && (
              <TriStateRow
                label="The swelling is near the eye or central face"
                value={draft.nearEyeOrCentralFace}
                onChange={(value) => setAnswer("nearEyeOrCentralFace", value)}
              />
            )}
            <fieldset className="option-fieldset">
              <legend>Drainage</legend>
              <OptionGrid
                value={draft.drainage}
                compact
                options={[
                  { value: "none", label: "None" },
                  { value: "pus", label: "Pus" },
                  { value: "blood", label: "Blood" },
                  { value: "clear_or_other", label: "Clear or other" },
                  { value: "unknown", label: "Not sure" },
                ]}
                onChange={(value) => setAnswer("drainage", value as LumpDescription["drainage"])}
              />
            </fieldset>
          </>
        )}

        {step === 5 && (
          <>
            <h3>Is this a repeated or connected pattern?</h3>
            <p>Repeated lumps, several lesions, tunnels, pits, or scars are useful facts.</p>
            <TriStateRow label="Has happened before" value={draft.recurrent} onChange={(value) => setAnswer("recurrent", value)} />
            <TriStateRow label="More than one lump" value={draft.multipleLesions} onChange={(value) => setAnswer("multipleLesions", value)} />
            <TriStateRow label="Pits, tunnels, or scars" value={draft.tunnelsPitsOrScars} onChange={(value) => setAnswer("tunnelsPitsOrScars", value)} />
            <TriStateRow label="Feels hard or fixed in place" value={draft.hardOrFixed} onChange={(value) => setAnswer("hardOrFixed", value)} />
            <TriStateRow label="Has been steadily growing" value={draft.steadilyGrowing} onChange={(value) => setAnswer("steadilyGrowing", value)} />
            <TriStateRow label="Persistent or not going away" value={draft.persistent} onChange={(value) => setAnswer("persistent", value)} />
            <TriStateRow label="New with no known explanation" value={draft.unexplained} onChange={(value) => setAnswer("unexplained", value)} />
          </>
        )}

        {step === 6 && (
          <>
            <h3>Do you feel unwell beyond the lump?</h3>
            <p>Whole-body symptoms can make the situation more urgent.</p>
            <TriStateRow label="Fever or chills" value={draft.feverOrChills} onChange={(value) => setAnswer("feverOrChills", value)} />
            <TriStateRow label="Faint, confused, or very unwell" value={draft.faintConfusedOrVeryUnwell} onChange={(value) => setAnswer("faintConfusedOrVeryUnwell", value)} />
            <TriStateRow label="Trouble breathing" value={draft.troubleBreathing} onChange={(value) => setAnswer("troubleBreathing", value)} />
            <TriStateRow label="Severe whole-body symptoms" value={draft.severeSystemicSymptoms} onChange={(value) => setAnswer("severeSystemicSymptoms", value)} />
          </>
        )}

        {step === 7 && (
          <>
            <h3>Is any of this context relevant?</h3>
            <p>These questions are optional. They help with education and safety.</p>
            <TriStateRow label="Recent shaving or waxing" value={draft.recentHairRemoval} onChange={(value) => setAnswer("recentHairRemoval", value)} />
            <TriStateRow label="Friction, tight clothing, or prolonged sitting" value={draft.frictionOrProlongedSitting} onChange={(value) => setAnswer("frictionOrProlongedSitting", value)} />
            <TriStateRow label="Diabetes or weakened immunity" value={draft.diabetesOrImmunocompromised} onChange={(value) => setAnswer("diabetesOrImmunocompromised", value)} sensitive />
            {draft.bodyRegion === "vulvar_opening" && (
              <label className="guided-number-field sensitive-field">
                <span>
                  Age <small>Optional • asked only because it can change follow-up for a new Bartholin-area lump</small>
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={125}
                  value={draft.age ?? ""}
                   onChange={(event) => {
                     const nextValue = event.currentTarget.value;
                     const parsedValue = Number(nextValue);
                     setAnswer(
                       "age",
                       nextValue === "" || !Number.isFinite(parsedValue)
                         ? null
                         : Math.min(125, Math.max(0, Math.round(parsedValue))),
                     );
                   }}
                  placeholder="Age in years"
                />
              </label>
            )}
          </>
        )}
      </div>

      {flowError && <p className="form-error" role="alert"><CircleAlert /> {flowError}</p>}

      <div className="guided-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          Back
        </button>
        <button className="primary-button" type="button" disabled={!canContinue} onClick={next}>
          {step === GUIDED_STEP_TITLES.length - 1 ? "See educational guidance" : "Continue"}
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function OptionGrid<T extends string>({
  value,
  options,
  onChange,
  compact = false,
}: {
  value?: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "option-grid compact" : "option-grid"}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={value === option.value ? "selected" : undefined}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span>{value === option.value ? <Check /> : <LocateFixed />}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TriStateRow({
  label,
  value,
  onChange,
  sensitive = false,
}: {
  label: string;
  value?: boolean | null;
  onChange: (value: boolean | null) => void;
  sensitive?: boolean;
}) {
  const groupName = useId();
  const options: Array<{
    label: string;
    selected: boolean;
    value: boolean | null;
  }> = [
    { label: "Yes", selected: value === true, value: true },
    { label: "No", selected: value === false, value: false },
    { label: "Not sure", selected: value === null, value: null },
  ];

  return (
    <fieldset className="tri-state-row">
      <legend className="sr-only">
        {label}
        {sensitive ? ". Optional; asked because infection risk can differ." : ""}
      </legend>
      <div aria-hidden="true">
        <strong>{label}</strong>
        {sensitive && <span>Optional • asked because infection risk can differ</span>}
      </div>
      <div className="tri-state-options">
        {options.map((option) => (
          <label className={option.selected ? "selected" : undefined} key={option.label}>
            <input
              className="sr-only"
              type="radio"
              name={groupName}
              checked={option.selected}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function languagePresentation(language: LumpDescription["language"]): {
  lang: string;
  dir: "ltr" | "rtl" | "auto";
} {
  if (language === "urdu") return { lang: "ur", dir: "rtl" };
  if (language === "roman_urdu") return { lang: "ur-Latn", dir: "ltr" };
  if (language === "mixed") return { lang: "ur", dir: "auto" };
  return { lang: "en", dir: "ltr" };
}

function sourceDomain(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "medical source";
  }
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
