"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Group,
  MathUtils,
  Shape,
  Vector3,
} from "three";
import type { CutawaySceneId, CutawayStage } from "../types";

type Point = readonly [number, number, number];

const ReducedMotionContext = createContext(false);

const COLORS = {
  epidermis: "#efb18d",
  dermis: "#d88983",
  dermisDark: "#a95d62",
  fat: "#efc766",
  fascia: "#e8dfd1",
  muscle: "#a75d5d",
  follicle: "#85545b",
  hair: "#46352f",
  sebum: "#d69c72",
  inflammation: "#d95f4a",
  fluid: "#dfb96a",
  cyst: "#7392a4",
  joint: "#d3d8d5",
  tendon: "#77a49c",
} as const;

const FRONT_Z = 1.38;
const TISSUE_DEPTH = 2.72;

type AnimatedGroupProps = {
  children: ReactNode;
  target: number;
  position?: Point;
  rotation?: Point;
  speed?: number;
};

function AnimatedGroup({
  children,
  target,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  speed = 6,
}: AnimatedGroupProps) {
  const ref = useRef<Group>(null);
  const reducedMotion = useContext(ReducedMotionContext);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    const next = reducedMotion
      ? Math.max(0.001, target)
      : MathUtils.damp(ref.current.scale.x, Math.max(0.001, target), speed, delta);
    ref.current.scale.setScalar(next);
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      scale={reducedMotion ? Math.max(0.001, target) : 0.001}
    >
      {children}
    </group>
  );
}

type TubeProps = {
  points: readonly Point[];
  radius: number;
  color: string;
  opacity?: number;
  radialSegments?: number;
  tubularSegments?: number;
};

function Tube({
  points,
  radius,
  color,
  opacity = 1,
  radialSegments = 8,
  tubularSegments = 30,
}: TubeProps) {
  const pathKey = points.flat().join(":");
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))),
    // pathKey is a stable numeric representation of the curve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathKey],
  );

  return (
    <mesh>
      <tubeGeometry args={[curve, tubularSegments, radius, radialSegments, false]} />
      <meshStandardMaterial
        color={color}
        roughness={0.86}
        metalness={0}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 0.55}
      />
    </mesh>
  );
}

type SceneLabelProps = {
  position: Point;
  title: string;
  accent?: string;
  align?: "left" | "right";
};

function SceneLabel({
  position,
  title,
  accent = "#147a78",
  align = "left",
}: SceneLabelProps) {
  const { size } = useThree();
  const narrowViewport = size.width / Math.max(size.height, 1) < 0.82;
  const safePosition: Point = [
    MathUtils.clamp(position[0], narrowViewport ? -1.45 : -1.55, narrowViewport ? 1.45 : 1.55),
    position[1],
    position[2],
  ];

  return (
    <Html
      position={safePosition}
      center
      distanceFactor={narrowViewport ? 6 : 4.7}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: align === "left" ? "row" : "row-reverse",
          gap: 8,
          padding: "5px 7px",
          border: "1px solid rgba(20,61,119,.12)",
          borderRadius: 3,
          background: "rgba(255,250,241,.9)",
          boxShadow: "0 5px 16px rgba(8,42,102,.09)",
          color: "#082a66",
          fontFamily: "var(--font-display), sans-serif",
          fontSize: narrowViewport ? 11.5 : 10.5,
          fontWeight: 600,
          letterSpacing: ".045em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          backdropFilter: "blur(7px)",
        }}
      >
        <span
          style={{
            width: 18,
            height: 2,
            display: "block",
            background: accent,
            borderRadius: 99,
          }}
        />
        <span>{title}</span>
      </div>
    </Html>
  );
}

type ProfilePoint = readonly [number, number];

const PROFILE_X = [
  -2.7, -2.3, -1.85, -1.4, -0.95, -0.58, -0.3, 0, 0.3, 0.58, 0.95, 1.4,
  1.85, 2.3, 2.7,
] as const;

const SURFACE_VARIATION = [
  0, 0.025, -0.018, 0.034, -0.012, 0.018, -0.01, 0.012, -0.014, 0.02,
  -0.008, 0.026, -0.016, 0.022, 0,
] as const;

function makeProfile(
  getY: (x: number, index: number) => number,
): readonly ProfilePoint[] {
  return PROFILE_X.map((x, index) => [x, getY(x, index)] as const);
}

const FLAT_SURFACE = makeProfile(
  (_x, index) => 1.045 + SURFACE_VARIATION[index],
);
const FLAT_EPIDERMIS_BASE = makeProfile(
  (_x, index) => 0.915 + SURFACE_VARIATION[index] * 0.7,
);
const FLAT_DERMIS_BASE = makeProfile(
  (x, index) => 0.05 + Math.sin(x * 2.2) * 0.025 + SURFACE_VARIATION[index] * 0.3,
);
const FAT_BASE = makeProfile((x) => -0.92 + Math.sin(x * 1.45) * 0.025);
const FASCIA_BASE = makeProfile((x) => -1.075 + Math.sin(x * 1.7 + 0.5) * 0.018);
const MUSCLE_BASE = makeProfile((x) => -1.62 + Math.sin(x * 1.1) * 0.018);

const CLEFT_SURFACE = makeProfile((x, index) => {
  const cleft = 1.12 * Math.exp(-(x * x) / 0.18);
  return 1.045 + SURFACE_VARIATION[index] * 0.55 - cleft;
});
const CLEFT_EPIDERMIS_BASE = makeProfile((x, index) => {
  const cleft = 1.09 * Math.exp(-(x * x) / 0.18);
  return 0.91 + SURFACE_VARIATION[index] * 0.35 - cleft;
});
const CLEFT_DERMIS_BASE = makeProfile((x, index) => {
  const cleft = 0.7 * Math.exp(-(x * x) / 0.31);
  return 0.055 + SURFACE_VARIATION[index] * 0.2 - cleft;
});

const FOLD_SURFACE = makeProfile((x, index) => {
  const leftFold = 0.21 * Math.exp(-((x + 0.72) ** 2) / 0.32);
  const rightFold = 0.21 * Math.exp(-((x - 0.72) ** 2) / 0.32);
  const valley = 0.18 * Math.exp(-(x * x) / 0.08);
  return 1.035 + SURFACE_VARIATION[index] * 0.65 + leftFold + rightFold - valley;
});
const FOLD_EPIDERMIS_BASE = makeProfile((x, index) => {
  const leftFold = 0.18 * Math.exp(-((x + 0.72) ** 2) / 0.35);
  const rightFold = 0.18 * Math.exp(-((x - 0.72) ** 2) / 0.35);
  const valley = 0.15 * Math.exp(-(x * x) / 0.1);
  return 0.9 + SURFACE_VARIATION[index] * 0.42 + leftFold + rightFold - valley;
});
const FOLD_DERMIS_BASE = makeProfile(
  (x, index) => 0.045 + Math.sin(x * 2) * 0.02 + SURFACE_VARIATION[index] * 0.15,
);

