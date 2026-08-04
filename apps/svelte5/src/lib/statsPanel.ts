import { config } from "./config";
import { captured, installConsoleCapture } from "./consoleCapture";
import { stats } from "./stats";

const SAMPLE_MS = 500;

/**
 * Rendered with plain DOM, outside React, on purpose.
 *
 * An earlier version of this panel was a React component that re-rendered twice
 * a second, and that alone was enough to starve a heavy retry render — which is
 * a neat demonstration of the bug, but a terrible measuring instrument. The
 * instrument must not be a second source of updates.
 */
function mountStatsPanel(container: HTMLElement): void {
  installConsoleCapture();
  // Exposed so the page can be measured from a devtools console or an automated
  // browser session without scraping the DOM.
  (window as unknown as { __stats: typeof stats }).__stats = stats;
  let previousAt = performance.now();
  let previousCommits = 0;

  function row(label: string, value: string): string {
    return `<div style="display:flex;gap:8px"><span style="min-width:210px;opacity:.65">${label}</span><span>${value}</span></div>`;
  }

  function paint(): void {
    const now = performance.now();
    const elapsedSeconds = (now - previousAt) / 1000;
    const perSecond =
      elapsedSeconds > 0 ? Math.round((stats.loopCommits - previousCommits) / elapsedSeconds) : 0;
    previousAt = now;
    previousCommits = stats.loopCommits;

    const dataArrived = stats.renderPhaseRequestResolvedAt !== null;
    const stalled = dataArrived && stats.panelCommits === 0;
    const healthy = stats.panelCommits > 0;

    container.style.border = `2px solid ${stalled ? "#d4380d" : healthy ? "#389e0d" : "#d9d9d9"}`;
    container.style.background = stalled ? "#fff1f0" : healthy ? "#f6ffed" : "#fafafa";
    container.innerHTML = [
      `<div style="font:700 15px/1.6 system-ui,sans-serif;margin-bottom:8px">${
        stalled
          ? "DEADLOCKED — data arrived, subtree never committed, follow-up request never sent"
          : healthy
            ? "Healthy — subtree committed"
            : "Loading…"
      }</div>`,
      '<div style="font:13px/1.9 ui-monospace,monospace">',
      row("loop commits/sec", String(perSecond)),
      row("loop commits total", String(stats.loopCommits)),
      row("panel render attempts", String(stats.panelRenders)),
      row("panel commits", String(stats.panelCommits)),
      row(
        "request started in render",
        stats.renderPhaseRequestStartedAt === null
          ? "—"
          : `${stats.renderPhaseRequestStartedAt}ms → resolved ${
              stats.renderPhaseRequestResolvedAt ?? "pending"
            }ms`,
      ),
      row(
        "request started in effect",
        stats.effectPhaseRequestStartedAt === null
          ? "<strong>NEVER ISSUED</strong>"
          : `${stats.effectPhaseRequestStartedAt}ms`,
      ),
      row(
        "framework warnings / errors",
        `${captured.warns} / ${captured.errors}${captured.last ? ` — ${captured.last}` : ""}`,
      ),
      row("elapsed", `${Math.round(now / 1000)}s`),
      "</div>",
      `<div style="font:13px/1.9 ui-monospace,monospace;margin-top:8px;opacity:.65">storm=${
        config.storm ? "on" : "off"
      } nodes=${config.nodes} work=${config.work}</div>`,
    ].join("");
  }

  paint();
  window.setInterval(paint, SAMPLE_MS);
}

export { mountStatsPanel };
