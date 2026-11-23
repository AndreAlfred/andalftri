import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getInfluenceById } from "@/data/influences";
import { getProjectById } from "@/data/projects";
import { PAGES } from "@/data/sceneConfig";
import { ContactDirectory } from "@/panels/ContactDirectory";
import { InfluencePanel } from "@/panels/InfluencePanel";
import { MusicPanel } from "@/panels/MusicPanel";
import { ProjectPanel } from "@/panels/ProjectPanel";
import type { DeviceCapability } from "@/lib/deviceCapability";

const HUB_ROUTE = "/";

function getInitialPathname() {
  return window.location.pathname || HUB_ROUTE;
}

function findPageByPath(pathname: string) {
  return PAGES.find((page) => page.route === pathname) ?? null;
}

interface StaticFallbackProps {
  capability: DeviceCapability;
}

export function StaticFallback({ capability }: StaticFallbackProps) {
  const [pathname, setPathname] = useState(getInitialPathname);

  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => { viewport.current?.scrollTo(0, 0); }, [pathname]);

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
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const matchingPage = findPageByPath(pathname);

    if (!matchingPage && pathname !== HUB_ROUTE) {
      window.history.replaceState({}, "", HUB_ROUTE);
      setPathname(HUB_ROUTE);
    }
  }, [pathname]);

  const activePage = useMemo(() => findPageByPath(pathname), [pathname]);
  const activeProject = activePage?.group === "oeuvre" ? getProjectById(activePage.id) : null;
  const activeInfluence = activePage?.group === "influences" ? getInfluenceById(activePage.id) : null;

  return (
    <div ref={viewport} className="h-full overflow-y-auto bg-[#0b1012] text-white">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-10">
        <header className="flex items-baseline justify-between gap-4 border-b border-white/20 pb-4">
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-at-glyph)" }}>@</h1>
          <details className="text-right text-xs text-white/65">
            <summary className="cursor-pointer">Static fallback mode</summary>
            <p className="mt-2">{capability.summary}</p>
          </details>
        </header>
        <main className="grid items-start gap-10 py-7 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label="Navigation" className="lg:col-start-1 lg:row-start-1">
            <h2 className="panel-meta mb-2 text-xs uppercase text-cyan-100/75">Navigation</h2>
            {PAGES.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => navigateTo(page.route)}
                aria-current={page.id === activePage?.id ? "page" : undefined}
                className="index-link"
              >
                {page.label}
              </button>
            ))}
          </nav>
          {activePage && (
            <section key={activePage.id} className="row-start-1 min-w-0 lg:col-start-2">
              <button type="button" onClick={() => navigateTo(HUB_ROUTE)} className="mb-3 min-h-11 text-sm text-cyan-100 underline underline-offset-4">
                Back
              </button>
              {activeProject && (activePage.id === "music"
                ? <MusicPanel project={activeProject} />
                : <ProjectPanel project={activeProject} />)}
              {activeInfluence && (activePage.id === "contact" ? (
                <>
                  <h2 className="panel-title contact-heading">{activePage.label}</h2>
                  <ContactDirectory contact={activeInfluence} />
                </>
              ) : <InfluencePanel influence={activeInfluence} />)}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