const JOINT_SURFACE = makeProfile(
  (_x, index) => 1.05 + SURFACE_VARIATION[index] * 0.65,
);
const JOINT_EPIDERMIS_BASE = makeProfile(
  (_x, index) => 0.92 + SURFACE_VARIATION[index] * 0.42,
);
const JOINT_DERMIS_BASE = makeProfile((x) => 0.49 + Math.sin(x * 1.6) * 0.02);
const JOINT_FAT_BASE = makeProfile((x) => 0.18 + Math.sin(x * 1.35 + 0.4) * 0.018);

function profileAt(profile: readonly ProfilePoint[], x: number) {
  for (let index = 1; index < profile.length; index += 1) {
    const left = profile[index - 1];
    const right = profile[index];
    if (x <= right[0]) {
      const progress = (x - left[0]) / (right[0] - left[0]);
      return MathUtils.lerp(left[1], right[1], MathUtils.clamp(progress, 0, 1));
    }
  }
  return profile[profile.length - 1][1];
}

function TissueBand({
  top,
  bottom,
  color,
  roughness = 0.9,
}: {
  top: readonly ProfilePoint[];
  bottom: readonly ProfilePoint[];
  color: string;
  roughness?: number;
}) {
  const profileKey = `${top.flat().join(":")}|${bottom.flat().join(":")}`;
  const shape = useMemo(() => {
    const next = new Shape();
    next.moveTo(top[0][0], top[0][1]);
    top.slice(1).forEach(([x, y]) => next.lineTo(x, y));
    [...bottom].reverse().forEach(([x, y]) => next.lineTo(x, y));
    next.closePath();
    return next;
    // profileKey is a stable numeric representation of both contours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);
  const extrusion = useMemo(
    () => ({
      depth: TISSUE_DEPTH,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.014,
      bevelSegments: 2,
      curveSegments: 2,
    }),
    [],
  );

  return (
    <mesh position={[0, 0, -TISSUE_DEPTH / 2]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, extrusion]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
    </mesh>
  );
}

function LayerOutlines({
  profiles,
}: {
  profiles: readonly { profile: readonly ProfilePoint[]; color: string; opacity?: number }[];
}) {
  return (
    <group>
      {profiles.map(({ profile, color, opacity = 0.34 }, index) => (
        <Tube
          key={`${index}-${color}`}
          points={profile.map(([x, y]) => [x, y, FRONT_Z + 0.035] as const)}
          radius={index === 0 ? 0.017 : 0.012}
          color={color}
          opacity={opacity}
          radialSegments={5}
          tubularSegments={36}
        />
      ))}
    </group>
  );
}

function MicroVessels({
  top,
  bottom,
}: {
  top: readonly ProfilePoint[];
  bottom: readonly ProfilePoint[];
}) {
  const profileKey = `${top.flat().join(":")}|${bottom.flat().join(":")}`;
  const vessels = useMemo(() => {
    const xs = [-2.42, -1.82, -1.18, -0.52, 0.14, 0.8, 1.46, 2.12, 2.46];
    const makeVessel = (fraction: number, phase: number) => xs.map((x, index) => {
      const low = profileAt(bottom, x);
      const high = profileAt(top, x);
      return [
        x,
        MathUtils.lerp(low, high, fraction) + Math.sin(index * 1.18 + phase) * 0.028,
        FRONT_Z + 0.045,
      ] as const;
    });
    return [makeVessel(0.28, 0), makeVessel(0.43, 1.2)] as const;
    // profileKey is a stable numeric representation of both contours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);

  return (
    <group>
      <Tube points={vessels[0]} radius={0.014} color="#bb6e68" opacity={0.66} radialSegments={5} />
      <Tube points={vessels[1]} radius={0.012} color="#5f9598" opacity={0.58} radialSegments={5} />
      {[-1.58, -0.36, 0.92, 1.82].map((x, index) => {
        const low = profileAt(bottom, x);
        const high = profileAt(top, x);
        const start = MathUtils.lerp(low, high, index % 2 ? 0.42 : 0.28);
        return (
          <Tube
            key={x}
            points={[
              [x - 0.18, start, FRONT_Z + 0.043],
              [x, start + 0.13, FRONT_Z + 0.047],
              [x + 0.16, start + 0.22, FRONT_Z + 0.04],
            ]}
            radius={0.008}
            color={index % 2 ? "#5f9598" : "#bb6e68"}
            opacity={0.48}
            radialSegments={5}
            tubularSegments={12}
          />
        );
      })}
    </group>
  );
}

function DermalFibers({
  top,
  bottom,
}: {
  top: readonly ProfilePoint[];
  bottom: readonly ProfilePoint[];
}) {
  const profileKey = `${top.flat().join(":")}|${bottom.flat().join(":")}`;
  const paths = useMemo(() => {
    const pathX = [-2.46, -1.72, -0.88, 0, 0.88, 1.72, 2.46];
    return [0.23, 0.41, 0.59, 0.76].map((fraction, row) =>
      pathX.map((x, index) => {
        const low = profileAt(bottom, x);
        const high = profileAt(top, x);
        const wave = Math.sin(index * 1.7 + row * 0.9) * 0.018;
        return [x, MathUtils.lerp(low, high, fraction) + wave, FRONT_Z + 0.014] as const;
      }),
    );
    // profileKey is a stable numeric representation of both contours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);

  return (
    <group>
      {paths.map((points, index) => (
        <Tube
          key={index}
          points={points}
          radius={index % 2 === 0 ? 0.012 : 0.009}
          color={index % 2 === 0 ? "#aa6266" : "#efb0a1"}
          opacity={0.38}
          radialSegments={5}
          tubularSegments={22}
        />
      ))}
    </group>
  );
}

function SkinSurfaceDetail({ surface }: { surface: readonly ProfilePoint[] }) {
  const poreX = [-2.32, -1.78, -1.19, -0.72, 0.65, 1.18, 1.76, 2.31];
  const relief = [
    [-2.18, -0.86], [-1.72, 0.18], [-1.26, 0.84], [-0.82, -0.36], [-0.4, 0.52],
    [0.38, -0.78], [0.74, 0.18], [1.16, 0.88], [1.62, -0.42], [2.08, 0.44],
  ] as const;
  return (
    <group>
      {relief.map(([x, z], index) => (
        <mesh
          key={`${x}-${z}`}
          position={[x, profileAt(surface, x) + 0.008, z]}
          rotation={[0, (index * 0.71) % Math.PI, 0]}
          scale={[0.22 + (index % 3) * 0.035, 0.018 + (index % 2) * 0.006, 0.15 + (index % 4) * 0.018]}
        >
          <sphereGeometry args={[1, 12, 7]} />
          <meshStandardMaterial color={index % 3 === 0 ? "#d49378" : "#efb28f"} roughness={1} />
        </mesh>
      ))}
      {poreX.map((x, index) => (
        <mesh
          key={x}
          position={[x, profileAt(surface, x) - 0.015, FRONT_Z + 0.025]}
          scale={[0.038 + (index % 3) * 0.006, 0.018, 0.012]}
        >
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color="#9a6259" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function FatLobules({ top }: { top: readonly ProfilePoint[] }) {
  const topKey = top.flat().join(":");
  const lobules = useMemo(() => {
    const rowY = [-0.16, -0.46, -0.76];
    return Array.from({ length: 30 }, (_, index) => {
      const column = index % 10;
      const row = Math.floor(index / 10);
      const x = -2.42 + column * 0.54 + (row % 2 ? 0.18 : -0.03);
      const y = rowY[row] + Math.sin(index * 1.83) * 0.045;
      const sx = 0.2 + ((index * 7) % 5) * 0.012;
      const sy = 0.15 + ((index * 11) % 4) * 0.014;
      return { x, y, sx, sy, visible: y + sy < profileAt(top, x) + 0.055 };
    }).filter((item) => item.visible);
    // topKey is a stable numeric representation of the fat boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topKey]);

  return (
    <group>
      {lobules.map((item, index) => (
        <mesh
          key={`${item.x}-${item.y}`}
          position={[item.x, item.y, FRONT_Z + 0.012]}
          rotation={[0, 0, Math.sin(index * 2.1) * 0.34]}
          scale={[item.sx * 1.28, item.sy, 0.075 + (index % 3) * 0.009]}
          castShadow
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial
            color={index % 4 === 0 ? "#f5d580" : index % 3 === 0 ? "#dfb650" : COLORS.fat}
            roughness={0.94}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function MuscleStriations() {
  const fibers = useMemo(
    () =>
      [-2.55, -1.88, -1.2, -0.53, 0.14, 0.81, 1.48, 2.15].map((x, index) => [
        [x, -1.56, FRONT_Z + 0.015],
        [x + 0.18, -1.46 + Math.sin(index) * 0.015, FRONT_Z + 0.018],
        [x + 0.38, -1.34 + Math.cos(index) * 0.012, FRONT_Z + 0.016],
        [x + 0.62, -1.16, FRONT_Z + 0.014],
      ] as readonly Point[]),
    [],
  );
  return (
    <group>
      {fibers.map((points, index) => (
        <Tube
          key={index}
          points={points}
          radius={0.018}
          color={index % 2 === 0 ? "#c97875" : "#df9690"}
          opacity={0.46}
          radialSegments={5}
          tubularSegments={16}
        />
      ))}
    </group>
  );
}

type TissueBaseProps = {
  showLabels: boolean;
  variant?: "flat" | "cleft" | "fold" | "joint";
};

function FlatTissue({ showLabels }: { showLabels: boolean }) {
  return (
    <group>
      <TissueBand top={FLAT_SURFACE} bottom={FLAT_EPIDERMIS_BASE} color={COLORS.epidermis} roughness={0.96} />
      <TissueBand top={FLAT_EPIDERMIS_BASE} bottom={FLAT_DERMIS_BASE} color={COLORS.dermis} roughness={0.93} />
      <TissueBand top={FLAT_DERMIS_BASE} bottom={FAT_BASE} color="#d9ad52" roughness={0.98} />
      <TissueBand top={FAT_BASE} bottom={FASCIA_BASE} color={COLORS.fascia} roughness={0.91} />
      <TissueBand top={FASCIA_BASE} bottom={MUSCLE_BASE} color={COLORS.muscle} roughness={0.96} />
      <LayerOutlines profiles={[
        { profile: FLAT_EPIDERMIS_BASE, color: "#b66d62", opacity: 0.42 },
        { profile: FLAT_DERMIS_BASE, color: "#9f5d61" },
        { profile: FAT_BASE, color: "#b98a3d" },
        { profile: FASCIA_BASE, color: "#9f8e82", opacity: 0.28 },
      ]} />
      <DermalFibers top={FLAT_EPIDERMIS_BASE} bottom={FLAT_DERMIS_BASE} />
      <MicroVessels top={FLAT_EPIDERMIS_BASE} bottom={FLAT_DERMIS_BASE} />
      <FatLobules top={FLAT_DERMIS_BASE} />
      <MuscleStriations />
      <SkinSurfaceDetail surface={FLAT_SURFACE} />
      {showLabels && (
        <>
          <SceneLabel position={[-3.02, 0.96, 1.25]} title="Epidermis" />
          <SceneLabel position={[-3.02, 0.35, 1.25]} title="Dermis" />
          <SceneLabel position={[-3.02, -0.64, 1.25]} title="Subcutaneous tissue" />
        </>
      )}
    </group>
  );
}

function CleftTissue({ showLabels }: { showLabels: boolean }) {
  return (
    <group>
      <TissueBand top={CLEFT_SURFACE} bottom={CLEFT_EPIDERMIS_BASE} color={COLORS.epidermis} roughness={0.97} />
      <TissueBand top={CLEFT_EPIDERMIS_BASE} bottom={CLEFT_DERMIS_BASE} color={COLORS.dermis} roughness={0.94} />
      <TissueBand top={CLEFT_DERMIS_BASE} bottom={FAT_BASE} color="#d8ac50" roughness={0.98} />
      <TissueBand top={FAT_BASE} bottom={FASCIA_BASE} color={COLORS.fascia} roughness={0.92} />
      <TissueBand top={FASCIA_BASE} bottom={MUSCLE_BASE} color={COLORS.muscle} roughness={0.96} />
      <LayerOutlines profiles={[
        { profile: CLEFT_EPIDERMIS_BASE, color: "#b66d62", opacity: 0.42 },
        { profile: CLEFT_DERMIS_BASE, color: "#9f5d61" },
        { profile: FAT_BASE, color: "#b98a3d" },
        { profile: FASCIA_BASE, color: "#9f8e82", opacity: 0.28 },
      ]} />
      <DermalFibers top={CLEFT_EPIDERMIS_BASE} bottom={CLEFT_DERMIS_BASE} />
      <MicroVessels top={CLEFT_EPIDERMIS_BASE} bottom={CLEFT_DERMIS_BASE} />
      <FatLobules top={CLEFT_DERMIS_BASE} />
      <MuscleStriations />
      <SkinSurfaceDetail surface={CLEFT_SURFACE} />
      <Tube
        points={[
          [-0.88, 1, FRONT_Z + 0.02],
          [-0.55, 0.86, FRONT_Z + 0.025],
          [-0.3, 0.36, FRONT_Z + 0.03],
          [0, -0.07, FRONT_Z + 0.032],
          [0.3, 0.36, FRONT_Z + 0.03],
          [0.55, 0.86, FRONT_Z + 0.025],
          [0.88, 1, FRONT_Z + 0.02],
        ]}
        radius={0.026}
        color="#5e3b3e"
        opacity={0.72}
        radialSegments={6}
        tubularSegments={28}
      />
      {showLabels && (
        <>
          <SceneLabel position={[-3.04, 0.96, 1.25]} title="Skin surface" />
          <SceneLabel position={[-3.04, -0.63, 1.25]} title="Subcutaneous tissue" />
          <SceneLabel position={[2.72, 1.18, 1.38]} title="Natal cleft" align="right" />
        </>
      )}
    </group>
  );
}

function FoldTissue({ showLabels }: { showLabels: boolean }) {
  return (
    <group>
      <TissueBand top={FOLD_SURFACE} bottom={FOLD_EPIDERMIS_BASE} color={COLORS.epidermis} roughness={0.96} />
      <TissueBand top={FOLD_EPIDERMIS_BASE} bottom={FOLD_DERMIS_BASE} color={COLORS.dermis} roughness={0.94} />
      <TissueBand top={FOLD_DERMIS_BASE} bottom={FAT_BASE} color="#d8ac50" roughness={0.98} />
      <TissueBand top={FAT_BASE} bottom={FASCIA_BASE} color={COLORS.fascia} roughness={0.92} />
      <TissueBand top={FASCIA_BASE} bottom={MUSCLE_BASE} color={COLORS.muscle} roughness={0.96} />
      <LayerOutlines profiles={[
        { profile: FOLD_EPIDERMIS_BASE, color: "#b66d62", opacity: 0.42 },
        { profile: FOLD_DERMIS_BASE, color: "#9f5d61" },
        { profile: FAT_BASE, color: "#b98a3d" },
        { profile: FASCIA_BASE, color: "#9f8e82", opacity: 0.28 },
      ]} />
      <DermalFibers top={FOLD_EPIDERMIS_BASE} bottom={FOLD_DERMIS_BASE} />
      <MicroVessels top={FOLD_EPIDERMIS_BASE} bottom={FOLD_DERMIS_BASE} />
      <FatLobules top={FOLD_DERMIS_BASE} />
      <MuscleStriations />
      <SkinSurfaceDetail surface={FOLD_SURFACE} />
      {showLabels && (
        <>
          <SceneLabel position={[-3.02, 0.96, 1.25]} title="Hair-bearing fold skin" />
          <SceneLabel position={[-3.02, 0.25, 1.25]} title="Dermis" />
          <SceneLabel position={[-3.02, -0.64, 1.25]} title="Subcutaneous tissue" />
        </>
      )}
    </group>
  );
}

function JointTissue({ showLabels }: { showLabels: boolean }) {
  return (
    <group>
      <TissueBand top={JOINT_SURFACE} bottom={JOINT_EPIDERMIS_BASE} color={COLORS.epidermis} roughness={0.96} />
      <TissueBand top={JOINT_EPIDERMIS_BASE} bottom={JOINT_DERMIS_BASE} color={COLORS.dermis} roughness={0.94} />
      <TissueBand top={JOINT_DERMIS_BASE} bottom={JOINT_FAT_BASE} color="#dbb45b" roughness={0.98} />
      <LayerOutlines profiles={[
        { profile: JOINT_EPIDERMIS_BASE, color: "#b66d62", opacity: 0.42 },
        { profile: JOINT_DERMIS_BASE, color: "#9f5d61" },
        { profile: JOINT_FAT_BASE, color: "#b98a3d" },
      ]} />
      <DermalFibers top={JOINT_EPIDERMIS_BASE} bottom={JOINT_DERMIS_BASE} />
      <MicroVessels top={JOINT_EPIDERMIS_BASE} bottom={JOINT_DERMIS_BASE} />
      <SkinSurfaceDetail surface={JOINT_SURFACE} />
      <mesh position={[-0.82, -0.52, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.4, 1.2, 12, 24]} />
        <meshStandardMaterial color={COLORS.joint} roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0.82, -0.52, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.4, 1.2, 12, 24]} />
        <meshStandardMaterial color={COLORS.joint} roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0, -0.52, 0.02]} scale={[0.55, 0.47, 0.78]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#8db9b2" roughness={0.76} transparent opacity={0.82} />
      </mesh>
      <Tube
        points={[
          [-2.3, -0.05, FRONT_Z + 0.01],
          [-0.8, 0.04, FRONT_Z + 0.015],
          [0.8, -0.02, FRONT_Z + 0.015],
          [2.3, 0.08, FRONT_Z + 0.01],
        ]}
        radius={0.11}
        color={COLORS.tendon}
      />
      {showLabels && (
        <>
          <SceneLabel position={[-3.02, 1.02, 1.24]} title="Skin" />
          <SceneLabel position={[-3.02, 0.22, 1.25]} title="Tendon sheath" />
          <SceneLabel position={[-3.02, -0.54, 1.22]} title="Wrist joint" />
        </>
      )}
    </group>
  );
}

function TissueBase({ showLabels, variant = "flat" }: TissueBaseProps) {
  if (variant === "cleft") return <CleftTissue showLabels={showLabels} />;
  if (variant === "fold") return <FoldTissue showLabels={showLabels} />;
  if (variant === "joint") return <JointTissue showLabels={showLabels} />;
  return <FlatTissue showLabels={showLabels} />;
}

function SebaceousGland({ x = 0, z = FRONT_Z + 0.015 }: { x?: number; z?: number }) {
  return (
    <group position={[x + 0.24, 0.38, z]}>
      <mesh position={[0.05, 0.05, 0]} scale={[0.18, 0.24, 0.09]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color={COLORS.sebum} roughness={0.9} />
      </mesh>
      <mesh position={[0.25, -0.02, 0]} scale={[0.16, 0.2, 0.085]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#c9876d" roughness={0.92} />
      </mesh>
      <Tube
        points={[
          [0, 0.05, 0],
          [-0.1, 0.02, 0],
          [-0.22, -0.05, 0],
        ]}
        radius={0.035}
        color={COLORS.follicle}
      />
    </group>
  );
}

function Follicle({ x = 0, hair = true }: { x?: number; hair?: boolean }) {
  return (
    <group>
      <Tube
        points={[
          [x, 1.02, FRONT_Z + 0.025],
          [x + 0.02, 0.56, FRONT_Z + 0.028],
          [x + 0.08, 0.08, FRONT_Z + 0.03],
          [x + 0.04, -0.22, FRONT_Z + 0.028],
        ]}
        radius={0.105}
        color={COLORS.follicle}
      />
      <mesh position={[x + 0.04, -0.23, FRONT_Z + 0.025]} scale={[0.15, 0.2, 0.075]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#70474c" roughness={0.94} />
      </mesh>
      {hair && (
        <Tube
          points={[
            [x + 0.04, -0.2, FRONT_Z + 0.07],
            [x + 0.01, 0.42, FRONT_Z + 0.07],
            [x - 0.05, 1.08, FRONT_Z + 0.07],
            [x - 0.18, 1.55, FRONT_Z + 0.07],
          ]}
          radius={0.028}
          color={COLORS.hair}
          radialSegments={7}
        />
      )}
      <SebaceousGland x={x} />
    </group>
  );
}

function InflammationHalo({
  position,
  scale,
  opacity = 0.28,
}: {
  position: Point;
  scale: Point;
  opacity?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[0.14, -0.1, 0.2]} scale={[1, 0.92, 0.72]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial
          color={COLORS.inflammation}
          roughness={1}
          metalness={0}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.38, 0.16, 0.14]} scale={[0.34, 0.29, 0.3]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#c6534b" roughness={1} transparent opacity={Math.min(0.48, opacity + 0.1)} />
      </mesh>
      <mesh position={[0.31, -0.2, 0.12]} scale={[0.28, 0.24, 0.27]}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e27a63" roughness={1} transparent opacity={Math.min(0.44, opacity + 0.08)} />
      </mesh>
    </group>
  );
}

function IngrownHairScene({ stage, showLabels }: SceneProps) {
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle x={0} hair={false} />
      <AnimatedGroup target={stage === 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0.04, -0.2, FRONT_Z + 0.07],
            [0.01, 0.42, FRONT_Z + 0.07],
            [-0.05, 1.08, FRONT_Z + 0.07],
            [-0.18, 1.55, FRONT_Z + 0.07],
          ]}
          radius={0.028}
          color={COLORS.hair}
          radialSegments={7}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage > 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0.04, -0.2, FRONT_Z + 0.07],
            [0.01, 0.42, FRONT_Z + 0.07],
            [-0.05, 1.04, FRONT_Z + 0.07],
            [0.22, 1.34, FRONT_Z + 0.07],
            [0.7, 1.22, FRONT_Z + 0.07],
            [0.48, 0.93, FRONT_Z + 0.07],
          ]}
          radius={0.03}
          color={COLORS.hair}
          radialSegments={7}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.46, 0.91, FRONT_Z - 0.055]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.52, 0.34, 0.18]} />
      </AnimatedGroup>
      {showLabels && (
        <>
          <SceneLabel position={[2.52, 0.38, 1.65]} title="Hair follicle" align="right" />
          {stage > 0 && (
            <SceneLabel position={[2.38, 1.38, 1.67]} title="Hair curves into skin" accent="#f1b273" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function FolliculitisScene({ stage, showLabels }: SceneProps) {
  const haloScale = stage === 1 ? 0.72 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle />
      <AnimatedGroup target={stage > 0 ? haloScale : 0.001} position={[0.03, 0.39, FRONT_Z - 0.045]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.48, 0.72, 0.16]} />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[-0.04, 1.13, FRONT_Z + 0.01]}>
        <mesh scale={[0.24, 0.13, 0.075]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial color="#c3a06f" roughness={0.9} />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <SceneLabel
          position={[2.42, 0.5, 1.65]}
          title="Follicle-centred inflammation"
          accent="#ed8a70"
          align="right"
        />
      )}
    </group>
  );
}

function BoilCarbuncleScene({ stage, showLabels }: SceneProps) {
  const primaryScale = stage === 1 ? 0.66 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle x={-0.42} />
      <Follicle x={0.72} />
      <AnimatedGroup
        target={stage > 0 ? primaryScale : 0.001}
        position={[-0.34, 0.08, FRONT_Z - 0.07]}
      >
        <InflammationHalo position={[0, 0, -0.03]} scale={[0.78, 0.86, 0.19]} opacity={0.26} />
        <mesh rotation={[0.08, -0.16, 0.12]} scale={[0.48, 0.58, 0.13]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#c9685a" roughness={0.98} transparent opacity={0.66} />
        </mesh>
        <mesh rotation={[-0.06, 0.1, -0.08]} scale={[0.34, 0.39, 0.11]} position={[0.02, -0.02, 0.025]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={COLORS.fluid} roughness={0.86} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001}>
        <InflammationHalo position={[0.75, 0.13, FRONT_Z - 0.1]} scale={[0.62, 0.7, 0.17]} opacity={0.23} />
        <mesh position={[0.73, 0.12, FRONT_Z - 0.04]} rotation={[-0.05, 0.08, -0.12]} scale={[0.35, 0.42, 0.105]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={COLORS.fluid} roughness={0.88} />
        </mesh>
        <InflammationHalo position={[1.28, -0.08, FRONT_Z - 0.1]} scale={[0.48, 0.58, 0.16]} opacity={0.21} />
        <mesh position={[1.27, -0.09, FRONT_Z - 0.04]} rotation={[0.06, -0.06, 0.1]} scale={[0.28, 0.34, 0.095]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#e0b46d" roughness={0.9} />
        </mesh>
        <Tube
          points={[
            [-0.33, 0.07, FRONT_Z + 0.015],
            [0.02, 0.04, FRONT_Z + 0.015],
            [0.38, 0.03, FRONT_Z + 0.02],
            [0.72, 0.12, FRONT_Z + 0.02],
            [1.04, 0.02, FRONT_Z + 0.018],
            [1.27, -0.08, FRONT_Z + 0.015],
          ]}
          radius={0.055}
          color="#9f5551"
          opacity={0.86}
          radialSegments={7}
        />
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.45, 0.42, 1.66]} title="Deep follicle infection" accent="#ef806d" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.45, -0.2, 1.63]} title="Connected boil pockets (carbuncle)" accent="#f2c578" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function SkinAbscessScene({ stage, showLabels }: SceneProps) {
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <AnimatedGroup target={stage > 0 ? 1 : 0.001} position={[0.16, 0.05, FRONT_Z - 0.07]}>
        <InflammationHalo position={[0, 0, -0.03]} scale={[0.92, 0.83, 0.19]} opacity={0.25} />
        <mesh rotation={[0.08, -0.16, 0.12]} scale={[0.64, 0.58, 0.13]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#c9685a" roughness={0.98} transparent opacity={0.55} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.18, 0.04, FRONT_Z - 0.045]}>
        <mesh rotation={[-0.06, 0.1, -0.08]} scale={[0.53, 0.47, 0.115]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={COLORS.fluid} roughness={0.86} />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.45, 0.32, 1.66]} title={stage === 1 ? "Local tissue inflammation" : "Localized pus pocket"} accent={stage === 1 ? "#ef806d" : "#f2c578"} align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.45, -0.23, 1.63]} title="Inflamed tissue" accent="#ef806d" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function EpidermoidScene({ stage, showLabels }: SceneProps) {
  const size = stage === 1 ? 0.58 : 1;
  const pearls = [
    [-0.18, 0.04, 0.03],
    [0.14, 0.12, 0.02],
    [0.06, -0.14, 0.04],
    [-0.12, -0.16, 0.01],
  ] as const;
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle x={-0.72} />
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.35, -0.12, FRONT_Z - 0.065]}>
        <mesh rotation={[0.05, -0.12, 0.08]} scale={[0.78, 0.66, 0.15]}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial
            color={COLORS.cyst}
            roughness={0.94}
            transparent
            opacity={0.58}
            depthWrite={false}
          />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.35, -0.12, FRONT_Z - 0.065]}>
        <mesh rotation={[-0.04, 0.08, -0.06]} scale={[0.65, 0.54, 0.125]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#eadcc2" roughness={0.98} />
        </mesh>
        {pearls.map((position) => (
          <mesh key={position.join(":")} position={position} scale={[0.16, 0.11, 0.07]}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#f1dfc0" roughness={0.85} />
          </mesh>
        ))}
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.48, 0.18, 1.67]} title="Epidermoid cyst wall" accent="#cdb6ef" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.35, -0.35, 1.65]} title="Layered keratin" accent="#e4d4b9" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function PilonidalScene({ stage, showLabels }: SceneProps) {
  const looseHairs = [
    [[-0.42, 0.62, FRONT_Z + 0.065], [-0.08, 0.08, FRONT_Z + 0.07], [0.18, -0.35, FRONT_Z + 0.065]],
    [[0.38, 0.52, FRONT_Z + 0.08], [0.04, 0.02, FRONT_Z + 0.082], [0.26, -0.5, FRONT_Z + 0.075]],
    [[-0.3, 0.36, FRONT_Z + 0.095], [0.08, -0.05, FRONT_Z + 0.09], [0.32, -0.62, FRONT_Z + 0.086]],
  ] as const;
  return (
    <group>
      <TissueBase showLabels={showLabels} variant="cleft" />
      <AnimatedGroup target={stage > 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0, -0.06, FRONT_Z + 0.018],
            [0.02, -0.27, FRONT_Z + 0.02],
            [0.13, -0.52, FRONT_Z + 0.022],
            [0.39, -0.76, FRONT_Z + 0.02],
          ]}
          radius={0.105}
          color="#704247"
          radialSegments={7}
        />
        {looseHairs.map((points, index) => (
          <Tube key={index} points={points} radius={0.024} color={COLORS.hair} radialSegments={6} />
        ))}
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.3, -0.64, FRONT_Z - 0.055]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.82, 0.58, 0.18]} opacity={0.3} />
        <mesh rotation={[0.1, 0.05, -0.12]} scale={[0.41, 0.31, 0.11]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={COLORS.fluid} roughness={0.9} />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.25, 0.81, 1.72]} title="Skin pit" accent="#efb36e" align="right" />
          <SceneLabel position={[2.34, 0.05, 1.7]} title="Hair-containing sinus tract" accent="#d89065" align="right" />
        </>
      )}
    </group>
  );
}

