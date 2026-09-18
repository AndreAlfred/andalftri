import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StaticFallback } from "@/components/StaticFallback";
import { MEDALLION_URL } from "@/lib/assetUrls";
import { getDeviceCapability, type DeviceCapability } from "@/lib/deviceCapability";
import { preloadAsset, shouldPreloadScene } from "@/lib/preloadAsset";
import { getPreviewFlags } from "@/lib/qualityTier";
import type { SceneLoadState } from "@/lib/sceneLoadState";

const SceneExperience = lazy(() => import("@/components/SceneExperience"));

const INITIAL_LOAD_STATE: SceneLoadState = {
  reported: false,
  active: false,
  progress: 0,
  item: "",
  loaded: 0,
  total: 0,
};

export default function App() {
  const { forceFullScene, forceLite } =
    typeof window === "undefined"
      ? { forceFullScene: false, forceLite: false }
      : getPreviewFlags(window.location.search);
  const [capability] = useState<DeviceCapability | null>(() =>
    forceLite ? null : getDeviceCapability(),
  );
  const [sceneReady, setSceneReady] = useState(false);
  const [bootSequenceId, setBootSequenceId] = useState(0);
  const [loadState, setLoadState] = useState<SceneLoadState>(INITIAL_LOAD_STATE);

  // Stable identity across re-renders (RC-5): LoadingScreen's ready effect
  // depends on this callback, so an inline arrow here would reschedule the
  // effect on every App re-render and re-fire the boot sequence forever.
  const handleSceneReady = useCallback(() => {
    setSceneReady(true);
    setBootSequenceId(Date.now());
  }, []);

  // Start the one required scene asset while the lazy Three/R3F chunks are
  // still downloading. The old useGLTF.preload lived inside that lazy chunk,
  // so the 2.8 MB transfer could not even be discovered until JS had arrived
  // and executed. Unsupported/lite devices do not pay for it.
  useEffect(() => {
    if (
      !capability ||
      !shouldPreloadScene(forceLite, forceFullScene, capability.isWeak)
    ) {
      return;
    }
    preloadAsset(document, MEDALLION_URL, "fetch", "model/gltf-binary");
  }, [capability, forceFullScene, forceLite]);

  if (forceLite) {
    return (
      <StaticFallback
        capability={{
          strength: "weak",
          tier: 1,
          type: "WEBGL_UNSUPPORTED",
          isWeak: true,
          summary: "Lite preview (?lite=1)",
          result: { tier: 1, type: "WEBGL_UNSUPPORTED" },
        }}
      />
    );
  }

  if (capability?.isWeak && !forceFullScene) {
    return <StaticFallback capability={capability} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0d1014]">
      <div className={`h-full w-full transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}>
        <Suspense fallback={null}>
          <SceneExperience
            bootSequenceId={bootSequenceId}
            onLoadStateChange={setLoadState}
          />
        </Suspense>
      </div>
      <LoadingScreen loadState={loadState} onReady={handleSceneReady} />
    </div>
  );
}
