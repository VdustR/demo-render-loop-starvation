const params = new URLSearchParams(window.location.search);

function flag(name: string, fallback: boolean): boolean {
  const value = params.get(name);
  if (value === null) return fallback;
  return value === "on" || value === "1" || value === "true";
}

/**
 * Reload-based config, on purpose: the deadlock can only be observed on a load
 * where the boundary suspends *before* its first commit, so every combination
 * has to be entered through a fresh document.
 */
const config = {
  /** Mount the component that holds the ref/rAF feedback loop. */
  storm: flag("storm", true),
  /** Apply the one-line coalescing guard that breaks the loop. */
  fix: flag("fix", false),
  /**
   * Where the update stream comes from. `ref` is the real bug (a ref re-attach
   * answered with a render); `raf` is a plain state update per frame, to show
   * that the source does not matter.
   */
  stormKind: params.get("stormKind") === "raf" ? "raf" : "ref",
  /**
   * How many leaf nodes the suspended subtree renders, and how much work each
   * one does. The deadlock needs a single retry render to outlast the gap
   * between the loop's updates (~16.7ms), so what matters is nodes x work, not
   * DOM size. These defaults clear that bar in a production build with a light
   * DOM; a development build is far slower per component and needs much less.
   */
  nodes: Number(params.get("nodes") ?? 4000),
  /** Arithmetic iterations per leaf, standing in for ordinary component work. */
  work: Number(params.get("work") ?? 4000),
};

export { config };