function HidradenitisScene({ stage, showLabels }: SceneProps) {
  const noduleScale = stage === 1 ? 0.72 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} variant="fold" />
      <Follicle x={-1.1} />
      <Follicle x={0.05} />
      <Follicle x={1.12} />
      <AnimatedGroup target={stage > 0 ? noduleScale : 0.001} position={[-0.72, -0.02, FRONT_Z - 0.055]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.73, 0.62, 0.17]} opacity={0.28} />
        <mesh rotation={[0.1, -0.08, 0.14]} scale={[0.42, 0.38, 0.105]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#a87359" roughness={0.94} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001}>
        <InflammationHalo position={[1.02, -0.16, FRONT_Z - 0.055]} scale={[0.72, 0.58, 0.17]} opacity={0.27} />
        <Tube
          points={[
            [-0.72, -0.06, FRONT_Z + 0.025],
            [-0.18, -0.42, FRONT_Z + 0.026],
            [0.48, -0.38, FRONT_Z + 0.026],
            [1.02, -0.15, FRONT_Z + 0.025],
          ]}
          radius={0.095}
          color="#75434b"
        />
        <mesh position={[1.02, -0.16, FRONT_Z - 0.025]} rotation={[-0.08, 0.06, 0.12]} scale={[0.42, 0.34, 0.1]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#a26c55" roughness={0.95} />
        </mesh>
        <Tube
          points={[
            [-1.42, 1.18, FRONT_Z + 0.055],
            [-0.95, 1.11, FRONT_Z + 0.06],
            [-0.48, 1.18, FRONT_Z + 0.055],
          ]}
          radius={0.035}
          color="#b07377"
        />
        <Tube
          points={[
            [0.48, 1.17, FRONT_Z + 0.055],
            [0.92, 1.09, FRONT_Z + 0.06],
            [1.42, 1.16, FRONT_Z + 0.055],
          ]}
          radius={0.035}
          color="#b07377"
        />
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.48, 0.18, 1.72]} title="Deep inflamed nodule" accent="#dd8b9c" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.48, -0.42, 1.7]} title="Connecting tunnel + scar" accent="#c17a8b" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function GanglionScene({ stage, showLabels }: SceneProps) {
  const size = stage === 1 ? 0.58 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} variant="joint" />
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.45, 0.36, FRONT_Z - 0.04]}>
        <mesh position={[0.04, 0.3, 0]} rotation={[0.08, -0.12, 0.1]} scale={[0.72, 0.56, 0.16]}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial color="#668e98" roughness={0.8} transparent opacity={0.7} depthWrite={false} />
        </mesh>
        <mesh position={[0.04, 0.3, 0.01]} rotation={[-0.04, 0.08, -0.06]} scale={[0.57, 0.42, 0.125]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#9eb9b9" roughness={0.84} transparent opacity={0.48} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.45, 0.36, FRONT_Z - 0.04]}>
        <Tube
          points={[
            [0, -0.47, 0],
            [-0.05, -0.25, 0],
            [0, -0.06, 0],
          ]}
          radius={0.1}
          color="#6f959d"
          opacity={0.82}
        />
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.45, 0.86, 1.69]} title="Fluid-filled sac" accent="#83d2e6" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.4, 0.15, 1.67]} title="Stalk to joint or sheath" accent="#75bdce" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function PerianalAbscessFistulaScene({ stage, showLabels }: SceneProps) {
  const pocketScale = stage === 1 ? 0.7 : 1;
  return (
    <group>
      <TissueBase showLabels={false} variant="fold" />
      <Tube
        points={[
          [-1.42, 0.93, FRONT_Z + 0.012],
          [-1.4, 0.55, FRONT_Z + 0.016],
          [-1.34, 0.12, FRONT_Z + 0.02],
          [-1.27, -0.43, FRONT_Z + 0.018],
        ]}
        radius={0.16}
        color="#866069"
        opacity={0.86}
        radialSegments={10}
      />
      <AnimatedGroup target={stage === 0 ? 1 : 0.001}>
        <mesh position={[-0.9, -0.02, FRONT_Z + 0.005]} scale={[0.19, 0.16, 0.075]}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial color="#8faea1" roughness={0.92} />
        </mesh>
        <Tube
          points={[
            [-1.22, -0.05, FRONT_Z + 0.025],
            [-1.06, -0.02, FRONT_Z + 0.028],
            [-0.91, -0.02, FRONT_Z + 0.025],
          ]}
          radius={0.035}
          color="#6e9b91"
        />
      </AnimatedGroup>
      <AnimatedGroup
        target={stage > 0 ? pocketScale : 0.001}
        position={[-0.78, -0.08, FRONT_Z - 0.055]}
      >
        <InflammationHalo position={[0, 0, 0]} scale={[0.76, 0.64, 0.18]} opacity={0.24} />
        <mesh rotation={[0.08, -0.12, 0.1]} scale={[0.52, 0.46, 0.13]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#dfb96a" roughness={0.92} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001}>
        <Tube
          points={[
            [-1.18, -0.12, FRONT_Z + 0.035],
            [-0.82, -0.16, FRONT_Z + 0.04],
            [-0.42, 0.1, FRONT_Z + 0.045],
            [-0.08, 0.48, FRONT_Z + 0.045],
            [0.12, 0.93, FRONT_Z + 0.04],
          ]}
          radius={0.07}
          color="#9b5860"
          opacity={0.9}
          radialSegments={7}
        />
        <mesh position={[0.12, 0.94, FRONT_Z + 0.045]} scale={[0.11, 0.055, 0.045]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#b96861" roughness={0.94} />
        </mesh>
      </AnimatedGroup>
      {showLabels && (
        <>
          <SceneLabel position={[-2.68, 0.55, 1.56]} title="Anal canal — schematic" />
          {stage === 0 && (
            <SceneLabel position={[2.35, 0.02, 1.67]} title="Small perianal gland" accent="#438879" align="right" />
          )}
          {stage > 0 && (
            <SceneLabel position={[2.38, -0.08, 1.69]} title="Localized abscess pocket" accent="#d65f49" align="right" />
          )}
          {stage === 2 && (
            <SceneLabel position={[2.36, 0.62, 1.7]} title="Possible fistula tract" accent="#9b5860" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function BartholinCystAbscessScene({ stage, showLabels }: SceneProps) {
  const cystScale = stage === 1 ? 0.68 : 1;
  return (
    <group>
      <TissueBase showLabels={false} variant="fold" />
      <AnimatedGroup target={stage === 0 ? 1 : 0.001}>
        <mesh position={[0.52, -0.31, FRONT_Z + 0.005]} scale={[0.28, 0.22, 0.09]}>
          <sphereGeometry args={[1, 22, 16]} />
          <meshStandardMaterial color="#88aaa1" roughness={0.9} />
        </mesh>
        <Tube
          points={[
            [0.5, -0.2, FRONT_Z + 0.04],
            [0.4, 0.12, FRONT_Z + 0.045],
            [0.22, 0.5, FRONT_Z + 0.048],
            [0.08, 0.88, FRONT_Z + 0.045],
          ]}
          radius={0.045}
          color="#5f938c"
          radialSegments={7}
        />
      </AnimatedGroup>
      <AnimatedGroup
        target={stage > 0 ? cystScale : 0.001}
        position={[0.45, -0.18, FRONT_Z - 0.055]}
      >
        {stage === 2 && (
          <InflammationHalo position={[0, 0, -0.02]} scale={[0.88, 0.7, 0.19]} opacity={0.27} />
        )}
        <mesh rotation={[0.08, -0.12, 0.08]} scale={[0.72, 0.58, 0.15]}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial
            color={stage === 2 ? "#c66f73" : "#9b7797"}
            roughness={0.9}
            transparent
            opacity={0.68}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-0.05, 0.08, -0.04]} scale={[0.58, 0.45, 0.12]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={stage === 2 ? "#e2ad75" : "#cbb6bd"} roughness={0.9} />
        </mesh>
        <Tube
          points={[
            [0.22, 0.02, 0.02],
            [0.12, 0.3, 0.025],
            [-0.08, 0.58, 0.02],
            [-0.26, 0.96, 0.015],
          ]}
          radius={0.05}
          color="#845c7e"
          radialSegments={7}
        />
        <mesh position={[-0.26, 0.97, 0.015]} scale={[0.1, 0.055, 0.04]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#d68b55" roughness={0.95} />
        </mesh>
      </AnimatedGroup>
      {showLabels && (
        <>
          <SceneLabel position={[-2.62, 0.95, 1.54]} title="Vulvar opening — schematic" />
          {stage === 0 ? (
            <SceneLabel position={[2.4, 0.15, 1.69]} title="Open gland duct" accent="#438879" align="right" />
          ) : (
            <SceneLabel position={[2.42, 0.22, 1.7]} title={stage === 1 ? "Blocked duct + fluid cyst" : "Inflamed gland abscess"} accent={stage === 1 ? "#9b7797" : "#c96374"} align="right" />
          )}
        </>
      )}
    </group>
  );
}

function AcneNoduleCystScene({ stage, showLabels }: SceneProps) {
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle x={-1.35} />
      <Follicle x={1.35} />
      <Follicle x={0} hair={false} />
      <AnimatedGroup target={stage === 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0.04, -0.2, FRONT_Z + 0.07],
            [0.01, 0.42, FRONT_Z + 0.07],
            [-0.04, 1.08, FRONT_Z + 0.07],
            [-0.12, 1.5, FRONT_Z + 0.07],
          ]}
          radius={0.022}
          color={COLORS.hair}
          radialSegments={6}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage > 0 ? 1 : 0.001}>
        <mesh position={[0, 0.96, FRONT_Z + 0.055]} scale={[0.2, 0.12, 0.075]}>
          <sphereGeometry args={[1, 22, 14]} />
          <meshStandardMaterial color="#8f665b" roughness={0.96} />
        </mesh>
        <Tube
          points={[
            [0.02, 0.84, FRONT_Z + 0.035],
            [0.04, 0.52, FRONT_Z + 0.04],
            [0.08, 0.18, FRONT_Z + 0.038],
          ]}
          radius={0.09}
          color="#b77a69"
          opacity={0.84}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.06, 0.03, FRONT_Z - 0.055]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.86, 0.72, 0.19]} opacity={0.25} />
        <mesh rotation={[0.08, -0.1, 0.12]} scale={[0.52, 0.48, 0.12]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#bd696b" roughness={0.98} />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.42, 0.94, 1.67]} title="Blocked follicular opening" accent="#b84200" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.4, 0.04, 1.68]} title="Solid acne nodule — depicted pattern" accent="#c96374" align="right" />
          )}
        </>
      )}
    </group>
  );
}

