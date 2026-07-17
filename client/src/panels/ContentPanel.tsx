import { Html } from "@react-three/drei";
import { memo, useEffect, type ReactNode } from "react";

interface ContentPanelProps {
  position: [number, number, number];
  pageId: string;
  activePageId: string | null;
  isTransitioning: boolean;
  isClosing?: boolean;
  children: ReactNode;
  onClose: () => void;
}

// Screen-space (non-transform) Html on purpose: the camera always faces these
// panels head-on, so 3D transform scaling added nothing — and it made panel
// size unpredictable (viewport CSS units re-scaled through the 3D transform
// could fill the screen and bury every escape control) and blurred the text.
// zIndexRange keeps the panel BELOW the app HUD pill (z-20) and overlays —
// drei's default is ~16.7 million, which trapped users on page views
// (2026-07-11, Andrew: "I can't leave, lol").
export const ContentPanel = memo(function ContentPanel({
  position,
  pageId,
  activePageId,
  isTransitioning,
  isClosing = false,
  children,
  onClose,
}: ContentPanelProps) {
  const isActivePage = activePageId === pageId;
  const shouldRender = isActivePage || isClosing;
  const isVisible = isActivePage && !isTransitioning && !isClosing;

  useEffect(() => {
    if (!isVisible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isVisible, onClose]);

  if (!shouldRender) return null;

  return (
    <Html
      position={position}
      center
      zIndexRange={[15, 0]}
      style={{
        width: "min(42rem, calc(100vw - 2rem))",
        // pointerEvents lives here (not on the inner wrapper) because this is
        // the element drei centers via translate3d — its box is the same
        // size/position whether the panel is visible or not, so it's the one
        // that must stop intercepting clicks while hidden/animating out.
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {/* Entrance/exit animation lives on this inner wrapper, not on the Html
          element's own style, so it never clobbers drei's `center` transform
          (translate3d(-50%,-50%,0)) applied to the Html element itself. */}
      <div
        className="panel-shell relative overflow-hidden rounded-[28px] border border-white/18 bg-black/70 text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 320ms ease-in-out, transform 380ms ease-out",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="panel-meta absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-lg text-white/72 transition hover:border-white/25 hover:bg-white/14 hover:text-white"
          aria-label="Close panel"
        >
          ×
        </button>
        <div className="max-h-[72vh] overflow-y-auto px-6 py-7 pr-16 sm:px-8 sm:py-8 sm:pr-18">
          {children}
          <p className="panel-meta mt-6 border-t border-white/8 pt-4 text-right text-[0.62rem] uppercase tracking-[0.24em] text-white/35">
            esc / × — back to the hub
          </p>
        </div>
      </div>
    </Html>
  );
});
