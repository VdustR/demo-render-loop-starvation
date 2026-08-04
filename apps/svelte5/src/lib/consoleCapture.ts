/**
 * Counts everything the framework says while the page runs.
 *
 * Several renderers ship a circuit breaker for runaway updates — Vue's
 * "Maximum recursive updates exceeded", Svelte's "effect_update_depth_exceeded",
 * React's "Too many re-renders", Angular's
 * "ExpressionChangedAfterItHasBeenChecked". This panel exists to check whether
 * any of them fires for a loop that is paced by `requestAnimationFrame`, i.e.
 * one legitimate-looking update per frame rather than synchronous recursion.
 */
const captured = { warns: 0, errors: 0, last: "" };

function installConsoleCapture(): void {
  for (const level of ["warn", "error"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: Array<unknown>) => {
      if (level === "warn") captured.warns += 1;
      else captured.errors += 1;
      captured.last = args
        .map((arg) => (typeof arg === "string" ? arg : String(arg)))
        .join(" ")
        .slice(0, 120);
      original(...args);
    };
  }
}

export { captured, installConsoleCapture };