const LIPOMA_LOBULES: readonly Point[] = [
  [-0.58, 0.05, 0], [-0.3, 0.24, 0.01], [0.02, 0.26, 0], [0.34, 0.18, -0.01],
  [0.58, -0.03, 0], [-0.35, -0.18, 0.01], [-0.03, -0.17, 0.02], [0.29, -0.2, 0],
];

function LipomaScene({ stage, showLabels }: SceneProps) {
  const size = stage === 1 ? 0.58 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.12, -0.49, FRONT_Z - 0.045]}>
        {LIPOMA_LOBULES.map((position, index) => (
          <mesh
            key={position.join(":")}
            position={position}
            rotation={[0, 0, index * 0.31]}
            scale={[0.31 + (index % 3) * 0.025, 0.24 + (index % 2) * 0.025, 0.105]}
          >
            <sphereGeometry args={[1, 18, 12]} />
            <meshStandardMaterial color={index % 2 ? "#efc766" : "#f3d17e"} roughness={0.96} />
          </mesh>
        ))}
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.12, -0.49, FRONT_Z - 0.045]}>
        <mesh rotation={[0.03, -0.08, 0.04]} scale={[1.13, 0.62, 0.18]}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial color="#a97825" roughness={1} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.4, -0.18, 1.68]} title="Mature fat lobules" accent="#c7962e" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.4, -0.7, 1.66]} title="Thin tissue capsule" accent="#9b772c" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function SwollenLymphNodeScene({ stage, showLabels }: SceneProps) {
  const size = stage === 0 ? 0.5 : 0.78;
  return (
    <group>
      <TissueBase showLabels={false} />
      <AnimatedGroup target={size} position={[0.04, -0.54, FRONT_Z - 0.04]}>
        <Tube
          points={[
            [-1.85, 0.02, 0.015],
            [-1.16, 0.06, 0.02],
            [-0.63, 0.01, 0.025],
            [-0.36, -0.02, 0.02],
          ]}
          radius={0.045}
          color="#5d9a8f"
          opacity={0.78}
        />
        <Tube
          points={[
            [0.38, -0.01, 0.02],
            [0.82, 0.04, 0.025],
            [1.42, -0.02, 0.018],
            [1.9, 0.06, 0.015],
          ]}
          radius={0.045}
          color="#5d9a8f"
          opacity={0.78}
        />
        <mesh rotation={[0.05, -0.1, 0.06]} scale={[0.78, 0.52, 0.15]}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial color="#70a496" roughness={0.9} />
        </mesh>
        <mesh rotation={[-0.04, 0.07, -0.03]} scale={[0.56, 0.35, 0.125]}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#b9d4c7" roughness={0.92} />
        </mesh>
        <Tube
          points={[
            [-0.4, 0.06, 0.13],
            [-0.08, 0.16, 0.135],
            [0.25, 0.05, 0.13],
            [0.48, -0.04, 0.125],
          ]}
          radius={0.018}
          color="#d4a96a"
          opacity={0.7}
          radialSegments={5}
        />
      </AnimatedGroup>
      {showLabels && (
        <>
          <SceneLabel position={[-2.67, 0.94, 1.54]} title="Skin + subcutaneous tissue" />
          <SceneLabel position={[2.38, -0.25, 1.68]} title={stage === 0 ? "Normal lymph node" : "Solid enlarged lymph node"} accent="#438879" align="right" />
          <SceneLabel position={[2.38, -0.72, 1.66]} title="Lymphatic vessels" accent="#5d9a8f" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.38, 0.24, 1.7]} title="Persistence means duration, not more growth" accent="#438879" align="right" />
          )}
        </>
      )}
    </group>
  );
}

