import { Environment as DreiEnvironment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProjectById } from "@/data/projects";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useCameraStore } from "@/hooks/useCamera";
import { ContentPanel } from "@/panels/ContentPanel";
import { ProjectPanel } from "@/panels/ProjectPanel";
import { CameraController } from "@/scene/CameraController";
import { Environment } from "@/scene/Environment";
import { MenuHub } from "@/scene/MenuHub";

const PANEL_CLOSE_DELAY_MS = 320;
const HUB_ROUTE = "/";

function getInitialPathname() {
  return window.location.pathname || HUB_ROUTE;
}

function findPageByPath(pathname: string) {
  return PAGES.find((page) => page.route === pathname) ?? null;
}

export default function App() {
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);
  const flyTo = useCameraStore((state) => state.flyTo);
  const returnToHub = useCameraStore((state) => state.returnToHub);

  const [pathname, setPathname] = useState(getInitialPathname);
  const [closingPageId, setClosingPageId] = useState<string | null>(null);
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

  const handlePageSelect = useCallback(
    (page: PageConfig) => {
      clearCloseTimeout();
      setClosingPageId(null);
      navigateTo(page.route);
    },
    [clearCloseTimeout, navigateTo],
  );

  const handlePanelClose = useCallback(() => {
    if (!currentPage || closingPageId || pathname === HUB_ROUTE) return;

    navigateTo(HUB_ROUTE);
  }, [closingPageId, currentPage, navigateTo, pathname]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1a1a1a]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Environment />
        <DreiEnvironment preset="city" />
        <CameraController />
        <MenuHub onPageSelect={handlePageSelect} />
        {PAGES.map((page) => {
          const project = page.group === "oeuvre" ? getProjectById(page.id) : null;

          return (
            <ContentPanel
              key={page.id}
              position={page.cameraLookAt}
              pageId={page.id}
              activePageId={currentPage}
              isTransitioning={isTransitioning}
              isClosing={closingPageId === page.id}
              onClose={handlePanelClose}
            >
              {project ? (
                <ProjectPanel project={project} />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[0.72rem] uppercase tracking-[0.26em] text-cyan-200/75">
                      {page.group === "oeuvre" ? "Oeuvre" : "Influences"}
                    </p>
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                      {page.label}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                    Coming soon, {page.label} is getting its dedicated panel treatment next. For
                    now, this placeholder keeps the camera target, panel mounting, fade timing, and
                    URL sync in place while the influence layouts land.
                  </p>
                </div>
              )}
            </ContentPanel>
          );
        })}
      </Canvas>

      {currentPage ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center px-4 pt-5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <span className="text-white/70">Viewing</span>
            <span className="font-medium text-white">{currentPageLabel}</span>
            <button
              type="button"
              onClick={handlePanelClose}
              disabled={isTransitioning || Boolean(closingPageId)}
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
