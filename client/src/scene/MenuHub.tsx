import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useCameraStore } from "@/hooks/useCamera";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import {
  useScrollInteraction,
  useScrollInteractionStore,
} from "@/hooks/useScrollInteraction";
import type { EmblemTuning, LightingMode } from "./lightingConfig";
import { MenuButton } from "./MenuButton";
import { LogoModel } from "./LogoModel";
import { MedallionHub } from "./MedallionHub";

interface MenuHubProps {
  onPageSelect: (page: PageConfig) => void;
  bootSequenceId: number;
  lightingMode: LightingMode;
  screensDormant: boolean;
  emblem: EmblemTuning;
  grainHz: number;
  /** ?grain=shader — forwarded to the CRT screens. */
  shaderGrain?: boolean;
  departing?: boolean;
  onDeparted?: () => void;
}

export function MenuHub({
  onPageSelect,
  bootSequenceId,
  lightingMode,
  screensDormant,
  emblem,
  grainHz,
  shaderGrain = false,
  departing = false,
  onDeparted,
}: MenuHubProps) {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const idleRotationRef = useRef(0);
  const exitProgressRef = useRef(0);
  const departureNotifiedRef = useRef(false);
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);
  const assetSwapDemoEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("asset-demo") === "1";
  // Task 28 (approved 2026-07-11): the seven-section Blender medallion IS the
  // hub. /?classic=1 resurrects the placeholder @ + capsule buttons for
  // comparison/nostalgia; the old /?medallion=1 flag is accepted and ignored.
  const medallionEnabled =
    typeof window === "undefined" ||
    new URLSearchParams(window.location.search).get("classic") !== "1";
  const canInteract = !currentPage && !isTransitioning && !departing;
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  useScrollInteraction({
    enabled: canInteract,
    pages: PAGES,
    onCommit: onPageSelect,
  });

  useFrame((_, delta) => {
    if (!groupRef.current || !visualRef.current) return;

    const { phaseNudge } = useScrollInteractionStore.getState();
    idleRotationRef.current = THREE.MathUtils.lerp(
      idleRotationRef.current,
      phaseNudge * 0.08,
      0.08,
    );
    groupRef.current.rotation.z = idleRotationRef.current;

    const leaving = departing || Boolean(currentPage);
    const duration = leaving ? 0.42 : 0.55;
    exitProgressRef.current = reducedMotion
      ? (leaving ? 1 : 0)
      : THREE.MathUtils.clamp(
          exitProgressRef.current + (leaving ? 1 : -1) * Math.min(delta, 0.1) / duration,
          0,
          1,
        );
    const eased = 1 - Math.pow(1 - exitProgressRef.current, 3);
    visualRef.current.scale.setScalar(1 - eased * 0.98);
    visualRef.current.visible = exitProgressRef.current < 1;

    if (leaving && exitProgressRef.current === 1 && !departureNotifiedRef.current) {
      departureNotifiedRef.current = true;
      onDeparted?.();
    } else if (!leaving) {
      departureNotifiedRef.current = false;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={visualRef}>
        {medallionEnabled ? (
          <MedallionHub
            onPageSelect={onPageSelect}
            bootSequenceId={bootSequenceId}
            lightingMode={lightingMode}
            screensDormant={screensDormant}
            emblem={emblem}
            grainHz={grainHz}
            shaderGrain={shaderGrain}
            disabled={!canInteract}
          />
        ) : (
          <>
            <LogoModel
              modelPath={assetSwapDemoEnabled ? "/models/task-21-sample-box.glb" : undefined}
            />
            {PAGES.map((page, index) => (
              <MenuButton
                key={page.id}
                page={page}
                index={index}
                onClick={onPageSelect}
                disabled={!canInteract}
                modelPath={assetSwapDemoEnabled && index === 0 ? "/models/task-21-sample-box.glb" : undefined}
              />
            ))}
          </>
        )}
      </group>
    </group>
  );
}
