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
  Vector2,
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
  const color = selected ? "#d97954" : hovered ? "#f3eee5" : "#a9bbb4";

  useEffect(() => {
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [gl]);

  useFrame((_state, delta) => {
    if (!group.current) return;
    const target = selected ? 1.1 : hovered ? 1.06 : 1;
    const scale = MathUtils.damp(
      group.current.scale.x,
      target,
      reducedMotion ? 18 : 9,
      delta,
    );
    group.current.scale.setScalar(scale);
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(region);
  };

  return (
    <group ref={group} position={position}>
      <Billboard follow>
        {selected && (
          <mesh position={[0, 0, -0.012]}>
            <circleGeometry args={[0.16, 32]} />
            <meshBasicMaterial
              color="#d97954"
              transparent
              opacity={0.1}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        )}
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
          <circleGeometry args={[selected ? 0.075 : 0.048, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={selected ? 0.96 : hovered ? 0.82 : 0.2}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <ringGeometry args={[selected ? 0.098 : 0.068, selected ? 0.11 : 0.077, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={selected ? 0.72 : hovered ? 0.46 : 0.12}
            depthTest={false}
          />
        </mesh>
      </Billboard>
      {(showLabel || hovered) && (
        <Html
          center
          position={[
            region.position[0] < -0.2 ? -0.22 : 0.22,
            0,
            0,
          ]}
          distanceFactor={7.1}
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              padding: "5px 7px 5px 8px",
              borderTop: `1px solid ${selected ? "rgba(217,121,84,.7)" : "rgba(225,220,210,.24)"}`,
              borderRight: `1px solid ${selected ? "rgba(217,121,84,.7)" : "rgba(225,220,210,.24)"}`,
              borderBottom: `1px solid ${selected ? "rgba(217,121,84,.7)" : "rgba(225,220,210,.24)"}`,
              borderLeft: `2px solid ${selected ? "rgba(217,121,84,.7)" : "rgba(225,220,210,.24)"}`,
              borderRadius: 1,
              background: "rgba(9,14,17,.92)",
              boxShadow: "0 5px 16px rgba(0,0,0,.18)",
              color: selected ? "#f2c3ac" : "#e4e0d7",
              fontFamily: "var(--font-display), sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: ".06em",
              lineHeight: 1.05,
              textTransform: "uppercase",
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
  onSelect,
}: MannequinProps) {
  const materials = useMemo(() => {
    const body = new MeshPhysicalMaterial({
      color: new Color("#bcae9f"),
      emissive: new Color("#151311"),
      emissiveIntensity: 0.025,
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0,
      sheen: 0.06,
      sheenColor: new Color("#ead8c8"),
      sheenRoughness: 0.96,
    });
    const plane = new MeshPhysicalMaterial({
      color: new Color("#9c897d"),
      emissive: new Color("#332b28"),
      emissiveIntensity: 0.05,
      roughness: 0.7,
      clearcoat: 0.05,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });
    const shadow = new MeshPhysicalMaterial({
      color: new Color("#75675f"),
      roughness: 0.82,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    return { body, plane, shadow };
  }, []);
  const torsoProfile = useMemo(
    () => [
      new Vector2(0.39, -0.64),
      new Vector2(0.55, -0.56),
      new Vector2(0.66, -0.36),
      new Vector2(0.63, -0.16),
      new Vector2(0.49, 0.06),
      new Vector2(0.47, 0.34),
      new Vector2(0.53, 0.66),
      new Vector2(0.62, 0.92),
      new Vector2(0.7, 1.2),
      new Vector2(0.72, 1.38),
      new Vector2(0.56, 1.51),
      new Vector2(0.32, 1.62),
      new Vector2(0.22, 1.64),
    ],
    [],
  );
  const limbProfiles = useMemo(
    () => ({
      upperArm: [
        new Vector2(0.125, -0.53),
        new Vector2(0.145, -0.33),
        new Vector2(0.17, -0.02),
        new Vector2(0.19, 0.3),
        new Vector2(0.155, 0.53),
      ],
      forearm: [
        new Vector2(0.08, -0.42),
        new Vector2(0.095, -0.28),
        new Vector2(0.13, -0.02),
        new Vector2(0.145, 0.22),
        new Vector2(0.11, 0.41),
      ],
      thigh: [
        new Vector2(0.175, -0.68),
        new Vector2(0.205, -0.48),
        new Vector2(0.245, -0.12),
        new Vector2(0.275, 0.32),
        new Vector2(0.225, 0.68),
      ],
      calf: [
        new Vector2(0.095, -0.45),
        new Vector2(0.12, -0.29),
        new Vector2(0.17, -0.04),
        new Vector2(0.18, 0.2),
        new Vector2(0.125, 0.44),
      ],
    }),
    [],
  );

  useEffect(
    () => () => {
      materials.body.dispose();
      materials.plane.dispose();
      materials.shadow.dispose();
    },
    [materials],
  );

  const part = (
    key: string,
    position: [number, number, number],
    scale: [number, number, number],
    material = materials.body,
    rotation?: [number, number, number],
  ) => (
    <mesh
      key={key}
      position={position}
      rotation={rotation}
      scale={scale}
      material={material}
      castShadow
    >
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  );

  return (
    <group>
      <group>
        {/* The head uses overlapping cranial, facial, and jaw volumes so the
            front reads immediately without turning into a literal portrait. */}
        {part("cranium", [0, 2.46, -0.015], [0.29, 0.37, 0.28])}
        {part("face", [0, 2.31, 0.08], [0.24, 0.265, 0.23])}
        {part("jaw", [0, 2.14, 0.035], [0.205, 0.17, 0.195])}
        {part("ear-l", [-0.272, 2.36, 0], [0.038, 0.09, 0.048], materials.plane)}
        {part("ear-r", [0.272, 2.36, 0], [0.038, 0.09, 0.048], materials.plane)}
        {part("nose", [0, 2.37, 0.292], [0.045, 0.078, 0.06], materials.plane)}
        {part("brow-l", [-0.088, 2.46, 0.272], [0.078, 0.018, 0.022], materials.plane, [0, 0, -0.05])}
        {part("brow-r", [0.088, 2.46, 0.272], [0.078, 0.018, 0.022], materials.plane, [0, 0, 0.05])}

        <mesh position={[0, 1.89, 0]} material={materials.body} castShadow>
          <cylinderGeometry args={[0.165, 0.215, 0.48, 32]} />
        </mesh>

        {/* A single continuous trunk profile replaces the stacked-ball torso.
            The compressed depth keeps it anatomical in front and side views. */}
        <mesh scale={[1, 1, 0.58]} material={materials.body} castShadow>
          <latheGeometry args={[torsoProfile, 64]} />
        </mesh>
        {part("shoulder-l", [-0.67, 1.34, 0], [0.225, 0.285, 0.245], materials.body, [0, 0, -0.12])}
        {part("shoulder-r", [0.67, 1.34, 0], [0.225, 0.285, 0.245], materials.body, [0, 0, 0.12])}

        {/* Quiet surface landmarks make the mannequin feel sculpted, not
            assembled, while remaining gender-neutral and non-diagnostic. */}
        <mesh
          position={[-0.22, 1.4, 0.368]}
          rotation={[0, 0, Math.PI / 2 - 0.14]}
          material={materials.plane}
        >
          <capsuleGeometry args={[0.014, 0.28, 5, 12]} />
        </mesh>
        <mesh
          position={[0.22, 1.4, 0.368]}
          rotation={[0, 0, Math.PI / 2 + 0.14]}
          material={materials.plane}
        >
          <capsuleGeometry args={[0.014, 0.28, 5, 12]} />
        </mesh>
        <mesh position={[0, 0.98, 0.355]} material={materials.shadow}>
          <capsuleGeometry args={[0.018, 0.5, 6, 14]} />
        </mesh>
        {part("abdomen-plane", [0, 0.28, 0.285], [0.32, 0.4, 0.035], materials.plane)}
        {part("scapula-l", [-0.28, 1.08, -0.35], [0.24, 0.32, 0.04], materials.plane, [0.08, 0, -0.12])}
        {part("scapula-r", [0.28, 1.08, -0.35], [0.24, 0.32, 0.04], materials.plane, [0.08, 0, 0.12])}
        <mesh position={[0, 0.48, -0.31]} material={materials.shadow}>
          <capsuleGeometry args={[0.016, 0.78, 6, 14]} />
        </mesh>
        {part("glute-l", [-0.25, -0.38, -0.2], [0.34, 0.35, 0.22])}
        {part("glute-r", [0.25, -0.38, -0.2], [0.34, 0.35, 0.22])}
        <mesh position={[0, -0.47, -0.405]} material={materials.shadow}>
          <capsuleGeometry args={[0.017, 0.43, 6, 14]} />
        </mesh>

        {/* Arms carry a relaxed anatomical stance: rounded deltoid, soft
            elbow, tapered forearm, and a distinct palm instead of tubes. */}
        <mesh position={[-0.8, 0.89, 0]} rotation={[0, 0, -0.11]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.upperArm, 32]} />
        </mesh>
        <mesh position={[0.8, 0.89, 0]} rotation={[0, 0, 0.11]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.upperArm, 32]} />
        </mesh>
        {part("elbow-l", [-0.86, 0.35, 0], [0.118, 0.125, 0.12])}
        {part("elbow-r", [0.86, 0.35, 0], [0.118, 0.125, 0.12])}
        <mesh
          position={[-0.91, -0.04, 0]}
          rotation={[0, 0, -0.04]}
          material={materials.body}
          castShadow
        >
          <latheGeometry args={[limbProfiles.forearm, 32]} />
        </mesh>
        <mesh
          position={[0.91, -0.04, 0]}
          rotation={[0, 0, 0.04]}
          material={materials.body}
          castShadow
        >
          <latheGeometry args={[limbProfiles.forearm, 32]} />
        </mesh>
        <mesh position={[-0.95, -0.48, 0.015]} material={materials.body} castShadow>
          <cylinderGeometry args={[0.085, 0.1, 0.2, 24]} />
        </mesh>
        <mesh position={[0.95, -0.48, 0.015]} material={materials.body} castShadow>
          <cylinderGeometry args={[0.085, 0.1, 0.2, 24]} />
        </mesh>
        {part("palm-l", [-0.97, -0.67, 0.045], [0.105, 0.235, 0.078], materials.body, [0.02, 0, -0.02])}
        {part("palm-r", [0.97, -0.67, 0.045], [0.105, 0.235, 0.078], materials.body, [0.02, 0, 0.02])}
        {part("thumb-l", [-0.875, -0.62, 0.055], [0.043, 0.115, 0.052], materials.body, [0, 0, -0.32])}
        {part("thumb-r", [0.875, -0.62, 0.055], [0.043, 0.115, 0.052], materials.body, [0, 0, 0.32])}

        {/* Hips flow into broad proximal thighs, then narrow through the knee
            before the calf and ankle. Small front kneecaps add orientation. */}
        <mesh position={[-0.31, -1.17, 0]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.thigh, 36]} />
        </mesh>
        <mesh position={[0.31, -1.17, 0]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.thigh, 36]} />
        </mesh>
        {part("knee-l", [-0.32, -1.82, 0.015], [0.205, 0.205, 0.195])}
        {part("knee-r", [0.32, -1.82, 0.015], [0.205, 0.205, 0.195])}
        {part("patella-l", [-0.32, -1.82, 0.19], [0.12, 0.145, 0.055], materials.plane)}
        {part("patella-r", [0.32, -1.82, 0.19], [0.12, 0.145, 0.055], materials.plane)}
        <mesh position={[-0.33, -2.29, 0]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.calf, 32]} />
        </mesh>
        <mesh position={[0.33, -2.29, 0]} material={materials.body} castShadow>
          <latheGeometry args={[limbProfiles.calf, 32]} />
        </mesh>
        <mesh position={[-0.34, -2.72, 0]} material={materials.body} castShadow>
          <cylinderGeometry args={[0.105, 0.125, 0.25, 24]} />
        </mesh>
        <mesh position={[0.34, -2.72, 0]} material={materials.body} castShadow>
          <cylinderGeometry args={[0.105, 0.125, 0.25, 24]} />
        </mesh>
        <mesh
          position={[-0.34, -2.88, 0.14]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1.28, 1]}
          material={materials.body}
          castShadow
        >
          <capsuleGeometry args={[0.135, 0.33, 8, 18]} />
        </mesh>
        <mesh
          position={[0.34, -2.88, 0.14]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1.28, 1]}
          material={materials.body}
          castShadow
        >
          <capsuleGeometry args={[0.135, 0.33, 8, 18]} />
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
            showLabel={showLabels && selectedRegion === region.id}
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
    () =>
      new Vector3(
        region ? region.position[0] * 0.045 : 0,
        region ? -0.05 + (region.cameraTargetY + 0.05) * 0.16 : -0.05,
        0,
      ),
    [region],
  );
  const desiredDistance = region ? 9.35 : 9.7;
  const desiredY = desiredTarget.y + 0.08;

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
      minDistance={6.8}
      maxDistance={11.4}
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
      <fog attach="fog" args={["#0b1112", 9.2, 16]} />
      <ambientLight intensity={1.25} color="#eee6dc" />
      <hemisphereLight args={["#d9dfda", "#2b2523", 1.05]} />
      <spotLight
        position={[3.8, 5.4, 4.5]}
        angle={0.42}
        penumbra={0.9}
        intensity={36}
        color="#ffe9d6"
        castShadow
      />
      <pointLight position={[-3, 1.5, -2.5]} intensity={6} color="#819b96" />
      <pointLight position={[2.4, -1.4, 2]} intensity={4} color="#c78364" />
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
      camera={{ position: [0, 0, 9.7], fov: 34, near: 0.1, far: 40 }}
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
