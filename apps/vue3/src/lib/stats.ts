/**
 * Plain mutable counters. Deliberately not React state: anything that re-renders
 * on every event would become a second starvation source and pollute the
 * measurement. The UI samples these twice a second instead.
 */
const stats = {
  /** `targetRef` invocations, split by the value React passed. */
  refCallsNull: 0,
  refCallsNode: 0,
  /** rAF scheduling and notify bookkeeping, for debugging the loop itself. */
  scheduleNotifyCalls: 0,
  rafFired: 0,
  notifyCalls: 0,
  /** Commits of the component that owns the loop (one effect run per commit). */
  loopCommits: 0,
  /** Render attempts of the suspended subtree. */
  panelRenders: 0,
  /** Commits of the suspended subtree. Stays 0 while starved. */
  panelCommits: 0,
  /** "Request" started during render, the way a suspense query starts one. */
  renderPhaseRequestStartedAt: null as number | null,
  renderPhaseRequestResolvedAt: null as number | null,
  /** "Request" that a mounted effect would start. Never starts while starved. */
  effectPhaseRequestStartedAt: null as number | null,
};

export { stats };
