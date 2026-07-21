"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Group,
  MathUtils,
  Vector3,
} from "three";
import type { CutawaySceneId, CutawayStage } from "../types";

type Point = readonly [number, number, number];

const COLORS = {
  epidermis: "#e5b99f",
  dermis: "#c98582",
  dermisDark: "#a85f66",
  fat: "#e1b65e",
  fascia: "#d8c8b5",
  muscle: "#8f4d4f",
  follicle: "#8d5d58",
  hair: "#332726",
  sebum: "#e6b781",
  inflammation: "#e96f68",
  fluid: "#efc775",
  cyst: "#c5b0e7",
  joint: "#d6dbe0",
  tendon: "#91b9b5",
} as const;

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

  useFrame((_state, delta) => {
    if (!ref.current) return;
    const next = MathUtils.damp(ref.current.scale.x, Math.max(0.001, target), speed, delta);
    ref.current.scale.setScalar(next);
  });

  return (
    <group ref={ref} position={position} rotation={rotation} scale={0.001}>
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
};

function Tube({
  points,
  radius,
  color,
  opacity = 1,
  radialSegments = 9,
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
      <tubeGeometry args={[curve, 42, radius, radialSegments, false]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.5}
        clearcoat={0.2}
        transparent={opacity < 1}
        opacity={opacity}
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
  accent = "#79d7ca",
  align = "left",
}: SceneLabelProps) {
  return (
    <Html
      position={position}
      center
      distanceFactor={7.5}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: align === "left" ? "row" : "row-reverse",
          gap: 7,
          color: "#e5efec",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 9,
          fontWeight: 650,
          letterSpacing: ".035em",
          whiteSpace: "nowrap",
          textShadow: "0 2px 8px rgba(0,0,0,.8)",
        }}
      >
        <span
          style={{
            width: 20,
            height: 1,
            display: "block",
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}
        />
        <span>{title}</span>
      </div>
    </Html>
  );
}

function SoftLayer({
  position,
  size,
  color,
  radius = 0.08,
  roughness = 0.7,
}: {
  position: Point;
  size: Point;
  color: string;
  radius?: number;
  roughness?: number;
}) {
  return (
    <RoundedBox
      args={[size[0], size[1], size[2]]}
      position={position}
      radius={radius}
      smoothness={4}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        clearcoat={0.16}
        clearcoatRoughness={0.65}
      />
    </RoundedBox>
  );
}

