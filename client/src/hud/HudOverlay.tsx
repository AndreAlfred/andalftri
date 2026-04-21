import { useEffect, type MouseEvent, type ReactNode } from "react";
import { PAGES } from "@/data/sceneConfig";
import { CyberspaceNav } from "@/hud/CyberspaceNav";

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
      className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(4,14,22,0.58)] px-4 py-6 backdrop-blur-md"
      onClick={handleBackdropClick}
      aria-hidden={false}
    >
      <div className="hud-shell relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#89f1ff]/25 bg-[rgba(0,20,30,0.84)] text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <div className="hud-scanlines pointer-events-none absolute inset-0 opacity-40" />
        <button
          type="button"
          onClick={onClose}
          className="panel-meta absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/7 text-sm uppercase tracking-[0.22em] text-white/72 transition hover:border-[#89f1ff]/40 hover:bg-[#89f1ff]/10 hover:text-white"
          aria-label="Close commentary overlay"
        >
          X
        </button>

        <div className="relative grid min-h-[min(42rem,calc(100vh-4rem))] grid-cols-1 gap-8 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,0.68fr)_minmax(16rem,0.32fr)] lg:px-10 lg:py-10">
          <div className="min-w-0 pt-10 lg:pt-4">{children}</div>

          <aside className="flex flex-col justify-between gap-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 lg:p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="panel-kicker text-xs uppercase text-[#89f1ff]/80">HUD</p>
                <h3 className="panel-meta text-sm uppercase text-white/72">Current page</h3>
                <p className="text-xl text-white">{title ?? "Untitled"}</p>
                {page ? <p className="panel-meta text-[11px] uppercase text-white/46">Route: {page.route}</p> : null}
              </div>

              <p className="panel-body text-sm leading-7 text-white/62">
                The meta layer stays readable, clipped, and cold, like a Halo menu hovering over the scene.
              </p>

              <CyberspaceNav currentPageId={pageId} onNavigate={onNavigate} />
            </div>

            <div className="rounded-[20px] border border-[#89f1ff]/16 bg-black/20 p-4">
              <p className="panel-meta text-[11px] uppercase text-white/54">Dismiss</p>
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
  );
}
