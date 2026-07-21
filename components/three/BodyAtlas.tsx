"use client";

/* eslint-disable react-hooks/immutability -- React Three Fiber animation is intentionally imperative. */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Billboard, ContactShadows, Html, OrbitControls } from "@react-three/drei";
import {
  Color,
  Group,
  MathUtils,
  MeshPhysicalMaterial,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ThreeCanvasShell } from "./SceneShell";
import type {
  AtlasRegion,
  BodyOrientation,
  BodyRegionId,
  SceneStatus,
} from "./types";

export const ATLAS_REGIONS: readonly AtlasRegion[] = [
  {
    id: "scalp_face",
    label: "Scalp & face",
    shortLabel: "Head",
    side: "front",
    position: [0.03, 2.52, 0.34],
    cameraTargetY: 2.34,
  },
  {
    id: "neck",
    label: "Neck",
    shortLabel: "Neck",
    side: "both",
    position: [-0.18, 1.92, 0.3],
    cameraTargetY: 1.82,
  },
  {
    id: "armpit",
    label: "Armpits",
    shortLabel: "Armpit",
    side: "front",
    position: [-0.72, 1.26, 0.18],
    cameraTargetY: 1.18,
  },
  {
    id: "chest_back",
    label: "Chest & back",
    shortLabel: "Torso",
    side: "both",
    position: [0.36, 1.2, 0.4],
    cameraTargetY: 1.15,
  },
  {
    id: "abdomen",
    label: "Abdomen",
    shortLabel: "Abdomen",
    side: "front",
    position: [-0.08, 0.35, 0.4],
    cameraTargetY: 0.32,
  },
  {
    id: "groin_fold",
    label: "Groin folds",
    shortLabel: "Groin",
    side: "front",
    position: [-0.43, -0.47, 0.27],
    cameraTargetY: -0.42,
  },
  {
    id: "buttock_skin",
    label: "Buttock skin",
    shortLabel: "Buttock",
    side: "back",
    position: [0.5, -0.38, -0.38],
    cameraTargetY: -0.38,
  },
  {
    id: "natal_cleft",
    label: "Top of buttock cleft",
    shortLabel: "Natal cleft",
    side: "back",
    position: [0, -0.48, -0.45],
    cameraTargetY: -0.5,
  },
  {
    id: "perianal",
    label: "Perianal area",
    shortLabel: "Perianal",
    side: "back",
    position: [-0.16, -0.84, -0.31],
    cameraTargetY: -0.75,
  },
  {
    id: "arms",
    label: "Arms",
    shortLabel: "Arm",
    side: "both",
    position: [0.95, 0.6, 0.08],
    cameraTargetY: 0.65,
  },
  {
    id: "wrist_hand",
    label: "Wrists & hands",
    shortLabel: "Wrist",
    side: "both",
    position: [-1.03, -0.55, 0.08],
    cameraTargetY: -0.44,
  },
  {
    id: "thighs_legs",
    label: "Thighs & legs",
    shortLabel: "Leg",
    side: "both",
    position: [0.38, -1.48, 0.25],
    cameraTargetY: -1.45,
  },
  {
    id: "knees",
    label: "Knees",
    shortLabel: "Knee",
    side: "front",
    position: [-0.39, -1.85, 0.28],
    cameraTargetY: -1.8,
  },
  {
    id: "ankles_feet",
    label: "Ankles & feet",
    shortLabel: "Foot",
    side: "both",
    position: [0.41, -2.78, 0.13],
    cameraTargetY: -2.48,
  },
] as const;

export type BodyAtlasProps = {
  selectedRegion?: BodyRegionId | null;
  onRegionSelect?: (region: BodyRegionId) => void;
  orientation?: BodyOrientation;
  onOrientationChange?: (orientation: BodyOrientation) => void;
  showLabels?: boolean;
  reducedMotion?: boolean;
  resetKey?: string | number;
  className?: string;
  onStatusChange?: (status: SceneStatus) => void;
};

type HotspotProps = {
  region: AtlasRegion;
  selected: boolean;
  showLabel: boolean;
  reducedMotion: boolean;
  orientation: BodyOrientation;
  onSelect: (region: AtlasRegion) => void;
};

