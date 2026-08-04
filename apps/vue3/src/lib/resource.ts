import { stats } from "./stats";

type State =
  | { status: "idle" }
  | { status: "pending"; promise: Promise<void> }
  | { status: "resolved" };

/**
 * A minimal stand-in for a suspense-capable data hook.
 *
 * `read()` starts the request during render and throws the promise, which is
 * what React Query's suspense path does (`observer.fetchOptimistic(...)`), and
 * it is why the *first* request in a stalled app is visible in the network tab
 * even though everything after it is missing.
 */
function createRenderStartedResource(delayMs: number) {
  let state: State = { status: "idle" };
  /** Awaitable form, for renderers whose async boundary awaits a promise. */
  function readAsync(): Promise<void> {
    if (state.status === "resolved") return Promise.resolve();
    if (state.status === "idle") {
      stats.renderPhaseRequestStartedAt = Math.round(performance.now());
      const promise = new Promise<void>((resolve) => {
        window.setTimeout(() => {
          state = { status: "resolved" };
          stats.renderPhaseRequestResolvedAt = Math.round(performance.now());
          resolve();
        }, delayMs);
      });
      state = { status: "pending", promise };
      return promise;
    }
    return state.promise;
  }
  function read(): void {
    if (state.status === "resolved") return;
    if (state.status === "idle") {
      stats.renderPhaseRequestStartedAt = Math.round(performance.now());
      const promise = new Promise<void>((resolve) => {
        window.setTimeout(() => {
          state = { status: "resolved" };
          stats.renderPhaseRequestResolvedAt = Math.round(performance.now());
          resolve();
        }, delayMs);
      });
      state = { status: "pending", promise };
    }
    throw state.promise;
  }
  return { read, readAsync };
}

/**
 * A stand-in for everything that only starts once a component is *mounted* —
 * React Query subscribes its observer in a commit effect, so a query whose
 * component never commits never issues a request at all. This is the counter
 * that stays at zero in the stalled case, which is what makes the bug so hard
 * to read: the UI is stuck on a spinner with an idle network tab.
 */
function createEffectStartedResource() {
  let started = false;
  function start(): void {
    if (started) return;
    started = true;
    stats.effectPhaseRequestStartedAt = Math.round(performance.now());
  }
  return { start };
}

export { createEffectStartedResource, createRenderStartedResource };
