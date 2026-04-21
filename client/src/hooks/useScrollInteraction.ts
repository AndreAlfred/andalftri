import { useEffect } from "react";
import { create } from "zustand";
import type { PageConfig } from "@/data/sceneConfig";

const LIGHT_SCROLL_THRESHOLD = 100;
const COMMIT_SCROLL_THRESHOLD = 300;
const COMMIT_PAUSE_MS = 220;

interface ScrollInteractionState {
  phaseNudge: number;
  speedBoost: number;
  cameraTilt: number;
  setFeedback: (next: Partial<Pick<ScrollInteractionState, "phaseNudge" | "speedBoost" | "cameraTilt">>) => void;
}

export const useScrollInteractionStore = create<ScrollInteractionState>((set) => ({
  phaseNudge: 0,
  speedBoost: 0,
  cameraTilt: 0,
  setFeedback: (next) => set(next),
}));

interface UseScrollInteractionOptions {
  enabled: boolean;
  pages: PageConfig[];
  onCommit: (page: PageConfig) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function findNearestPageInDirection(pages: PageConfig[], direction: 1 | -1) {
  const candidates = pages.filter((page) => {
    const axis = page.cameraLookAt[1] || page.buttonOffset[1] || 0;
    return direction > 0 ? axis > 0 : axis < 0;
  });

  if (!candidates.length) return null;

  return candidates.sort((a, b) => {
    const aAxis = Math.abs(a.cameraLookAt[1] || a.buttonOffset[1] || 0);
    const bAxis = Math.abs(b.cameraLookAt[1] || b.buttonOffset[1] || 0);
    return aAxis - bAxis;
  })[0];
}

export function useScrollInteraction({ enabled, pages, onCommit }: UseScrollInteractionOptions) {
  useEffect(() => {
    let accumulated = 0;
    let lastDirection = 0;
    let lastTouchY: number | null = null;
    let commitTimer: number | null = null;
    let decayFrame = 0;

    const clearCommitTimer = () => {
      if (commitTimer !== null) {
        window.clearTimeout(commitTimer);
        commitTimer = null;
      }
    };

    const updateFeedback = (delta: number) => {
      const direction = delta === 0 ? 0 : (Math.sign(delta) as 1 | -1);

      if (direction && direction !== lastDirection) {
        accumulated = 0;
      }

      lastDirection = direction;
      accumulated += delta;

      const magnitude = Math.abs(accumulated);
      const nextPhaseNudge = clamp(accumulated / 220, -0.8, 0.8);
      const nextSpeedBoost = clamp(Math.abs(delta) / 900, 0, 0.24);
      const nextTilt =
        magnitude < LIGHT_SCROLL_THRESHOLD
          ? clamp(accumulated / COMMIT_SCROLL_THRESHOLD, -0.22, 0.22)
          : clamp(accumulated / COMMIT_SCROLL_THRESHOLD, -1, 1);

      useScrollInteractionStore.getState().setFeedback({
        phaseNudge: nextPhaseNudge,
        speedBoost: nextSpeedBoost,
        cameraTilt: nextTilt,
      });

      clearCommitTimer();

      if (magnitude >= COMMIT_SCROLL_THRESHOLD && direction) {
        commitTimer = window.setTimeout(() => {
          const targetPage = findNearestPageInDirection(pages, direction);
          useScrollInteractionStore.getState().setFeedback({ cameraTilt: 0 });
          accumulated = 0;
          if (targetPage) {
            onCommit(targetPage);
          }
        }, COMMIT_PAUSE_MS);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!enabled) return;
      event.preventDefault();
      updateFeedback(event.deltaY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!enabled) return;
      if (event.touches[0]) {
        lastTouchY = event.touches[0].clientY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!enabled || lastTouchY === null || !event.touches[0]) return;

      event.preventDefault();
      const currentY = event.touches[0].clientY;
      const delta = lastTouchY - currentY;
      lastTouchY = currentY;
      updateFeedback(delta * 1.15);
    };

    const handleTouchEnd = () => {
      lastTouchY = null;
    };

    const decayFeedback = () => {
      const { phaseNudge, speedBoost, cameraTilt, setFeedback } =
        useScrollInteractionStore.getState();

      setFeedback({
        phaseNudge: phaseNudge * 0.9,
        speedBoost: speedBoost * 0.84,
        cameraTilt: Math.abs(cameraTilt) < 0.01 ? 0 : cameraTilt * 0.9,
      });

      decayFrame = window.requestAnimationFrame(decayFeedback);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    decayFrame = window.requestAnimationFrame(decayFeedback);

    if (!enabled) {
      useScrollInteractionStore.getState().setFeedback({
        phaseNudge: 0,
        speedBoost: 0,
        cameraTilt: 0,
      });
    }

    return () => {
      clearCommitTimer();
      window.cancelAnimationFrame(decayFrame);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      useScrollInteractionStore.getState().setFeedback({
        phaseNudge: 0,
        speedBoost: 0,
        cameraTilt: 0,
      });
    };
  }, [enabled, onCommit, pages]);
}
