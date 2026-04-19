import { Environment as DreiEnvironment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PAGES } from "@/data/sceneConfig";
import { useCameraStore } from "@/hooks/useCamera";
import { Environment } from "@/scene/Environment";
import { CameraController } from "@/scene/CameraController";
import { MenuHub } from "@/scene/MenuHub";

export default function App() {
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);
  const returnToHub = useCameraStore((state) => state.returnToHub);

  const currentPageLabel = useMemo(
    () => PAGES.find((page) => page.id === currentPage)?.label ?? null,
    [currentPage],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1a1a]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Environment />
        <DreiEnvironment preset="city" />
        <CameraController />
        <MenuHub />
      </Canvas>

      {currentPage ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="text-white/70">Viewing</span>
            <span className="font-medium text-white">{currentPageLabel}</span>
            <button
              type="button"
              onClick={returnToHub}
              disabled={isTransitioning}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
