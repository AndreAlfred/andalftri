import { Bvh, useGLTF, Text } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useLemniscate } from "@/hooks/useLemniscate";
import { useProximityTilt } from "@/hooks/useProximityTilt";
import { ScreenWakeManager } from "./screenWake";

// The seven-section medallion replaces the @ logo + six capsule buttons as the
// nav hub. Mesh naming contract (see docs/medallion-glb-notes.md):
//   section_0N_screen / section_0N_bezel, N = 1..7
// Section numbering (Andrew's map): 7=left big, 1=top-left, 2=top-mid small,
// 3=right-top big, 4=right-mid, 5=bottom big, 6=bottom-left.
//
// Route mapping accepted-for-now with the Task 28 default flip (Andrew,
// 2026-07-11). Big sections carry the oeuvre, smaller ones the influences;
// section 6 is intentionally unassigned (spare / future page). Remap freely —
// it's just this table.
const SECTION_PAGE_MAP: Record<number, string | null> = {
  7: "heaven-and-nature",
  3: "see-canto",
  5: "music",
  1: "reading-list",
  2: "contact",
  4: "inspirations",
  6: null,
};

const MEDALLION_URL = "/models/medallion.glb";
const TARGET_RADIUS = 4.4; // world units; buttons used to span ~±3.5
const SECTION_RE = /^section_0(\d)_(?:screen|bezel)$/;

const HOVER_BEZEL_EMISSIVE = new THREE.Color("#67a9ff");
const LABEL_BASE_POSITION = new THREE.Vector3(0, -4.95, 0.8);
const LABEL_RAISED_POSITION = new THREE.Vector3(0, -4.72, 1.05);

interface MedallionHubProps {
  onPageSelect: (page: PageConfig) => void;
  disabled?: boolean;
  opacity?: number;
}

function sectionOf(object: THREE.Object3D): number | null {
  const m = SECTION_RE.exec(object.name);
  return m ? Number(m[1]) : null;
}

