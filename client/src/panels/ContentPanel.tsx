import { Html } from "@react-three/drei";
import { memo, useEffect, type ReactNode } from "react";
import { SHOWCASE_DEFAULT_ASPECT } from "@/data/projects";

interface ContentPanelProps {
  position: [number, number, number];
  pageId: string;
  activePageId: string | null;
  preparingPageId?: string | null;
  isTransitioning: boolean;
  isClosing?: boolean;
  variant?: "reading" | "showcase";
  /**
   * Width / height of the showcase screenshot. The stage caps its width against
   * viewport height through this ratio, so a portrait capture yields a narrow,
   * phone-shaped stage instead of a letterboxed landscape one.
   */
  showcaseAspect?: number;
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
  preparingPageId = null,
  isTransitioning,
  isClosing = false,
  variant = "reading",
  showcaseAspect = SHOWCASE_DEFAULT_ASPECT,
  children,
  onClose,
}: ContentPanelProps) {
  const isActivePage = activePageId === pageId;
  const shouldRender = isActivePage || isClosing || preparingPageId === pageId;
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

  const isShowcase = variant === "showcase";
  // Showcase width also caps against viewport HEIGHT so the stage never
  // outgrows short desktop windows. The ratio used to be a literal 1.6, which
  // was correct only for landscape captures — for a portrait screenshot that
  // formula over-widens by ~3x and the height cap stops binding.
  const panelWidth = isShowcase
    ? `min(70rem, calc(100vw - 5rem), calc((100vh - 12rem) * ${showcaseAspect}))`
    : "min(42rem, calc(100vw - 2rem))";

  return (
    <Html
      position={position}
      center
      zIndexRange={[15, 0]}
      style={{
        width: panelWidth,
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
        aria-hidden={!isVisible}
        inert={!isVisible}
        className={isShowcase ? "panel-shell relative text-white" : "panel-shell reading-surface relative text-white"}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 320ms ease-in-out, transform 380ms ease-out",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className={isShowcase ? "reading-close showcase-close" : "reading-close"}
          aria-label="Close panel"
        >
          ×
        </button>
        {isShowcase ? children : <div className="reading-scroll">{children}</div>}
      </div>
    </Html>
  );
});
