import { useEffect, useReducer } from "react";

import { stats } from "./stats";

/**
 * A controller that wants to re-render its consumer whenever the element it
 * tracks changes, so it can position itself from the measured rect. This is a
 * de-identified copy of a real hook that shipped in production.
 *
 * The defect: it decides "the element changed" by comparing the value the ref
 * was called with, and it answers by forcing a render. A ref re-attach calls it
 * twice — once with `null`, once with the very same node — and both legs miss
 * the identity guard, so every commit schedules another render, which produces
 * another commit. `requestAnimationFrame` does not break that loop; it only
 * paces it at one render per frame, which is exactly why it looks harmless.
 */
function createDraggableController({ coalesce }: { coalesce: boolean }) {
  const elState = { target: null as Element | null };
  let notify: (() => void) | null = null;
  let rafId = 0;
  let notifiedTarget: Element | null = null;

  function scheduleNotify() {
    stats.scheduleNotifyCalls += 1;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      stats.rafFired += 1;
      if (coalesce) {
        // THE FIX. A re-attach detaches and re-attaches within one frame, so by
        // the time this callback runs the target is back to what we last
        // notified about. Only a real change gets through.
        if (elState.target === notifiedTarget) return;
        notifiedTarget = elState.target;
      }
      if (notify) stats.notifyCalls += 1;
      notify?.();
    });
  }

  function targetRef(target: Element | null) {
    if (target === null) stats.refCallsNull += 1;
    else stats.refCallsNode += 1;
    if (elState.target === target) return;
    elState.target = target;
    scheduleNotify();
  }

  function useController() {
    const [, forceRender] = useReducer((count: number) => count + 1, 0);
    useEffect(function subscribe() {
      notify = forceRender;
      // The ignition, copied from the original: the ref was attached before this
      // effect ran, so the mount render never saw the element. One catch-up
      // render fixes that — and hands the loop its first turn.
      if (elState.target !== null) forceRender();
      return () => {
        notify = null;
      };
    }, []);
    useEffect(function countCommit() {
      stats.loopCommits += 1;
    });
    const rect = elState.target?.getBoundingClientRect();
    return {
      targetRef,
      // Reading the measured rect is why the hook wants a render at all.
      width: rect ? Math.round(rect.width) : 0,
    };
  }

  return { useController };
}

export { createDraggableController };