function HemorrhoidScene({ stage, showLabels }: SceneProps) {
  const cushionScale = stage === 0 ? 0.48 : stage === 1 ? 0.75 : 1;
  return (
    <group>
      <TissueBase showLabels={false} variant="fold" />
      <Tube
        points={[
          [0, 0.92, FRONT_Z + 0.012],
          [0.02, 0.56, FRONT_Z + 0.018],
          [0.04, 0.16, FRONT_Z + 0.02],
          [0.1, -0.42, FRONT_Z + 0.018],
        ]}
        radius={0.18}
        color="#806875"
        opacity={0.78}
        radialSegments={10}
      />
      <AnimatedGroup target={cushionScale} position={[0.02, 0.14, FRONT_Z - 0.025]}>
        <mesh position={[-0.28, 0.18, 0]} rotation={[0.04, -0.08, -0.14]} scale={[0.29, 0.42, 0.12]}>
          <dodecahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#94739d" roughness={0.93} />
        </mesh>
        <mesh position={[0.28, -0.05, 0]} rotation={[-0.04, 0.08, 0.14]} scale={[0.28, 0.39, 0.12]}>
          <dodecahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#826c9b" roughness={0.93} />
        </mesh>
        <Tube
          points={[
            [-0.45, 0.22, 0.11],
            [-0.22, 0.18, 0.12],
            [0.02, 0.08, 0.125],
            [0.36, -0.06, 0.11],
          ]}
          radius={0.025}
          color="#b76572"
          opacity={0.72}
          radialSegments={5}
        />
        <Tube
          points={[
            [-0.4, 0.08, 0.105],
            [-0.12, -0.02, 0.115],
            [0.16, 0.03, 0.12],
            [0.43, 0.1, 0.105],
          ]}
          radius={0.019}
          color="#638ea0"
          opacity={0.66}
          radialSegments={5}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.09, 0.73, FRONT_Z - 0.015]}>
        <mesh rotation={[0.02, -0.06, 0.08]} scale={[0.38, 0.28, 0.12]}>
          <dodecahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#8b6d9e" roughness={0.94} />
        </mesh>
      </AnimatedGroup>
      {showLabels && (
        <>
          <SceneLabel position={[-2.62, 0.72, 1.54]} title="Anal canal — schematic" />
          <SceneLabel position={[2.4, 0.24, 1.69]} title={stage === 0 ? "Normal vascular cushion" : "Enlarged vascular tissue"} accent="#80669c" align="right" />
          {stage === 2 && (
            <SceneLabel position={[2.38, 0.83, 1.7]} title="Possible protrusion" accent="#80669c" align="right" />
          )}
        </>
      )}
    </group>
  );
}

