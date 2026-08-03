import { create } from "zustand";
import {
  rankingMetric,
  summarize,
  type ConditionId,
  type ConditionResult,
} from "@/lib/diagnostics";

/**
 * Sweep state for `?diag=1` (2026-08-01).
 *
 * Samples are pushed from `useFrame`, i.e. up to 60 times a second. They are
 * therefore held in a plain Map OUTSIDE the store and never set through it —
 * writing per-frame into zustand would notify every subscriber on every frame
 * and the measurement overlay would become a meaningful part of what is being
 * measured. Only slot transitions and the final fold touch reactive state.
 */
const samples = new Map<ConditionId, number[]>();

interface DiagnosticsState {
  active: ConditionId | null;
  progress: number;
  results: ConditionResult[] | null;
  setActive: (id: ConditionId) => void;
  setProgress: (progress: number) => void;
  record: (id: ConditionId, frameMs: number) => void;
  finish: () => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>((set) => ({
  active: null,
  progress: 0,
  results: null,
  setActive: (id) => set((state) => (state.active === id ? state : { ...state, active: id })),
  setProgress: (progress) => set({ progress }),
  // Deliberately not a `set` call — see the note above.
  record: (id, frameMs) => {
    const list = samples.get(id);
    if (list) list.push(frameMs);
    else samples.set(id, [frameMs]);
  },
  finish: () => set({ results: summarize(samples), active: null, progress: 1 }),
}));

export function diagnosticsReport(results: readonly ConditionResult[]): string {
  // Print the metric the table was actually SORTED on. Printing the median
  // recovery beside a tail-ranked order showed "+0%" against every row.
  const metric = rankingMetric(results);
  const nav = typeof navigator === "undefined" ? null : navigator;
  const lines = [
    "medallion frame-time ablation",
    `ua: ${nav?.userAgent ?? "?"}`,
    `screen: ${typeof screen === "undefined" ? "?" : `${screen.width}x${screen.height}`} dpr:${
      typeof window === "undefined" ? "?" : window.devicePixelRatio
    }`,
    `tier: ${typeof document === "undefined" ? "?" : document.documentElement.dataset.quality}`,
    "",
    `condition            median   p95    fps   ${metric.label}`,
  ];
  for (const r of results) {
    lines.push(
      `${r.label.padEnd(20)} ${r.medianMs.toFixed(1).padStart(6)} ${r.p95Ms
        .toFixed(1)
        .padStart(6)} ${r.fps.toFixed(0).padStart(6)} ${
        r.id === "baseline"
          ? "     —"
          : `${r[metric.key] >= 0 ? "+" : ""}${r[metric.key].toFixed(0)}%`.padStart(6)
      }`,
    );
  }
  return lines.join("\n");
}
