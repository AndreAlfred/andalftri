import { useEffect, type MouseEvent, type ReactNode } from "react";
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
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-4"
      onClick={handleBackdropClick}
    >
      <section aria-label={`${title ?? "Page"} context`} className="reading-surface relative w-full max-w-4xl text-white">
        <button type="button" className="reading-close" onClick={onClose} aria-label="Close context overlay">×</button>
        <div className="reading-scroll context-scroll">
          <div className="min-w-0">{children}</div>
          <CyberspaceNav currentPageId={pageId} onNavigate={onNavigate} />
        </div>
      </section>
    </div>
  );
}