function RegionHotspot({
  region,
  selected,
  showLabel,
  reducedMotion,
  orientation,
  onSelect,
}: HotspotProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();
  const z = region.side === "both"
    ? (orientation === "front" ? Math.abs(region.position[2]) : -Math.abs(region.position[2]))
    : region.position[2];
  const position: [number, number, number] = [
    region.position[0],
    region.position[1],
    z,
  ];
  const color = selected ? "#f1b76e" : hovered ? "#b8eee5" : "#72d6c8";

  useEffect(() => {
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [gl]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.4) * 0.06;
    const target = (selected ? 1.25 : hovered ? 1.14 : 1) * pulse;
    const scale = MathUtils.damp(group.current.scale.x, target, 9, delta);
    group.current.scale.setScalar(scale);
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(region);
  };

  return (
    <group ref={group} position={position}>
      <Billboard follow>
        <mesh
          onClick={handleClick}
          onPointerEnter={(event) => {
            event.stopPropagation();
            setHovered(true);
            gl.domElement.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            setHovered(false);
            gl.domElement.style.cursor = "";
          }}
        >
          <circleGeometry args={[0.105, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={selected ? 0.96 : 0.78}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <ringGeometry args={[0.13, 0.145, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.48} depthTest={false} />
        </mesh>
      </Billboard>
      {showLabel && (
        <Html
          center
          position={[
            region.position[0] < -0.2 ? -0.22 : 0.22,
            0,
            0,
          ]}
          distanceFactor={8.5}
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              padding: "5px 8px",
              border: `1px solid ${selected ? "rgba(241,183,110,.75)" : "rgba(121,215,202,.4)"}`,
              borderRadius: 999,
              background: "rgba(6,18,22,.82)",
              boxShadow: "0 8px 24px rgba(0,0,0,.25)",
              color: selected ? "#ffd6a5" : "#d8eee9",
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              fontSize: 9,
              fontWeight: 650,
              letterSpacing: ".035em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}
          >
            {region.shortLabel}
          </div>
        </Html>
      )}
    </group>
  );
}

type MannequinProps = {
  selectedRegion?: BodyRegionId | null;
  orientation: BodyOrientation;
  showLabels: boolean;
  reducedMotion: boolean;
  interactionPaused: boolean;
  onSelect: (region: AtlasRegion) => void;
};

function Mannequin({
  selectedRegion,
  orientation,
  showLabels,
  reducedMotion,
  interactionPaused,
  onSelect,
}: MannequinProps) {
  const idleGroup = useRef<Group>(null);
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color("#93c9c0"),
        emissive: new Color("#163b3d"),
        emissiveIntensity: 0.24,
        roughness: 0.3,
        metalness: 0.02,
        clearcoat: 0.72,
        clearcoatRoughness: 0.34,
        transmission: 0.12,
        thickness: 0.75,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }, delta) => {
    if (!idleGroup.current || reducedMotion || interactionPaused || selectedRegion) return;
    const target = Math.sin(clock.elapsedTime * 0.22) * 0.11;
    idleGroup.current.rotation.y = MathUtils.damp(
      idleGroup.current.rotation.y,
      target,
      1.1,
      delta,
    );
  });

  const part = (key: string, position: [number, number, number], scale: [number, number, number]) => (
    <mesh key={key} position={position} scale={scale} material={material} castShadow>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );

  return (
    <group ref={idleGroup}>
      <group>
        {part("head", [0, 2.42, 0], [0.34, 0.43, 0.32])}
        {part("jaw", [0, 2.16, 0.015], [0.27, 0.25, 0.25])}
        <mesh position={[0, 1.88, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.145, 0.23, 8, 18]} />
        </mesh>

        {part("chest", [0, 1.23, 0], [0.73, 0.82, 0.37])}
        {part("ribcage", [0, 0.92, 0], [0.62, 0.73, 0.34])}
        {part("waist", [0, 0.28, 0], [0.43, 0.53, 0.3])}
        {part("pelvis", [0, -0.31, 0], [0.66, 0.48, 0.39])}

        {part("shoulder-l", [-0.69, 1.42, 0], [0.31, 0.3, 0.3])}
        {part("shoulder-r", [0.69, 1.42, 0], [0.31, 0.3, 0.3])}
        <mesh
          position={[-0.86, 0.82, 0]}
          rotation={[0, 0, -0.08]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.17, 0.82, 8, 16]} />
        </mesh>
        <mesh
          position={[0.86, 0.82, 0]}
          rotation={[0, 0, 0.08]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.17, 0.82, 8, 16]} />
        </mesh>
        <mesh
          position={[-0.94, -0.03, 0]}
          rotation={[0, 0, -0.04]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.135, 0.72, 8, 16]} />
        </mesh>
        <mesh
          position={[0.94, -0.03, 0]}
          rotation={[0, 0, 0.04]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.135, 0.72, 8, 16]} />
        </mesh>
        <mesh position={[-0.98, -0.58, 0.035]} material={material} castShadow>
          <capsuleGeometry args={[0.105, 0.27, 8, 16]} />
        </mesh>
        <mesh position={[0.98, -0.58, 0.035]} material={material} castShadow>
          <capsuleGeometry args={[0.105, 0.27, 8, 16]} />
        </mesh>

        <mesh position={[-0.36, -1.17, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.255, 1.02, 10, 20]} />
        </mesh>
        <mesh position={[0.36, -1.17, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.255, 1.02, 10, 20]} />
        </mesh>
        {part("knee-l", [-0.37, -1.84, 0.015], [0.25, 0.25, 0.24])}
        {part("knee-r", [0.37, -1.84, 0.015], [0.25, 0.25, 0.24])}
        <mesh position={[-0.39, -2.31, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.19, 0.72, 10, 18]} />
        </mesh>
        <mesh position={[0.39, -2.31, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.19, 0.72, 10, 18]} />
        </mesh>
        <mesh
          position={[-0.39, -2.83, 0.12]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1.35, 1]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.15, 0.32, 8, 16]} />
        </mesh>
        <mesh
          position={[0.39, -2.83, 0.12]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1.35, 1]}
          material={material}
          castShadow
        >
          <capsuleGeometry args={[0.15, 0.32, 8, 16]} />
        </mesh>
      </group>

      {ATLAS_REGIONS.map((region) => {
        const visible = region.side === "both" || region.side === orientation;
        if (!visible) return null;
        return (
          <RegionHotspot
            key={region.id}
            region={region}
            selected={selectedRegion === region.id}
            showLabel={showLabels || selectedRegion === region.id}
            reducedMotion={reducedMotion}
            orientation={orientation}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

type AtlasControlsProps = {
  selectedRegion?: BodyRegionId | null;
  orientation: BodyOrientation;
  resetKey?: string | number;
  reducedMotion: boolean;
  onInteraction: () => void;
};

function AtlasControls({
  selectedRegion,
  orientation,
  resetKey,
  reducedMotion,
  onInteraction,
}: AtlasControlsProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const moving = useRef(true);
  const orbitAngle = useRef(0);
  const destinationAngle = useRef(0);
  const { camera } = useThree();
  const region = ATLAS_REGIONS.find((item) => item.id === selectedRegion);
  const desiredTarget = useMemo(
    () => new Vector3(region ? region.position[0] * 0.12 : 0, region?.cameraTargetY ?? -0.05, 0),
    [region],
  );
  const desiredDistance = region ? 4.25 : 6.25;
  const desiredY = (region?.cameraTargetY ?? -0.05) + (region ? 0.12 : 0.08);

  useEffect(() => {
    const controlTarget = controls.current?.target ?? desiredTarget;
    const current = Math.atan2(
      camera.position.x - controlTarget.x,
      camera.position.z - controlTarget.z,
    );
    let target = orientation === "front" ? 0 : Math.PI;
    while (target - current > Math.PI) target -= Math.PI * 2;
    while (target - current < -Math.PI) target += Math.PI * 2;
    orbitAngle.current = current;
    destinationAngle.current = target;
    moving.current = true;
  }, [camera, desiredDistance, desiredTarget, orientation, resetKey]);

  useFrame((_state, delta) => {
    const control = controls.current;
    if (!control || !moving.current) return;
    const speed = reducedMotion ? 18 : 5.8;
    control.target.x = MathUtils.damp(control.target.x, desiredTarget.x, speed, delta);
    control.target.y = MathUtils.damp(control.target.y, desiredTarget.y, speed, delta);
    control.target.z = MathUtils.damp(control.target.z, desiredTarget.z, speed, delta);
    orbitAngle.current = MathUtils.damp(
      orbitAngle.current,
      destinationAngle.current,
      speed,
      delta,
    );
    const currentDistance = Math.hypot(
      camera.position.x - control.target.x,
      camera.position.z - control.target.z,
    );
    const distance = MathUtils.damp(currentDistance, desiredDistance, speed, delta);
    camera.position.x = control.target.x + Math.sin(orbitAngle.current) * distance;
    camera.position.y = MathUtils.damp(camera.position.y, desiredY, speed, delta);
    camera.position.z = control.target.z + Math.cos(orbitAngle.current) * distance;
    control.update();
    if (
      Math.abs(distance - desiredDistance) < 0.001 &&
      Math.abs(orbitAngle.current - destinationAngle.current) < 0.001 &&
      control.target.distanceToSquared(desiredTarget) < 0.0005
    ) {
      moving.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.075}
      minDistance={3.55}
      maxDistance={7.25}
      minPolarAngle={0.72}
      maxPolarAngle={2.42}
      rotateSpeed={0.65}
      zoomSpeed={0.65}
      onStart={() => {
        moving.current = false;
        onInteraction();
      }}
    />
  );
}

type AtlasSceneProps = Omit<BodyAtlasProps, "className" | "onStatusChange"> & {
  orientation: BodyOrientation;
  onSelect: (region: AtlasRegion) => void;
};

function AtlasScene({
  selectedRegion,
  orientation,
  showLabels = true,
  reducedMotion = false,
  resetKey,
  onSelect,
}: AtlasSceneProps) {
  const [interactionPaused, setInteractionPaused] = useState(false);

  return (
    <>
      <fog attach="fog" args={["#071216", 6.4, 11]} />
      <ambientLight intensity={1.15} color="#d8f4ed" />
      <hemisphereLight args={["#b7f1e6", "#102329", 1.3]} />
      <spotLight
        position={[3.8, 5.4, 4.5]}
        angle={0.42}
        penumbra={0.9}
        intensity={42}
        color="#f4eee2"
        castShadow
      />
      <pointLight position={[-3, 1.5, -2.5]} intensity={9} color="#4db9b4" />
      <pointLight position={[2.4, -1.4, 2]} intensity={5} color="#dca469" />
      <Mannequin
        selectedRegion={selectedRegion}
        orientation={orientation}
        showLabels={showLabels}
        reducedMotion={reducedMotion}
        interactionPaused={interactionPaused}
        onSelect={(region) => {
          setInteractionPaused(true);
          onSelect(region);
        }}
      />
      <ContactShadows
        position={[0, -3.05, 0]}
        opacity={0.32}
        scale={5.5}
        blur={2.6}
        far={4.5}
        color="#000b0e"
      />
      <mesh position={[0, -3.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#0a1a1f" roughness={0.92} />
      </mesh>
      <AtlasControls
        selectedRegion={selectedRegion}
        orientation={orientation}
        resetKey={resetKey}
        reducedMotion={reducedMotion}
        onInteraction={() => setInteractionPaused(true)}
      />
    </>
  );
}

/**
 * Interactive, procedural body-location atlas. Pair it with an accessible
 * region list: canvas meshes are intentionally a visual enhancement.
 */
export function BodyAtlas({
  selectedRegion,
  onRegionSelect,
  orientation: controlledOrientation,
  onOrientationChange,
  showLabels = true,
  reducedMotion = false,
  resetKey,
  className,
  onStatusChange,
}: BodyAtlasProps) {
  const [internalOrientation, setInternalOrientation] = useState<BodyOrientation>("front");
  const orientation = controlledOrientation ?? internalOrientation;

  const handleSelect = useCallback(
    (region: AtlasRegion) => {
      if (region.side !== "both" && region.side !== orientation) {
        setInternalOrientation(region.side);
        onOrientationChange?.(region.side);
      }
      onRegionSelect?.(region.id);
    },
    [onOrientationChange, onRegionSelect, orientation],
  );

  return (
    <ThreeCanvasShell
      className={className}
      ariaLabel="Interactive gender-neutral body map. Drag to rotate, scroll to zoom, or use the region list outside the model."
      fallbackKind="body"
      fallbackTitle="The 3D body map could not load"
      fallbackMessage="You can still explore every location with the accessible region list."
      camera={{ position: [0, 0, 6.25], fov: 34, near: 0.1, far: 40 }}
      onStatusChange={onStatusChange}
    >
      <AtlasScene
        key={resetKey ?? "body-atlas"}
        selectedRegion={selectedRegion}
        orientation={orientation}
        showLabels={showLabels}
        reducedMotion={reducedMotion}
        resetKey={resetKey}
        onSelect={handleSelect}
      />
    </ThreeCanvasShell>
  );
}