export const MedallionHub = memo(function MedallionHub({
  onPageSelect,
  disabled = false,
  opacity = 1,
}: MedallionHubProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Mesh>(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const hoverLevels = useRef<Record<number, number>>({});
  const labelOpacityRef = useRef(0);

  const { scene } = useGLTF(MEDALLION_URL);

  const { clonedScene, sectionMeshes, normalization } = useMemo(() => {
    const clone = scene.clone(true);
    const bySection: Record<number, THREE.Mesh[]> = {};

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = Array.isArray(child.material)
        ? child.material.map((m) => m.clone())
        : child.material.clone();
      const sec = sectionOf(child);
      if (sec !== null) {
        (bySection[sec] ??= []).push(child);
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    return {
      clonedScene: clone,
      sectionMeshes: bySection,
      normalization: {
        scale: TARGET_RADIUS / Math.max(sphere.radius, 1e-6),
        offset: center.multiplyScalar(-1),
      },
    };
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((material) => {
        material.transparent = true;
        material.opacity = opacity;
      });
    });
  }, [clonedScene, opacity]);

  useEffect(() => {
    if (!disabled) return;
    setHoveredSection(null);
    document.body.style.cursor = "default";
  }, [disabled]);

  // CRT wake states (Task 29/2026-07-11): canvas emissiveMaps per screen;
  // boot cascade lights them at load, hover lifts brightness (see screenWake).
  const wake = useMemo(() => new ScreenWakeManager(), []);
  useEffect(() => {
    for (let sec = 1; sec <= 7; sec += 1) {
      const screens = (sectionMeshes[sec] ?? []).filter((m) =>
        m.name.endsWith("_screen"),
      );
      const pageId = SECTION_PAGE_MAP[sec];
      const label = pageId
        ? (PAGES.find((p) => p.id === pageId)?.label ?? "")
        : "";
      wake.attach(sec, screens, label);
    }
    // boot cascade on load: screens blink on in section order and stay lit
    wake.bootAll(0.9, 0.13);
    return () => wake.dispose();
  }, [wake, sectionMeshes]);

  useLemniscate(groupRef, { yAmplitude: 15, xAmplitude: 4, speed: 0.3 });
  useProximityTilt(tiltRef, { maxTilt: 8, range: 0.85, smoothing: 0.08 });

  useFrame((_, delta) => {
    let labelLevel = 0;

    // screens are owned by the wake manager (emissiveMap content + intensity);
    // this loop only drives the BEZEL hover glow.
    wake.update(delta, disabled ? null : hoveredSection, opacity);

    for (let sec = 1; sec <= 7; sec += 1) {
      const target = !disabled && hoveredSection === sec ? 1 : 0;
      const level = THREE.MathUtils.lerp(hoverLevels.current[sec] ?? 0, target, 0.16);
      hoverLevels.current[sec] = level;
      labelLevel = Math.max(labelLevel, level);
      const meshes = sectionMeshes[sec];
      if (!meshes || Math.abs(level - target) < 0.002 && level < 0.002) continue;
      meshes.forEach((mesh) => {
        if (mesh.name.endsWith("_screen")) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((material) => {
          if (!("emissive" in material)) return;
          const std = material as THREE.MeshStandardMaterial;
          std.emissive.copy(HOVER_BEZEL_EMISSIVE);
          std.emissiveIntensity = level * 0.48;
        });
      });
    }

    if (labelRef.current) {
      labelOpacityRef.current = THREE.MathUtils.lerp(
        labelOpacityRef.current,
        hoveredPage ? labelLevel : 0,
        0.14,
      );
      labelRef.current.position.lerp(
        hoveredPage ? LABEL_RAISED_POSITION : LABEL_BASE_POSITION,
        0.14,
      );
      const textMaterial = labelRef.current.material as THREE.MeshBasicMaterial;
      textMaterial.opacity = labelOpacityRef.current * opacity;
    }
  });

  const hoveredPage = useMemo(() => {
    if (hoveredSection === null) return null;
    const pageId = SECTION_PAGE_MAP[hoveredSection];
    return pageId ? (PAGES.find((p) => p.id === pageId) ?? null) : null;
  }, [hoveredSection]);

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (disabled) return;
    const sec = sectionOf(event.object);
    event.stopPropagation();
    setHoveredSection(sec);
    document.body.style.cursor =
      sec !== null && SECTION_PAGE_MAP[sec] ? "pointer" : "default";
  };

  const handlePointerOut = () => {
    setHoveredSection(null);
    document.body.style.cursor = "default";
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (disabled) return;
    const sec = sectionOf(event.object);
    if (sec === null) return;
    event.stopPropagation();
    const pageId = SECTION_PAGE_MAP[sec];
    const page = pageId ? PAGES.find((p) => p.id === pageId) : null;
    if (page) onPageSelect(page);
  };

  return (
    <group ref={groupRef}>
      <group ref={tiltRef}>
        {/* aesthetic base pose from the spec: ~10° pitch, 8° roll */}
        <group rotation={[THREE.MathUtils.degToRad(10), 0, THREE.MathUtils.degToRad(8)]}>
          <group scale={normalization.scale}>
            <group position={normalization.offset}>
              {/* Bvh accelerates pointer raycasts (~349k tris would otherwise
                  be brute-forced per pointermove) */}
              <Bvh firstHitOnly>
                <primitive
                  object={clonedScene}
                  onPointerMove={handlePointerMove}
                  onPointerOut={handlePointerOut}
                  onClick={handleClick}
                />
              </Bvh>
            </group>
          </group>
        </group>
        <Text
          ref={labelRef}
          position={[0, -5.4, 0.5]}
          fontSize={0.24}
          color="#dffaff"
          anchorX="center"
          anchorY="top"
          textAlign="center"
          fillOpacity={0}
          outlineWidth={0.012}
          outlineColor="#04141f"
          outlineOpacity={0.9}
          maxWidth={4.5}
        >
          {hoveredPage?.label ?? ""}
        </Text>
      </group>
    </group>
  );
});

useGLTF.preload(MEDALLION_URL);
