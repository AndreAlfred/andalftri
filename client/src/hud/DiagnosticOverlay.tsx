import { useState } from "react";
import { diagnosticsReport, useDiagnosticsStore } from "@/hooks/useDiagnostics";
import {
  CONDITIONS,
  rankingMetric,
  SIGNIFICANT_RECOVERY_PCT,
  verdict,
} from "@/lib/diagnostics";

/**
 * `?diag=1` readout (2026-08-01). Deliberately plain HTML with inline styles —
 * it must not inherit any of the helmet styling, because several of the layers
 * it is measuring ARE the helmet styling.
 */
export function DiagnosticOverlay() {
  const active = useDiagnosticsStore((state) => state.active);
  const progress = useDiagnosticsStore((state) => state.progress);
  const results = useDiagnosticsStore((state) => state.results);
  const [copied, setCopied] = useState(false);

  const label = CONDITIONS.find((c) => c.id === active)?.label ?? "starting…";
  // The displayed saving must be the metric the table was sorted on, or the
  // column reads "+0%" beside a correctly-ordered ranking.
  const metric = results ? rankingMetric(results) : null;

  const copy = async () => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(diagnosticsReport(results));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: "auto 0 0 0",
        zIndex: 9999,
        background: "rgba(6, 10, 14, 0.94)",
        color: "#dfe9f5",
        font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        padding: "12px 14px calc(12px + env(safe-area-inset-bottom))",
        maxHeight: "62vh",
        overflowY: "auto",
        borderTop: "1px solid rgba(120, 190, 255, 0.35)",
      }}
    >
      {!results ? (
        <>
          <div style={{ color: "#7fd0ff", letterSpacing: "0.08em" }}>
            MEASURING — {Math.round(progress * 100)}%
          </div>
          <div style={{ marginTop: 4 }}>{label}</div>
          <div
            style={{
              marginTop: 8,
              height: 3,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "#7fd0ff",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ marginTop: 8, opacity: 0.6 }}>
            Hold still and leave the screen on. Conditions are interleaved, so
            thermal drift spreads evenly instead of landing on one of them.
          </div>
        </>
      ) : (
        <>
          <div style={{ color: "#7fd0ff", letterSpacing: "0.08em" }}>RESULT</div>
          <div style={{ margin: "6px 0 10px", color: "#fff" }}>{verdict(results)}</div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ opacity: 0.55, textAlign: "left" }}>
                <th style={{ fontWeight: 400 }}>condition</th>
                <th style={{ fontWeight: 400, textAlign: "right" }}>ms</th>
                <th style={{ fontWeight: 400, textAlign: "right" }}>p95</th>
                <th style={{ fontWeight: 400, textAlign: "right" }}>fps</th>
                <th style={{ fontWeight: 400, textAlign: "right" }}>{metric?.label ?? "saved"}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const significant =
                  r.id !== "baseline" &&
                  metric !== null &&
                  r[metric.key] >= SIGNIFICANT_RECOVERY_PCT;
                return (
                  <tr
                    key={r.id}
                    style={{
                      color: significant ? "#8dffc4" : undefined,
                      opacity: r.id === "baseline" ? 0.75 : 1,
                    }}
                  >
                    <td>{r.label}</td>
                    <td style={{ textAlign: "right" }}>{r.medianMs.toFixed(1)}</td>
                    <td style={{ textAlign: "right" }}>{r.p95Ms.toFixed(1)}</td>
                    <td style={{ textAlign: "right" }}>{r.fps.toFixed(0)}</td>
                    <td style={{ textAlign: "right" }}>
                      {r.id === "baseline" || metric === null
                        ? "—"
                        : `${r[metric.key].toFixed(0)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            onClick={copy}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px",
              background: copied ? "#1d5c3f" : "rgba(127, 208, 255, 0.16)",
              color: "#dfe9f5",
              border: "1px solid rgba(127, 208, 255, 0.4)",
              borderRadius: 6,
              font: "inherit",
            }}
          >
            {copied ? "copied — paste it to Claude" : "copy results"}
          </button>
        </>
      )}
    </div>
  );
}
