<script lang="ts">
  import { config } from "./lib/config";
  import { createEffectStartedResource } from "./lib/resource";
  import { stats } from "./lib/stats";

  const secondary = createEffectStartedResource();

  stats.panelRenders += 1;

  $effect(() => {
    stats.panelCommits += 1;
    secondary.start();
  });

  // Same per-leaf cost as the React apps, so the comparison is one workload.
  function leafValue(index: number): number {
    let sum = index;
    for (let i = 0; i < config.work; i += 1) sum = (sum + i * 7) % 9973;
    return sum % 10;
  }
  const leaves = Array.from({ length: config.nodes }, (_, index) => leafValue(index));
</script>

<div style="font:12px/1.6 ui-monospace,monospace;word-break:break-all;opacity:.5">
  <strong style="display:block;font:600 14px/2 system-ui,sans-serif;opacity:1">
    Panel mounted.
  </strong>
  {#each leaves as leaf, index (index)}<span>{leaf}</span>{/each}
</div>
