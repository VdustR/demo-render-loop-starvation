import { useEffect, useMemo, useRef } from "react";

import { config } from "../lib/config";
import { createEffectStartedResource, createRenderStartedResource } from "../lib/resource";
import { stats } from "../lib/stats";

const primary = createRenderStartedResource(300);
const secondary = createEffectStartedResource();

/**
 * A leaf that costs what a real component costs: a couple of hooks and a small
 * amount of work per render. Piling up bare `<span>`s would need an absurd DOM
 * to outlast a frame; a few thousand of these is an ordinary screen.
 */
const Leaf: React.FC<{ index: number; work: number }> = ({ index, work }) => {
  const seen = useRef(0);
  seen.current += 1;
  const value = useMemo(() => {
    let sum = index;
    for (let i = 0; i < work; i += 1) sum = (sum + i * 7) % 9973;
    return sum % 10;
  }, [index, work]);
  return <span>{value}</span>;
};

/**
 * The feature. It suspends on its first render, so its boundary shows a
 * fallback and has never committed content. Once the promise resolves React
 * schedules a *retry* render — the lowest priority React has, and one it
 * deliberately never expires. If a higher-priority update keeps arriving before
 * this render can finish, it restarts from the root every time and the subtree
 * never commits.
 *
 * The subtree is intentionally large enough that one render takes longer than
 * React's ~5ms yield budget. That is not a trick to force the bug: any real
 * screen with a header, a list, a form and a few hundred nodes is well past it.
 */
const Panel: React.FC = () => {
  stats.panelRenders += 1;
  primary.read();
  useEffect(function onMount() {
    stats.panelCommits += 1;
    secondary.start();
  }, []);
  return (
    <div style={{ font: "12px/1.6 ui-monospace, monospace", wordBreak: "break-all", opacity: 0.5 }}>
      <strong style={{ display: "block", font: "600 14px/2 system-ui, sans-serif", opacity: 1 }}>
        Panel mounted.
      </strong>
      {Array.from({ length: config.nodes }, (_, index) => (
        <Leaf key={index} index={index} work={config.work} />
      ))}
    </div>
  );
};

export { Panel };
