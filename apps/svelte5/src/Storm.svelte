<script lang="ts">
  import { stats } from "./lib/stats";

  /**
   * The same permanent update stream as the React and Vue demos: one reactive
   * write per animation frame, forever.
   */
  let frame = $state(0);

  $effect(() => {
    let id = requestAnimationFrame(function step() {
      frame += 1;
      id = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(id);
  });

  $effect(() => {
    frame;
    stats.loopCommits += 1;
  });
</script>

<div
  style="position:fixed;right:24px;bottom:24px;padding:12px 16px;border-radius:999px;background:#ff3e00;color:#fff;font:600 13px/1 system-ui,sans-serif"
>
  raf storm (frame {frame})
</div>