type SceneProps = {
  stage: CutawayStage;
  showLabels: boolean;
};

function CutawaySceneContent({
  condition,
  stage,
  showLabels,
}: SceneProps & { condition: CutawaySceneId }) {
  switch (condition) {
    case "ingrown_hair":
      return <IngrownHairScene stage={stage} showLabels={showLabels} />;
    case "folliculitis":
      return <FolliculitisScene stage={stage} showLabels={showLabels} />;
    case "boil_abscess":
      return <BoilCarbuncleScene stage={stage} showLabels={showLabels} />;
    case "skin_abscess":
      return <SkinAbscessScene stage={stage} showLabels={showLabels} />;
    case "epidermoid_cyst":
      return <EpidermoidScene stage={stage} showLabels={showLabels} />;
    case "pilonidal_disease":
      return <PilonidalScene stage={stage} showLabels={showLabels} />;
    case "hidradenitis_suppurativa":
      return <HidradenitisScene stage={stage} showLabels={showLabels} />;
    case "ganglion_cyst":
      return <GanglionScene stage={stage} showLabels={showLabels} />;
    case "perianal_abscess_fistula":
      return <PerianalAbscessFistulaScene stage={stage} showLabels={showLabels} />;
    case "bartholin_cyst_abscess":
      return <BartholinCystAbscessScene stage={stage} showLabels={showLabels} />;
    case "acne_nodule_cyst":
      return <AcneNoduleCystScene stage={stage} showLabels={showLabels} />;
    case "lipoma":
      return <LipomaScene stage={stage} showLabels={showLabels} />;
    case "swollen_lymph_node":
      return <SwollenLymphNodeScene stage={stage} showLabels={showLabels} />;
    case "hemorrhoid":
      return <HemorrhoidScene stage={stage} showLabels={showLabels} />;
  }
}

export function ProceduralCutawayScene({
  condition,
  stage,
  showLabels,
  reducedMotion = false,
}: SceneProps & { condition: CutawaySceneId; reducedMotion?: boolean }) {
  return (
    <ReducedMotionContext.Provider value={reducedMotion}>
      <CutawaySceneContent
        condition={condition}
        stage={stage}
        showLabels={showLabels}
      />
    </ReducedMotionContext.Provider>
  );
}
