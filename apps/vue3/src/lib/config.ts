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
  /**
   * How many leaf nodes the suspended subtree renders. The deadlock needs one
   * retry render to outlast the gap between the loop's updates (~16.7ms); 8000
   * is comfortably past that on a 2024 laptop without making the whole page so
   * heavy that the loop starves itself too.
   */
  nodes: Number(params.get("nodes") ?? 4000),
  /** Arithmetic iterations per leaf, matched to the React apps. */
  work: Number(params.get("work") ?? 4000),
};

export { config };
