import { Html } from "@react-three/drei";
import type { ReactNode } from "react";

interface ContentPanelProps {
  position: [number, number, number];
  pageId: string;
  activePageId: string | null;
  isTransitioning: boolean;
  isClosing?: boolean;
  children: ReactNode;
  onClose: () => void;
}

export function ContentPanel({
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

  if (!shouldRender) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      transform
      occlude={false}
      style={{
        width: "min(42rem, calc(100vw - 2rem))",
        maxWidth: "calc(100vw - 2rem)",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 320ms ease-in-out",
      }}
    >
      <div className="panel-shell relative max-h-[80vh] overflow-hidden rounded-[28px] border border-white/18 bg-black/70 text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="panel-meta absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-lg text-white/72 transition hover:border-white/25 hover:bg-white/14 hover:text-white"
          aria-label="Close panel"
        >
          ×
        </button>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-7 pr-16 sm:px-8 sm:py-8 sm:pr-18">
          {children}
        </div>
      </div>
    </Html>
  );
}
