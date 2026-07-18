interface VisorChromeProps {
  /** Render the aspect-aware aurora glow layers. Default true. */
  aurora?: boolean;
  /** Render the fine visor noise/scanline texture. Default true. */
  noise?: boolean;
  /** Opacity of the noise layer when rendered. Default 0.45 (HelmetFrame's value). */
  noiseOpacity?: number;
}

/**
 * Shared visor chrome stack: vignette, peripheral blur, aurora, and visor
 * noise. Consolidates the layer stack that used to be duplicated across
 * HelmetFrame, LoadingScreen, and HudOverlay (RC-3).
 *
 * Call sites:
 * - HelmetFrame: full stack, noiseOpacity=0.45
 * - LoadingScreen: full stack, noiseOpacity=0.55
 * - HudOverlay: backdrop only -- vignette + blur, no aurora, no noise
 *
 * Always pointer-events-none; intended to sit beneath interactive HUD
 * elements in the stacking order.
 */
export function VisorChrome({ aurora = true, noise = true, noiseOpacity = 0.45 }: VisorChromeProps) {
  return (
    <>
      <div className="helmet-vignette pointer-events-none absolute inset-0" />
      <div className="helmet-peripheral-blur pointer-events-none absolute inset-0" />
      {aurora ? (
        <div className="helmet-aurora pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="helmet-aurora-layer helmet-aurora-layer-top absolute inset-0" />
          <div className="helmet-aurora-layer helmet-aurora-layer-right absolute inset-0" />
          <div className="helmet-aurora-layer helmet-aurora-layer-bottom absolute inset-0" />
          <div className="helmet-aurora-layer helmet-aurora-layer-left absolute inset-0" />
        </div>
      ) : null}
      {noise ? (
        <div
          className="helmet-visor-noise pointer-events-none absolute inset-0"
          style={{ opacity: noiseOpacity }}
        />
      ) : null}
    </>
  );
}
