import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getSectionForPage } from "@/data/hubSections";
import { PAGES } from "@/data/sceneConfig";
import { computeBootTimeline } from "@/hud/bootLifecycle";
import { HELMET_BOOT_CHAR_MS, HELMET_BOOT_LINE } from "@/hud/helmetBoot";
import { computeReturnAnchor, type ReturnAnchor } from "@/hud/returnAnchor";
import { VisorChrome } from "@/hud/VisorChrome";

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

// The `@` return bubble parks on the viewport edge that faces the hub (the
// direction the camera flew in from). The wrapper owns edge placement; the
// caret aims via --return-angle (see .hud-return-caret in index.css).
function returnWrapperStyle(anchor: ReturnAnchor): CSSProperties {
  const inset = "1.1rem";
  switch (anchor.edge) {
    case "right":
      return { right: inset, top: `${anchor.alongPercent}%`, transform: "translateY(-50%)" };
    case "left":
      return { left: inset, top: `${anchor.alongPercent}%`, transform: "translateY(-50%)" };
    case "top":
      return { top: inset, left: `${anchor.alongPercent}%`, transform: "translateX(-50%)" };
    case "bottom":
      return { bottom: inset, left: `${anchor.alongPercent}%`, transform: "translateX(-50%)" };
  }
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

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = computeBootTimeline(HELMET_BOOT_LINE.length, HELMET_BOOT_CHAR_MS, {
      reducedMotion,
    });

    setBootActive(true);

    let interval: number | undefined;

    if (reducedMotion) {
      // No typewriter: show the full line immediately, then hold briefly.
      setVisibleChars(HELMET_BOOT_LINE.length);
    } else {
      setVisibleChars(0);
      interval = window.setInterval(() => {
        setVisibleChars((current) => {
          if (current >= HELMET_BOOT_LINE.length) {
            window.clearInterval(interval);
            return current;
          }

          return current + 1;
        });
      }, HELMET_BOOT_CHAR_MS);
    }

    const fadeTimer = window.setTimeout(() => {
      setBootActive(false);
    }, timeline.fadeStartMs);

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
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
    // D2: slowed from 160ms so the readouts feel like a sampled instrument,
    // not jittering noise -- the value-generation math above is untouched,
    // it just advances on a calmer clock.
    const interval = window.setInterval(updateOrnaments, 500);
    return () => window.clearInterval(interval);
  }, [bootActive, currentPage, isHudOpen, isTransitioning]);

  const isContact = currentPage?.id === "contact";
  const bootLine = HELMET_BOOT_LINE.slice(0, visibleChars);
  const returnAnchor = useMemo(
    () => (currentPage ? computeReturnAnchor(currentPage.cameraLookAt) : null),
    [currentPage],
  );

  return (
    <div data-reading={currentPage ? true : undefined} className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <VisorChrome noise={!currentPage} noiseOpacity={0.45} />
      <div className="helmet-ornament absolute left-4 top-24 hidden w-[min(11rem,32vw)] sm:left-6 sm:top-28 sm:block">
        <p className="helmet-ornament-label">Vector drift</p>
        <p className="helmet-ornament-value">
          {formatSigned(ornaments.drift[0])} / {formatSigned(ornaments.drift[1])} / {formatSigned(ornaments.drift[2])}
        </p>
      </div>
      <div className="helmet-ornament absolute right-4 top-28 hidden w-[min(10rem,30vw)] text-right sm:right-6 sm:top-32 sm:block">
        <p className="helmet-ornament-label">Section / signal</p>
        <p className="helmet-ornament-value">
          {String(activeSection ?? 0).padStart(2, "0")} // {String(ornaments.signal).padStart(2, "0")}%
        </p>
      </div>
      <div className="helmet-ornament absolute bottom-28 left-4 hidden w-[min(12rem,38vw)] sm:bottom-32 sm:left-6 sm:block">
        <p className="helmet-ornament-label">Heading / noise</p>
        <p className="helmet-ornament-value">
          {ornaments.heading.toFixed(0).padStart(3, "0")} deg // {String(ornaments.noise).padStart(2, "0")} db
        </p>
      </div>

      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-4">
        <div
          className={`max-w-[min(92vw,42rem)] px-5 py-5 text-center transition-all duration-700 ${
            bootActive ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
        >
          <p className="panel-meta text-[0.58rem] uppercase tracking-[0.28em] text-[#b2fbff]/72">
            Visor boot
          </p>
          <p className="label-long mt-2 break-words text-[0.7rem] uppercase tracking-[0.12em] text-white/82 sm:text-[0.8rem]">
            {bootLine}
          </p>
        </div>
      </div>

      {currentPage && !isContact && !isHudOpen ? (
        <div className="absolute right-4 top-2 sm:right-6">
          <button
            type="button"
            onClick={onToggleHud}
            className="panel-meta pointer-events-auto min-h-11 px-2 text-sm text-cyan-100 underline underline-offset-4"
            aria-label={`Open context for ${currentPage.label}`}
          >
            Context
          </button>
        </div>
      ) : null}

      {currentPage && returnAnchor ? (
        <div className={isContact ? "absolute top-2 left-4" : "return-anchor absolute"} style={isContact ? undefined : returnWrapperStyle(returnAnchor)}>
          <button
            type="button"
            onClick={onBack}
            disabled={isTransitioning || isClosing}
            className="visor-return"
            style={{ fontFamily: "var(--font-at-glyph)" }}
            aria-label="Return to the main artifact"
          >
            @
          </button>
          {/* Aim, then push past the bubble; the inner span only bobs along
              the rotated axis so the transforms never fight. */}
          {!isContact && <span
            aria-hidden="true"
            className="return-direction pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${returnAnchor.angleDeg}deg) translateY(-3.6rem)`,
            }}
          >
            <span className="hud-return-caret block panel-meta text-lg leading-none text-[#9ef6ff]/90">
              ^
            </span>
          </span>}
        </div>
      ) : null}
    </div>
  );
}
