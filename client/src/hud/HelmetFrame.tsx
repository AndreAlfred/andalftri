import { useEffect, useMemo, useState } from "react";
import { getSectionForPage } from "@/data/hubSections";
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

interface OrnamentState {
  signal: number;
  drift: [number, number, number];
  heading: number;
  noise: number;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}`;
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
  const [ornaments, setOrnaments] = useState<OrnamentState>({
    signal: 84,
    drift: [0, 0, 8],
    heading: 0,
    noise: 18,
  });

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
  const activeSection = useMemo(() => getSectionForPage(currentPageId), [currentPageId]);

  useEffect(() => {
    const baseVector = currentPage?.cameraPosition ?? [0, 0, 8];
    let tick = 0;

    const updateOrnaments = () => {
      tick += 1;
      const phase = tick / 7;
      const transitioningPenalty = isTransitioning ? 11 : 0;
      const hudPenalty = isHudOpen ? 6 : 0;
      const noiseLift = bootActive ? 14 : 0;
      const signalBase = currentPage ? 78 : 91;
      const signalVariance = Math.sin(phase) * 4 + Math.cos(phase * 0.63) * 2;
      const signal = Math.max(
        44,
        Math.min(99, Math.round(signalBase + signalVariance - transitioningPenalty - hudPenalty)),
      );
      const drift: [number, number, number] = [
        baseVector[0] + Math.sin(phase * 0.7) * 0.36,
        baseVector[1] + Math.cos(phase * 0.55) * 0.28,
        baseVector[2] + Math.sin(phase * 0.38) * 0.18,
      ];
      const heading = ((Math.atan2(baseVector[0] || 0.0001, baseVector[1] || 0.0001) * 180) / Math.PI + 360) % 360;
      const headingJitter = (Math.sin(phase * 0.41) + Math.cos(phase * 0.29)) * 1.8;
      const noise = Math.max(4, Math.round(12 + noiseLift + (100 - signal) * 0.22 + Math.abs(Math.sin(phase * 1.4)) * 7));

      setOrnaments({
        signal,
        drift,
        heading: (heading + headingJitter + 360) % 360,
        noise,
      });
    };

    updateOrnaments();
    const interval = window.setInterval(updateOrnaments, 160);
    return () => window.clearInterval(interval);
  }, [bootActive, currentPage, isHudOpen, isTransitioning]);

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
      <div className="helmet-ornament absolute left-4 top-24 w-[min(11rem,32vw)] sm:left-6 sm:top-28">
        <p className="helmet-ornament-label">Vector drift</p>
        <p className="helmet-ornament-value">
          {formatSigned(ornaments.drift[0])} / {formatSigned(ornaments.drift[1])} / {formatSigned(ornaments.drift[2])}
        </p>
      </div>
      <div className="helmet-ornament absolute right-4 top-28 w-[min(10rem,30vw)] text-right sm:right-6 sm:top-32">
        <p className="helmet-ornament-label">Section / signal</p>
        <p className="helmet-ornament-value">
          {String(activeSection ?? 0).padStart(2, "0")} // {String(ornaments.signal).padStart(2, "0")}%
        </p>
      </div>
      <div className="helmet-ornament absolute bottom-28 left-4 w-[min(12rem,38vw)] sm:bottom-32 sm:left-6">
        <p className="helmet-ornament-label">Heading / noise</p>
        <p className="helmet-ornament-value">
          {ornaments.heading.toFixed(0).padStart(3, "0")} deg // {String(ornaments.noise).padStart(2, "0")} db
        </p>
      </div>

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
