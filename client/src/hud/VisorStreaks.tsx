import { useEffect, useRef } from "react";
import { buildStreakPath, cubicAt, type Streak } from "@/hud/visorStreakPath";

/**
 * Filigree streaks on the visor glass (2026-07-21, Andrew's "magic space").
 *
 * This layer is screen-space on purpose, and it is the part of the hybrid that
 * earns its place twice over. Phase 9's rule is that every element must have a
 * reason to exist and a place to exist in: a streak rendered in 3D would be an
 * unexplained light in the void, but a streak rendered HERE — above the WebGL
 * canvas, inside the helmet frame, alongside the aurora and the chrome — reads
 * as light moving across the visor the visitor is looking through. The fiction
 * already accounts for it.
 *
 * It is also the layer that survives on a struggling machine. It never touches
 * the 3D budget, so it is first in the degradation order only because it is the
 * most motion-forward, not because it is expensive.
 *
 * COST: a 2D canvas at DPR 1 that draws nothing at all between streaks — the
 * loop early-outs when the streak list is empty, which is most of the time.
 */

const NEON = ["#4ef0ff", "#ff6ae4", "#8dffa8", "#ffd25e", "#b98cff"];
/** Seconds between spawn attempts. Sparse is the whole point. */
const SPAWN_MIN = 7;
const SPAWN_MAX = 19;
const DRAW_SEGMENTS = 48;

interface VisorStreaksProps {
  /** Concurrent streaks allowed. 0 disables the layer (low quality tier). */
  maxStreaks: number;
}

function spawnStreak(w: number, h: number): Streak {
  return {
    ...buildStreakPath(w, h),
    color: NEON[Math.floor(Math.random() * NEON.length)],
    width: 1.1 + Math.random() * 1.9,
    progress: 0,
    speed: 0.22 + Math.random() * 0.3,
    tail: 0.16 + Math.random() * 0.2,
  };
}

export function VisorStreaks({ maxStreaks }: VisorStreaksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read through a ref inside the loop so a tier change never restarts the
  // animation (which would kill any streak mid-flight).
  const maxRef = useRef(maxStreaks);
  maxRef.current = maxStreaks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // DPR 1 deliberately: this is a soft additive glow with no hard edges and
      // no text, so a retina buffer would quadruple the fill cost to render
      // detail that is blurred away by construction.
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const streaks: Streak[] = [];
    let untilSpawn = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    let last = performance.now();
    let raf = 0;
    let cleared = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      untilSpawn -= delta;
      if (untilSpawn <= 0) {
        untilSpawn = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
        if (streaks.length < maxRef.current) streaks.push(spawnStreak(width, height));
      }

      for (let i = streaks.length - 1; i >= 0; i -= 1) {
        streaks[i].progress += streaks[i].speed * delta;
        if (streaks[i].progress > 1 + streaks[i].tail) streaks.splice(i, 1);
      }

      if (streaks.length === 0) {
        // Idle: clear once, then stop touching the canvas entirely. This is
        // where the layer spends most of its life.
        if (!cleared) {
          ctx.clearRect(0, 0, width, height);
          cleared = true;
        }
        return;
      }
      cleared = false;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (const streak of streaks) {
        const head = streak.progress;
        for (let seg = 0; seg < DRAW_SEGMENTS; seg += 1) {
          const t0 = head - streak.tail * (seg / DRAW_SEGMENTS);
          const t1 = head - streak.tail * ((seg + 1) / DRAW_SEGMENTS);
          if (t1 > 1 || t0 < 0) continue;
          const fade = 1 - seg / DRAW_SEGMENTS;
          // Squared falloff concentrates the light at the head, so the streak
          // has a direction instead of reading as a static drawn line.
          const alpha = fade * fade * 0.85;
          const [x0, y0] = cubicAt(streak, Math.min(t0, 1));
          const [x1, y1] = cubicAt(streak, Math.min(t1, 1));
          ctx.strokeStyle = streak.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = streak.width * (0.35 + fade * 0.65);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        if (head <= 1) {
          const [hx, hy] = cubicAt(streak, head);
          const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, streak.width * 9);
          glow.addColorStop(0, streak.color);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(hx, hy, streak.width * 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // The canvas always mounts, even at `maxStreaks === 0`. Unmounting it would
  // mean the effect never runs, so a machine that recovered and climbed back to
  // a higher tier would silently never get its streaks back. An idle canvas
  // that nothing draws to costs nothing.
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
