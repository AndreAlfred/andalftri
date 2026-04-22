import { Suspense, lazy, useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StaticFallback } from "@/components/StaticFallback";
import { getDeviceCapability, type DeviceCapability } from "@/lib/deviceCapability";

const SceneExperience = lazy(() => import("@/components/SceneExperience"));

export default function App() {
  const [capability, setCapability] = useState<DeviceCapability | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getDeviceCapability()
      .then((result) => {
        if (!cancelled) {
          setCapability(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCapability({
            strength: "capable",
            tier: 2,
            type: "FALLBACK",
            isWeak: false,
            summary: "GPU tier unknown",
            result: {
              tier: 2,
              type: "FALLBACK",
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!capability) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d1014] text-white">
        <div className="rounded-[24px] border border-white/10 bg-black/30 px-6 py-5 text-center shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-md">
          <p className="panel-meta text-[0.68rem] uppercase text-cyan-200/72">Capability check</p>
          <p className="panel-body mt-3 text-sm text-white/72">Deciding whether to load the full 3D scene.</p>
        </div>
      </div>
    );
  }

  if (capability.isWeak) {
    return <StaticFallback capability={capability} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0d1014]">
      <div className={`h-full w-full transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}>
        <Suspense fallback={null}>
          <SceneExperience />
        </Suspense>
      </div>
      <LoadingScreen onReady={() => setSceneReady(true)} />
    </div>
  );
}
