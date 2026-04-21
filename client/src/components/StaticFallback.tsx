import { useCallback, useEffect, useMemo, useState } from "react";
import { getInfluenceById } from "@/data/influences";
import { getProjectById } from "@/data/projects";
import { PAGES } from "@/data/sceneConfig";
import { InfluencePanel } from "@/panels/InfluencePanel";
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
    <div className="relative min-h-screen overflow-hidden bg-[#101214] text-white">
      <div className="absolute inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(137,241,255,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,#161a1f_0%,#0a0d10_100%)]" />
        <div className="fallback-grid absolute inset-0" />
        <div className="absolute left-1/2 top-[18%] h-56 w-56 -translate-x-1/2 rounded-full border border-white/12 bg-white/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="panel-meta text-[0.72rem] uppercase text-cyan-200/70">Static fallback mode</p>
            <h1 className="panel-title text-5xl text-white sm:text-6xl">@</h1>
            <p className="max-w-xl text-sm text-white/68 sm:text-base">
              This device gets the lighter 2D build so the site still feels intentional without asking weak hardware to render the full 3D scene.
            </p>
          </div>
          <div className="rounded-3xl border border-white/12 bg-black/30 px-4 py-3 text-right shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <p className="panel-meta text-[0.66rem] uppercase text-white/42">Capability</p>
            <p className="mt-1 text-sm text-white/78">{capability.summary}</p>
          </div>
        </header>

        <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[minmax(18rem,20rem)_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/12 bg-black/28 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md sm:p-5">
            <p className="panel-meta text-[0.72rem] uppercase text-white/42">Navigation</p>
            <div className="mt-4 space-y-3">
              {PAGES.map((page) => {
                const isActive = activePage?.id === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => navigateTo(page.route)}
                    className={`fallback-link group flex w-full items-center justify-between rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-cyan-200/35 bg-cyan-200/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/78 hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>
                      <span className="panel-title block text-2xl leading-none">{page.label}</span>
                      <span className="panel-meta mt-2 block text-[0.64rem] uppercase text-white/42">{page.group}</span>
                    </span>
                    <span aria-hidden="true" className="panel-meta text-white/38 transition group-hover:text-white/58">
                      ↗
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-h-[24rem] rounded-[32px] border border-white/12 bg-black/36 p-4 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
            {activePage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="panel-meta text-[0.72rem] uppercase text-cyan-200/72">{activePage.group}</p>
                    <h2 className="panel-title mt-2 text-4xl text-white sm:text-5xl">{activePage.label}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo(HUB_ROUTE)}
                    className="panel-meta rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs uppercase text-white/72 transition hover:border-white/24 hover:bg-white/14 hover:text-white"
                  >
                    Back
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto pr-1">
                  {activeProject ? <ProjectPanel project={activeProject} /> : null}
                  {activeInfluence ? <InfluencePanel influence={activeInfluence} /> : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <p className="panel-meta text-[0.72rem] uppercase text-cyan-200/70">Wireframe poster mode</p>
                <h2 className="panel-title mt-4 text-4xl text-white sm:text-5xl">Pick a page</h2>
                <p className="mt-4 max-w-lg text-sm text-white/68 sm:text-base">
                  The full 3D hub is swapped for a lighter poster-like menu here, but the portfolio content and routes still work the same.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
