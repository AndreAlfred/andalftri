import { useEffect, type MouseEvent, type ReactNode } from "react";
import { PAGES } from "@/data/sceneConfig";
import { CyberspaceNav } from "@/hud/CyberspaceNav";
import { VisorChrome } from "@/hud/VisorChrome";

interface HudOverlayProps {
  open: boolean;
  pageId: string | null;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  onNavigate: (pageId: string) => void;
}

export function HudOverlay({ open, pageId, title, children, onClose, onNavigate }: HudOverlayProps) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const page = PAGES.find((entry) => entry.id === pageId) ?? null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(4,14,22,0.45)] px-4 py-6 backdrop-blur-md"
      onClick={handleBackdropClick}
      aria-hidden={false}
    >
      <VisorChrome aurora={false} noise={false} />

      <div className="hud-shell helmet-panel relative w-full max-w-4xl overflow-hidden rounded-[32px] text-white">
        <div className="hud-scanlines pointer-events-none absolute inset-0 opacity-40" />
        <div className="helmet-visor-noise pointer-events-none absolute inset-0 opacity-35" />
        <button
          type="button"
          onClick={onClose}
          className="helmet-action panel-meta absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm uppercase tracking-[0.22em] text-white/72 transition hover:text-white"
          aria-label="Close commentary overlay"
        >
          X
        </button>

        {/* Padding frame: fixed dead-space buffer between the shell's
            rounded-[32px] clip region and the scroll viewport. Padding lives
            here, NOT on the scroll element below, so scrolled content is
            always inset from the corner curves (RC-2). h- (not min-h-) pins
            the frame to a fixed height — min(42rem, viewport minus chrome) —
            so short viewports (100vh < 42rem) cap the frame instead of
            letting it grow past the screen; flex + min-h-0 on the scroll
            child lets it shrink and scroll instead of overflowing the cap. */}
        <div className="relative flex h-[min(42rem,calc(100vh-4rem))] flex-col px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="scroll-fade-y min-h-0 flex-1 overflow-y-auto">
            <div className="min-h-full grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(16rem,0.32fr)]">
              <div className="min-w-0 pt-10 lg:pt-4">{children}</div>

              <aside className="helmet-chip flex flex-col justify-between gap-6 rounded-[24px] p-5 lg:p-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="panel-kicker text-xs uppercase text-[#89f1ff]/80">Helmet narrator</p>
                    <h3 className="panel-meta text-sm uppercase text-white/72">Current page</h3>
                    <p className="text-xl text-white">{title ?? "Untitled"}</p>
                    {page ? <p className="panel-meta text-[11px] uppercase text-white/46">Route: {page.route}</p> : null}
                  </div>

                  <p className="panel-body text-sm leading-7 text-white/62">
                    The visor is the storyteller now: cold, clipped, and hovering at the edges while the world stays central.
                  </p>

                  <CyberspaceNav currentPageId={pageId} onNavigate={onNavigate} />
                </div>

                <div className="rounded-[20px] border border-[#89f1ff]/16 bg-black/20 p-4">
                  <p className="panel-meta text-[11px] uppercase text-white/54">Exit helmet view</p>
                  <ul className="panel-body mt-3 space-y-2 text-sm text-white/72">
                    <li>Click outside</li>
                    <li>Press Escape</li>
                    <li>Use the close button</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
