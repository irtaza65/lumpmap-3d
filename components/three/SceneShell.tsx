"use client";

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import type { SceneStatus } from "./types";

const SHELL_STYLE = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 320,
  overflow: "hidden",
  borderRadius: "inherit",
  background:
    "radial-gradient(circle at 50% 34%, rgba(69, 130, 126, 0.15), transparent 38%), linear-gradient(180deg, #0b181d 0%, #071216 100%)",
} as const;

export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      queueMicrotask(() => {
        if (!cancelled) setSupported(Boolean(context));
      });
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setSupported(false);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}

type ErrorBoundaryProps = PropsWithChildren<{
  fallback: ReactNode;
  onError?: () => void;
}>;

type ErrorBoundaryState = { failed: boolean };

class SceneErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export type SceneFallbackProps = {
  kind?: "body" | "cutaway";
  title?: string;
  message?: string;
};

/** A no-image fallback that still communicates the two-scale anatomy concept. */
export function SceneFallback({
  kind = "cutaway",
  title = "3D view unavailable",
  message = "Use the accessible region and condition controls to continue.",
}: SceneFallbackProps) {
  return (
    <div
      role="status"
      style={{
        ...SHELL_STYLE,
        display: "grid",
        placeItems: "center",
        padding: 28,
        color: "#e8eee9",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <div
          aria-hidden="true"
          style={{
            width: 126,
            height: 126,
            margin: "0 auto 22px",
            position: "relative",
            filter: "drop-shadow(0 18px 28px rgba(0,0,0,.28))",
          }}
        >
          {kind === "body" ? (
            <>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  position: "absolute",
                  left: 46,
                  top: 2,
                  background: "#83c8bd",
                  opacity: 0.82,
                }}
              />
              <div
                style={{
                  width: 62,
                  height: 78,
                  borderRadius: "42% 42% 34% 34%",
                  position: "absolute",
                  left: 32,
                  top: 38,
                  border: "1px solid rgba(169,232,220,.8)",
                  background:
                    "linear-gradient(135deg, rgba(121,215,202,.35), rgba(121,215,202,.08))",
                }}
              />
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  position: "absolute",
                  left: 82,
                  top: 76,
                  background: "#f0b875",
                  boxShadow: "0 0 0 7px rgba(240,184,117,.13)",
                }}
              />
            </>
          ) : (
            <>
              {["#d9b198", "#c98f88", "#e2bd6d", "#8b5c58"].map(
                (color, index) => (
                  <div
                    key={color}
                    style={{
                      height: index === 0 ? 24 : index === 1 ? 35 : 31,
                      left: 4 + index * 2,
                      right: 4 + index * 2,
                      top: 7 + [0, 24, 59, 90][index],
                      borderRadius: index === 0 ? "12px 12px 3px 3px" : 3,
                      position: "absolute",
                      background: color,
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)",
                    }}
                  />
                ),
              )}
              <div
                style={{
                  width: 28,
                  height: 36,
                  borderRadius: "50%",
                  position: "absolute",
                  left: 51,
                  top: 47,
                  background: "rgba(237,126,105,.68)",
                  border: "2px solid rgba(255,207,174,.65)",
                }}
              />
            </>
          )}
        </div>
        <div style={{ fontWeight: 650, letterSpacing: "0.01em" }}>{title}</div>
        <div
          style={{
            marginTop: 7,
            color: "#aab9b5",
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}

function LoadingScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        zIndex: 2,
        color: "#90aaa5",
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      Preparing anatomy…
    </div>
  );
}

export type ThreeCanvasShellProps = PropsWithChildren<{
  className?: string;
  ariaLabel: string;
  fallbackKind: "body" | "cutaway";
  fallbackTitle?: string;
  fallbackMessage?: string;
  camera: NonNullable<CanvasProps["camera"]>;
  onStatusChange?: (status: SceneStatus) => void;
}>;

export function ThreeCanvasShell({
  children,
  className,
  ariaLabel,
  fallbackKind,
  fallbackTitle,
  fallbackMessage,
  camera,
  onStatusChange,
}: ThreeCanvasShellProps) {
  const webgl = useWebGLSupport();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallback = useMemo(
    () => (
      <SceneFallback
        kind={fallbackKind}
        title={fallbackTitle}
        message={fallbackMessage}
      />
    ),
    [fallbackKind, fallbackMessage, fallbackTitle],
  );

  useEffect(() => {
    const next: SceneStatus = failed || webgl === false
      ? "fallback"
      : webgl === null
        ? "checking"
        : ready
          ? "ready"
          : "loading";
    onStatusChange?.(next);
  }, [failed, onStatusChange, ready, webgl]);

  if (webgl === false || failed) return fallback;

  return (
    <div className={className} style={SHELL_STYLE} role="img" aria-label={ariaLabel}>
      {!ready && <LoadingScene />}
      {webgl && (
        <SceneErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
          <Canvas
            camera={camera}
            dpr={[1, 1.65]}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.setClearAlpha(0);
              setReady(true);
            }}
            style={{ touchAction: "pan-y" }}
          >
            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        </SceneErrorBoundary>
      )}
    </div>
  );
}
