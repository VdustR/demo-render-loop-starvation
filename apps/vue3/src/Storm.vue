<script setup lang="ts">
import { onMounted, onUpdated, onUnmounted, ref } from "vue";

import { stats } from "./lib/stats";

/**
 * The same permanent update stream as the React demo: one reactive write per
 * animation frame, forever.
 */
const frame = ref(0);
let id = 0;
onMounted(() => {
  const step = () => {
    frame.value += 1;
    id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  stats.loopCommits += 1;
});
onUpdated(() => {
  stats.loopCommits += 1;
});
onUnmounted(() => cancelAnimationFrame(id));
</script>

<template>
  <div
    style="
      position: fixed;
      right: 24px;
      bottom: 24px;
      padding: 12px 16px;
      border-radius: 999px;
      background: #41b883;
      color: #fff;
      font: 600 13px/1 system-ui, sans-serif;
    "
  >
    raf storm (frame {{ frame }})
  </div>
</template>
