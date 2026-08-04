import { useEffect, useReducer } from "react";

import { stats } from "../lib/stats";

/**
 * The same permanent update stream, with no refs involved at all: a plain state
 * update once per animation frame.
 *
 * This is the control that shows the ref/rAF feedback loop is only *how* our
 * stream came to exist. Any unstoppable ~60Hz update at default priority does
 * the same thing to a suspended boundary.
 */
const RafStorm: React.FC = () => {
  const [frame, tick] = useReducer((count: number) => count + 1, 0);
  useEffect(function loop() {
    let id = 0;
    const step = () => {
      tick();
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(function countCommit() {
    stats.loopCommits += 1;
  });
  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        padding: "12px 16px",
        borderRadius: 999,
        background: "#722ed1",
        color: "#fff",
        font: "600 13px/1 system-ui, sans-serif",
      }}
    >
      raf storm (frame {frame})
    </div>
  );
};

export { RafStorm };