function FatLobules() {
  const lobules = useMemo(
    () =>
      Array.from({ length: 17 }, (_, index) => {
        const column = index % 9;
        const row = Math.floor(index / 9);
        return {
          x: -2.28 + column * 0.57 + (row ? 0.22 : 0),
          y: -0.63 + row * 0.28,
          scale: 0.19 + ((index * 7) % 4) * 0.018,
        };
      }),
    [],
  );

  return (
    <group>
      {lobules.map((item, index) => (
        <mesh
          key={`${item.x}-${item.y}`}
          position={[item.x, item.y, 1.47]}
          scale={[item.scale * 1.25, item.scale, 0.11]}
          castShadow
        >
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial
            color={index % 3 === 0 ? "#edcb79" : COLORS.fat}
            roughness={0.55}
            clearcoat={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function MuscleStriations() {
  return (
    <group position={[0, -1.37, 1.46]}>
      {[-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.035, 0.5, 0.025]} />
          <meshBasicMaterial color="#b66e6c" transparent opacity={0.45} />
        </mesh>
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
      <SoftLayer position={[0, 0.94, 0]} size={[5.4, 0.3, 2.8]} color={COLORS.epidermis} radius={0.13} />
      <SoftLayer position={[0, 0.28, 0]} size={[5.4, 1.02, 2.8]} color={COLORS.dermis} />
      <SoftLayer position={[0, -0.63, 0]} size={[5.4, 0.72, 2.8]} color={COLORS.fat} />
      <SoftLayer position={[0, -1.05, 0]} size={[5.4, 0.14, 2.8]} color={COLORS.fascia} radius={0.04} />
      <SoftLayer position={[0, -1.38, 0]} size={[5.4, 0.5, 2.8]} color={COLORS.muscle} />
      <FatLobules />
      <MuscleStriations />
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
      <group rotation={[0, 0, -0.085]} position={[-1.42, -0.02, 0]}>
        <SoftLayer position={[0, 0.94, 0]} size={[2.58, 0.3, 2.8]} color={COLORS.epidermis} radius={0.13} />
        <SoftLayer position={[0, 0.28, 0]} size={[2.58, 1.02, 2.8]} color={COLORS.dermis} />
      </group>
      <group rotation={[0, 0, 0.085]} position={[1.42, -0.02, 0]}>
        <SoftLayer position={[0, 0.94, 0]} size={[2.58, 0.3, 2.8]} color={COLORS.epidermis} radius={0.13} />
        <SoftLayer position={[0, 0.28, 0]} size={[2.58, 1.02, 2.8]} color={COLORS.dermis} />
      </group>
      <SoftLayer position={[0, -0.63, 0]} size={[5.4, 0.72, 2.8]} color={COLORS.fat} />
      <SoftLayer position={[0, -1.05, 0]} size={[5.4, 0.14, 2.8]} color={COLORS.fascia} radius={0.04} />
      <SoftLayer position={[0, -1.38, 0]} size={[5.4, 0.5, 2.8]} color={COLORS.muscle} />
      <FatLobules />
      <MuscleStriations />
      <mesh position={[0, 0.54, 1.46]} scale={[0.2, 0.52, 0.08]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial color="#6c4749" roughness={0.86} />
      </mesh>
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
      <FlatTissue showLabels={false} />
      <mesh position={[-0.58, 1.01, 0.18]} rotation={[0, 0, -0.22]} scale={[1.55, 0.24, 1.18]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshPhysicalMaterial color={COLORS.epidermis} roughness={0.58} clearcoat={0.18} />
      </mesh>
      <mesh position={[0.62, 1.01, 0.18]} rotation={[0, 0, 0.22]} scale={[1.55, 0.24, 1.18]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshPhysicalMaterial color={COLORS.epidermis} roughness={0.58} clearcoat={0.18} />
      </mesh>
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
      <SoftLayer position={[0, 1.02, 0]} size={[5.4, 0.26, 2.8]} color={COLORS.epidermis} radius={0.13} />
      <SoftLayer position={[0, 0.61, 0]} size={[5.4, 0.52, 2.8]} color={COLORS.dermis} />
      <SoftLayer position={[0, 0.19, 0]} size={[5.4, 0.28, 2.8]} color="#d8b077" />
      <mesh position={[-0.82, -0.52, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.4, 1.2, 12, 24]} />
        <meshPhysicalMaterial color={COLORS.joint} roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0.82, -0.52, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.4, 1.2, 12, 24]} />
        <meshPhysicalMaterial color={COLORS.joint} roughness={0.45} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, -0.52, 0.02]} scale={[0.55, 0.47, 0.78]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshPhysicalMaterial color="#769aa1" roughness={0.34} transparent opacity={0.85} />
      </mesh>
      <Tube
        points={[
          [-2.3, -0.05, 1.46],
          [-0.8, 0.04, 1.5],
          [0.8, -0.02, 1.5],
          [2.3, 0.08, 1.46],
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

function SebaceousGland({ x = 0, z = 1.54 }: { x?: number; z?: number }) {
  return (
    <group position={[x + 0.24, 0.38, z]}>
      <mesh position={[0.05, 0.05, 0]} scale={[0.18, 0.24, 0.09]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshPhysicalMaterial color={COLORS.sebum} roughness={0.48} />
      </mesh>
      <mesh position={[0.25, -0.02, 0]} scale={[0.16, 0.2, 0.085]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshPhysicalMaterial color="#dc9f77" roughness={0.48} />
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
          [x, 1.02, 1.5],
          [x + 0.02, 0.56, 1.51],
          [x + 0.08, 0.08, 1.52],
          [x + 0.04, -0.22, 1.52],
        ]}
        radius={0.105}
        color={COLORS.follicle}
      />
      <mesh position={[x + 0.04, -0.23, 1.52]} scale={[0.15, 0.2, 0.09]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshPhysicalMaterial color="#6f4546" roughness={0.62} />
      </mesh>
      {hair && (
        <Tube
          points={[
            [x + 0.04, -0.2, 1.63],
            [x + 0.01, 0.42, 1.63],
            [x - 0.05, 1.08, 1.63],
            [x - 0.18, 1.55, 1.63],
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
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshPhysicalMaterial
        color={COLORS.inflammation}
        emissive={COLORS.inflammation}
        emissiveIntensity={0.14}
        roughness={0.45}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
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
            [0.04, -0.2, 1.63],
            [0.01, 0.42, 1.63],
            [-0.05, 1.08, 1.63],
            [-0.18, 1.55, 1.63],
          ]}
          radius={0.028}
          color={COLORS.hair}
          radialSegments={7}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage > 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0.04, -0.2, 1.63],
            [0.01, 0.42, 1.63],
            [-0.05, 1.04, 1.63],
            [0.22, 1.34, 1.63],
            [0.7, 1.22, 1.63],
            [0.48, 0.93, 1.63],
          ]}
          radius={0.03}
          color={COLORS.hair}
          radialSegments={7}
        />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.46, 0.91, 1.48]}>
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
      <AnimatedGroup target={stage > 0 ? haloScale : 0.001} position={[0.03, 0.39, 1.5]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.48, 0.72, 0.16]} />
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[-0.04, 1.13, 1.53]}>
        <mesh scale={[0.24, 0.13, 0.12]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshPhysicalMaterial color="#f3c88f" roughness={0.46} clearcoat={0.25} />
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

function AbscessScene({ stage, showLabels }: SceneProps) {
  const size = stage === 1 ? 0.64 : 1;
  return (
    <group>
      <TissueBase showLabels={showLabels} />
      <Follicle x={-0.2} />
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.16, 0.05, 1.46]}>
        <InflammationHalo position={[0, 0, -0.02]} scale={[0.92, 0.83, 0.23]} opacity={0.3} />
        <mesh scale={[0.6, 0.55, 0.18]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial
            color={COLORS.fluid}
            roughness={0.3}
            clearcoat={0.4}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh scale={[0.68, 0.63, 0.2]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial
            color="#f08a73"
            roughness={0.5}
            transparent
            opacity={0.24}
            depthWrite={false}
          />
        </mesh>
      </AnimatedGroup>
      {showLabels && stage > 0 && (
        <>
          <SceneLabel position={[2.45, 0.32, 1.66]} title="Localized fluid pocket" accent="#f2c578" align="right" />
          <SceneLabel position={[2.45, -0.23, 1.63]} title="Inflamed tissue" accent="#ef806d" align="right" />
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
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.35, -0.12, 1.47]}>
        <mesh scale={[0.78, 0.66, 0.22]}>
          <sphereGeometry args={[1, 40, 28]} />
          <meshPhysicalMaterial
            color={COLORS.cyst}
            roughness={0.32}
            clearcoat={0.45}
            transparent
            opacity={0.66}
            depthWrite={false}
          />
        </mesh>
        <mesh scale={[0.67, 0.56, 0.2]}>
          <sphereGeometry args={[1, 36, 24]} />
          <meshPhysicalMaterial color="#eadfca" roughness={0.74} />
        </mesh>
        {pearls.map((position) => (
          <mesh key={position.join(":")} position={position} scale={[0.16, 0.11, 0.07]}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshStandardMaterial color="#cdbca6" roughness={0.85} />
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
    [[-0.06, 0.98, 1.61], [0.05, 0.56, 1.61], [0.22, 0.2, 1.61]],
    [[0.08, 0.89, 1.64], [-0.03, 0.48, 1.64], [0.28, -0.05, 1.64]],
    [[-0.13, 0.7, 1.67], [0.12, 0.3, 1.67], [0.34, -0.22, 1.67]],
  ] as const;
  return (
    <group>
      <TissueBase showLabels={showLabels} variant="cleft" />
      <AnimatedGroup target={stage > 0 ? 1 : 0.001}>
        <Tube
          points={[
            [0, 0.91, 1.57],
            [0.02, 0.44, 1.58],
            [0.13, 0.02, 1.58],
            [0.39, -0.35, 1.58],
          ]}
          radius={0.15}
          color="#865657"
        />
        {looseHairs.map((points, index) => (
          <Tube key={index} points={points} radius={0.024} color={COLORS.hair} radialSegments={6} />
        ))}
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001} position={[0.3, -0.23, 1.48]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.86, 0.68, 0.23]} opacity={0.36} />
        <mesh scale={[0.43, 0.34, 0.16]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshPhysicalMaterial color={COLORS.fluid} roughness={0.38} />
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
      <AnimatedGroup target={stage > 0 ? noduleScale : 0.001} position={[-0.72, -0.02, 1.49]}>
        <InflammationHalo position={[0, 0, 0]} scale={[0.73, 0.62, 0.2]} opacity={0.34} />
        <mesh scale={[0.42, 0.38, 0.16]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshPhysicalMaterial color="#d9a172" roughness={0.4} />
        </mesh>
      </AnimatedGroup>
      <AnimatedGroup target={stage === 2 ? 1 : 0.001}>
        <InflammationHalo position={[1.02, -0.16, 1.49]} scale={[0.72, 0.58, 0.2]} opacity={0.32} />
        <Tube
          points={[
            [-0.72, -0.06, 1.62],
            [-0.18, -0.42, 1.62],
            [0.48, -0.38, 1.62],
            [1.02, -0.15, 1.62],
          ]}
          radius={0.12}
          color="#9a565e"
        />
        <mesh position={[1.02, -0.16, 1.55]} scale={[0.42, 0.34, 0.15]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshPhysicalMaterial color="#d59a70" roughness={0.42} />
        </mesh>
        <Tube
          points={[
            [-1.42, 1.18, 1.58],
            [-0.95, 1.11, 1.6],
            [-0.48, 1.18, 1.58],
          ]}
          radius={0.035}
          color="#b07377"
        />
        <Tube
          points={[
            [0.48, 1.17, 1.58],
            [0.92, 1.09, 1.6],
            [1.42, 1.16, 1.58],
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
      <AnimatedGroup target={stage > 0 ? size : 0.001} position={[0.45, 0.36, 1.49]}>
        <Tube
          points={[
            [0, -0.47, 0],
            [-0.05, -0.25, 0],
            [0, -0.06, 0],
          ]}
          radius={0.1}
          color="#81bdd3"
          opacity={0.9}
        />
        <mesh position={[0.04, 0.3, 0]} scale={[0.72, 0.56, 0.24]}>
          <sphereGeometry args={[1, 40, 28]} />
          <meshPhysicalMaterial
            color="#7fc8e6"
            emissive="#235566"
            emissiveIntensity={0.18}
            roughness={0.2}
            clearcoat={0.55}
            transparent
            opacity={0.78}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.04, 0.3, -0.015]} scale={[0.58, 0.43, 0.2]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial color="#bde9f0" roughness={0.28} transparent opacity={0.52} />
        </mesh>
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

type SceneProps = {
  stage: CutawayStage;
  showLabels: boolean;
};

export function ProceduralCutawayScene({
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
    case "skin_abscess":
      return <AbscessScene stage={stage} showLabels={showLabels} />;
    case "epidermoid_cyst":
      return <EpidermoidScene stage={stage} showLabels={showLabels} />;
    case "pilonidal_disease":
      return <PilonidalScene stage={stage} showLabels={showLabels} />;
    case "hidradenitis_suppurativa":
      return <HidradenitisScene stage={stage} showLabels={showLabels} />;
    case "ganglion_cyst":
      return <GanglionScene stage={stage} showLabels={showLabels} />;
  }
}

