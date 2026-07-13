import { useEffect, useMemo, useState } from "react";
import { PAGES } from "@/data/sceneConfig";
import { HELMET_BOOT_CHAR_MS, HELMET_BOOT_LINE } from "@/hud/helmetBoot";

interface HelmetFrameProps {
  bootSequenceId: number;
  currentPageId: string | null;
  isHudOpen: boolean;
  isTransitioning: boolean;
  isClosing: boolean;
  onBack: () => void;
  onToggleHud: () => void;
}

export function HelmetFrame({
  bootSequenceId,
  currentPageId,
  isHudOpen,
  isTransitioning,
  isClosing,
  onBack,
  onToggleHud,
}: HelmetFrameProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [bootActive, setBootActive] = useState(false);

  useEffect(() => {
    if (!bootSequenceId) return undefined;

    setVisibleChars(0);
    setBootActive(true);

    const interval = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= HELMET_BOOT_LINE.length) {
          window.clearInterval(interval);
          return current;
        }

        return current + 1;
      });
    }, HELMET_BOOT_CHAR_MS);

    const fadeTimer = window.setTimeout(() => {
      setBootActive(false);
    }, HELMET_BOOT_LINE.length * HELMET_BOOT_CHAR_MS + 1800);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fadeTimer);
    };
  }, [bootSequenceId]);

  const currentPage = useMemo(
    () => PAGES.find((page) => page.id === currentPageId) ?? null,
    [currentPageId],
  );

  const bootLine = HELMET_BOOT_LINE.slice(0, visibleChars);
  const cursorVisible = bootActive || visibleChars < HELMET_BOOT_LINE.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div className="helmet-vignette absolute inset-0" />
      <div className="helmet-peripheral-blur absolute inset-0" />
      <div className="helmet-edge-glow helmet-edge-glow-top absolute inset-x-0 top-0 h-44" />
      <div className="helmet-edge-glow helmet-edge-glow-right absolute bottom-0 right-0 top-0 w-32" />
      <div className="helmet-edge-glow helmet-edge-glow-bottom absolute inset-x-0 bottom-0 h-40" />
      <div className="helmet-edge-glow helmet-edge-glow-left absolute bottom-0 left-0 top-0 w-32" />
      <div className="helmet-visor-noise absolute inset-0 opacity-45" />

      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <div
          className={`helmet-chip max-w-[min(92vw,42rem)] px-4 py-2 text-center transition-all duration-700 ${
            bootActive || visibleChars > 0
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
        >
          <p className="panel-meta text-[0.58rem] uppercase tracking-[0.28em] text-[#b2fbff]/72">
            Visor boot
          </p>
          <p className="panel-meta mt-2 break-words text-[0.7rem] uppercase tracking-[0.24em] text-white/82 sm:text-[0.8rem]">
            {bootLine}
            <span className={`ml-1 inline-block text-[#9ef6ff] ${cursorVisible ? "animate-pulse" : "opacity-0"}`}>
              _
            </span>
          </p>
        </div>
      </div>

      {currentPage ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5">
          <div className="helmet-chip pointer-events-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="panel-meta text-[0.58rem] uppercase tracking-[0.28em] text-[#b2fbff]/72">
                Helmet narrator
              </p>
              <p className="truncate pt-1 text-sm text-white/70 sm:text-base">
                {currentPage.label}
              </p>
              <p className="panel-meta pt-1 text-[0.58rem] uppercase tracking-[0.24em] text-white/42">
                {currentPage.group} // {currentPage.route}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onToggleHud}
                className="helmet-action panel-meta flex h-10 w-10 items-center justify-center rounded-full text-sm uppercase tracking-[0.24em] text-white/80"
                aria-label={isHudOpen ? "Close helmet narrator" : "Open helmet narrator"}
              >
                @
              </button>
              <button
                type="button"
                onClick={onBack}
                disabled={isTransitioning || isClosing}
                className="helmet-action panel-meta rounded-full px-4 py-2 text-[0.64rem] uppercase tracking-[0.24em] text-white/78 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
