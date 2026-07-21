"use client";

/* eslint-disable react-hooks/immutability -- React Three Fiber camera animation is intentionally imperative. */

import { useEffect, useMemo, useRef } from "react";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ThreeCanvasShell } from "./SceneShell";
import { ProceduralCutawayScene } from "./scenes/CutawayScenes";
import {
  CUTAWAY_SCENES,
  type CutawaySceneId,
  type CutawayStage,
  type SceneStatus,
} from "./types";

export type SkinCutawayProps = {
  condition?: CutawaySceneId;
  stage?: CutawayStage;
  showLabels?: boolean;
  reducedMotion?: boolean;
  interactive?: boolean;
  resetKey?: string | number;
  className?: string;
  onStatusChange?: (status: SceneStatus) => void;
};

type CutawayControlsProps = {
  condition: CutawaySceneId;
  interactive: boolean;
  reducedMotion: boolean;
  resetKey?: string | number;
};

function CutawayControls({
  condition,
  interactive,
  reducedMotion,
  resetKey,
}: CutawayControlsProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const moving = useRef(true);
  const { camera } = useThree();
  const desiredPosition = useMemo(
    () =>
      condition === "ganglion_cyst"
        ? new Vector3(4.45, 2.85, 6.25)
        : condition === "pilonidal_disease"
          ? new Vector3(4.3, 3.1, 6.2)
          : new Vector3(4.5, 3.15, 6.3),
    [condition],
  );
  const desiredTarget = useMemo(() => new Vector3(0, -0.12, 0.25), []);

  useEffect(() => {
    moving.current = true;
  }, [condition, resetKey]);

  useFrame((_state, delta) => {
    const control = controls.current;
    if (!control || !moving.current) return;
    const speed = reducedMotion ? 18 : 6.5;
    camera.position.x = MathUtils.damp(camera.position.x, desiredPosition.x, speed, delta);
    camera.position.y = MathUtils.damp(camera.position.y, desiredPosition.y, speed, delta);
    camera.position.z = MathUtils.damp(camera.position.z, desiredPosition.z, speed, delta);
    control.target.x = MathUtils.damp(control.target.x, desiredTarget.x, speed, delta);
    control.target.y = MathUtils.damp(control.target.y, desiredTarget.y, speed, delta);
    control.target.z = MathUtils.damp(control.target.z, desiredTarget.z, speed, delta);
    control.update();
    if (camera.position.distanceToSquared(desiredPosition) < 0.0006) {
      moving.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={interactive}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minDistance={6.1}
      maxDistance={10.2}
      minPolarAngle={0.72}
      maxPolarAngle={1.38}
      minAzimuthAngle={-0.92}
      maxAzimuthAngle={0.92}
      rotateSpeed={0.45}
      zoomSpeed={0.58}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}

type SceneProps = {
  condition: CutawaySceneId;
  stage: CutawayStage;
  showLabels: boolean;
  reducedMotion: boolean;
  interactive: boolean;
  resetKey?: string | number;
};

function CutawayWorld({
  condition,
  stage,
  showLabels,
  reducedMotion,
  interactive,
  resetKey,
}: SceneProps) {
  const scene = CUTAWAY_SCENES[condition];
  const pathologyLight = stage === 2 ? 7 : stage === 1 ? 4.5 : 2.5;

  return (
    <>
      <fog attach="fog" args={["#071216", 10, 18]} />
      <ambientLight intensity={1.22} color="#fff2e8" />
      <hemisphereLight args={["#dff8f2", "#2c2022", 1.25]} />
      <spotLight
        position={[4.5, 6.5, 5.2]}
        intensity={54}
        angle={0.47}
        penumbra={0.86}
        color="#fff0df"
        castShadow
      />
      <pointLight position={[-4, 1.8, 3]} intensity={8} color="#57b7b5" />
      <pointLight
        position={[2.1, 0.4, 3.8]}
        intensity={pathologyLight}
        color={scene.accent}
      />
      <group position={[0, 0.1, 0]}>
        <ProceduralCutawayScene condition={condition} stage={stage} showLabels={showLabels} />
      </group>
      <ContactShadows
        position={[0, -1.58, 0]}
        opacity={0.32}
        scale={7}
        blur={2.4}
        far={4}
        color="#02090b"
      />
      <CutawayControls
        condition={condition}
        interactive={interactive}
        reducedMotion={reducedMotion}
        resetKey={resetKey}
      />
    </>
  );
}

/**
 * A non-gory, procedural beneath-the-skin scene. Changing `stage` animates
 * between normal anatomy, an early change, and the established pattern.
 */
export function SkinCutaway({
  condition = "ingrown_hair",
  stage = 0,
  showLabels = true,
  reducedMotion = false,
  interactive = true,
  resetKey,
  className,
  onStatusChange,
}: SkinCutawayProps) {
  const scene = CUTAWAY_SCENES[condition];
  const safeStage: CutawayStage = stage < 0 ? 0 : stage > 2 ? 2 : stage;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 320,
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      <ThreeCanvasShell
        ariaLabel={`${scene.title} 3D tissue cutaway, ${scene.stageLabels[safeStage]}. ${scene.stageDescriptions[safeStage]}`}
        fallbackKind="cutaway"
        fallbackTitle={`${scene.title} 3D view unavailable`}
        fallbackMessage={`${scene.stageLabels[safeStage]}: ${scene.stageDescriptions[safeStage]}`}
        camera={{ position: [4.5, 3.15, 6.3], fov: 35, near: 0.1, far: 40 }}
        onStatusChange={onStatusChange}
      >
        <CutawayWorld
          condition={condition}
          stage={safeStage}
          showLabels={showLabels}
          reducedMotion={reducedMotion}
          interactive={interactive}
          resetKey={resetKey}
        />
      </ThreeCanvasShell>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          maxWidth: "min(230px, 58%)",
          padding: "7px 10px",
          border: `1px solid color-mix(in srgb, ${scene.accent} 50%, transparent)`,
          borderRadius: 999,
          background: "rgba(5, 16, 20, .74)",
          color: "#dfeae7",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 10,
          fontWeight: 680,
          lineHeight: 1.2,
          letterSpacing: ".055em",
          textTransform: "uppercase",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          pointerEvents: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        {scene.stageLabels[safeStage]}
      </div>

      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 12,
          padding: "7px 9px",
          borderRadius: 8,
          background: "rgba(4, 14, 18, .72)",
          color: "#aab9b5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 10,
          lineHeight: 1.3,
          letterSpacing: ".015em",
          pointerEvents: "none",
          backdropFilter: "blur(7px)",
        }}
      >
        Possible progression, not a prediction.
      </div>
    </div>
  );
}
