import { Environment as DreiEnvironment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { getInfluenceById } from "@/data/influences";
import { getProjectById } from "@/data/projects";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { Commentary } from "@/hud/Commentary";
import { HelmetFrame } from "@/hud/HelmetFrame";
import { HudOverlay } from "@/hud/HudOverlay";
import { useCameraStore } from "@/hooks/useCamera";
import { ContentPanel } from "@/panels/ContentPanel";
import { InfluencePanel } from "@/panels/InfluencePanel";
import { MusicPanel } from "@/panels/MusicPanel";
import { ProjectPanel } from "@/panels/ProjectPanel";
import { CameraController } from "@/scene/CameraController";
import { Environment } from "@/scene/Environment";
import {
  getLightingPreviewSettings,
  STUDIO_LIGHTING,
} from "@/scene/lightingConfig";
import { MenuHub } from "@/scene/MenuHub";

const PANEL_CLOSE_DELAY_MS = 320;
const HUB_ROUTE = "/";

function getInitialPathname() {
  return window.location.pathname || HUB_ROUTE;
}

function findPageByPath(pathname: string) {
  return PAGES.find((page) => page.route === pathname) ?? null;
}

interface SceneExperienceProps {
  bootSequenceId: number;
}

export default function SceneExperience({ bootSequenceId }: SceneExperienceProps) {
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);
  const flyTo = useCameraStore((state) => state.flyTo);
  const returnToHub = useCameraStore((state) => state.returnToHub);

  const lightingSettings = useMemo(
    () => getLightingPreviewSettings(window.location.search),
    [],
  );
  const toneMapping =
    lightingSettings.mode === "studio" && lightingSettings.toneMapping === "agx"
      ? THREE.AgXToneMapping
      : THREE.ACESFilmicToneMapping;
  const toneMappingExposure =
    lightingSettings.mode === "studio" ? STUDIO_LIGHTING.renderer.exposure : 1;

  const [pathname, setPathname] = useState(getInitialPathname);
  const [closingPageId, setClosingPageId] = useState<string | null>(null);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const navigateTo = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setPathname(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getInitialPathname());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  useEffect(() => {
    const matchingPage = findPageByPath(pathname);

    if (!matchingPage) {
      if (pathname !== HUB_ROUTE) {
        window.history.replaceState({}, "", HUB_ROUTE);
        setPathname(HUB_ROUTE);
        return;
      }

      if (currentPage && !closingPageId) {
        setIsHudOpen(false);
        setClosingPageId(currentPage);
        clearCloseTimeout();
        closeTimeoutRef.current = window.setTimeout(() => {
          returnToHub();
          setClosingPageId(null);
          closeTimeoutRef.current = null;
        }, PANEL_CLOSE_DELAY_MS);
      }

      return;
    }

    clearCloseTimeout();
    if (closingPageId) {
      setClosingPageId(null);
    }

    if (currentPage !== matchingPage.id) {
      flyTo(matchingPage.cameraPosition, matchingPage.cameraLookAt, matchingPage.id);
    }
  }, [pathname, currentPage, closingPageId, flyTo, returnToHub, clearCloseTimeout]);

  const currentPageLabel = useMemo(
    () => PAGES.find((page) => page.id === currentPage)?.label ?? null,
    [currentPage],
  );

  const pagePanels = useMemo(
    () =>
      PAGES.map((page) => {
        const project = page.group === "oeuvre" ? getProjectById(page.id) : null;
        return {
          page,
          project,
          influence: page.group === "influences" ? getInfluenceById(page.id) : null,
          // Screenshot projects get the standalone showcase stage (2026-07-18
          // spec §4); their copy lives in the context overlay instead.
          isShowcase: Boolean(project && project.media.screenshots?.length),
          isMusic: page.id === "music",
        };
      }),
    [],
  );

  const currentPanel = useMemo(
    () => pagePanels.find(({ page }) => page.id === currentPage) ?? null,
    [pagePanels, currentPage],
  );

  const handlePageSelect = useCallback(
    (page: PageConfig) => {
      clearCloseTimeout();
      setClosingPageId(null);
      setIsHudOpen(false);
      navigateTo(page.route);
    },
    [clearCloseTimeout, navigateTo],
  );

  const handlePanelClose = useCallback(() => {
    if (!currentPage || closingPageId || pathname === HUB_ROUTE) return;

    setIsHudOpen(false);
    navigateTo(HUB_ROUTE);
  }, [closingPageId, currentPage, navigateTo, pathname]);

  const handleHudNavigate = useCallback(
    (pageId: string) => {
      const targetPage = PAGES.find((page) => page.id === pageId);
      if (!targetPage) return;

      setIsHudOpen(false);
      clearCloseTimeout();
      setClosingPageId(null);
      navigateTo(targetPage.route);
    },
    [clearCloseTimeout, navigateTo],
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1a1a]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping,
          toneMappingExposure,
        }}
      >
        <Environment
          lightingMode={lightingSettings.mode}
          keyLightPosition={lightingSettings.keyLightPosition}
        />
        {lightingSettings.mode === "legacy" ? (
          <DreiEnvironment preset="city" />
        ) : null}
        <CameraController />
        <MenuHub
          onPageSelect={handlePageSelect}
          bootSequenceId={bootSequenceId}
          lightingMode={lightingSettings.mode}
          screensDormant={lightingSettings.screensDormant}
        />
        {pagePanels.map(({ page, project, influence, isShowcase, isMusic }) => (
          <ContentPanel
            key={page.id}
            position={page.cameraLookAt}
            pageId={page.id}
            activePageId={currentPage}
            isTransitioning={isTransitioning}
            isClosing={closingPageId === page.id}
            variant={isShowcase ? "showcase" : "card"}
            onClose={handlePanelClose}
          >
            {project ? (
              isMusic ? (
                <MusicPanel project={project} />
              ) : (
                <ProjectPanel project={project} />
              )
            ) : null}
            {influence ? <InfluencePanel influence={influence} /> : null}
          </ContentPanel>
        ))}
      </Canvas>

      <HelmetFrame
        bootSequenceId={bootSequenceId}
        currentPageId={currentPage}
        isHudOpen={isHudOpen}
        isTransitioning={isTransitioning}
        isClosing={Boolean(closingPageId)}
        onBack={handlePanelClose}
        onToggleHud={() => setIsHudOpen((open) => !open)}
      />

      {currentPage ? (
        <HudOverlay
          open={isHudOpen}
          pageId={currentPage}
          title={currentPageLabel ?? undefined}
          onClose={() => setIsHudOpen(false)}
          onNavigate={handleHudNavigate}
        >
          <Commentary
            pageId={currentPage}
            // Showcase pages moved their copy/tech-stack/links into this
            // overlay; music keeps its copy in the panel, so no project here.
            project={currentPanel?.isShowcase ? currentPanel.project : null}
          />
        </HudOverlay>
      ) : null}
    </div>
  );
}
