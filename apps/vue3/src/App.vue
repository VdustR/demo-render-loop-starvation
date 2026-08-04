<script setup lang="ts">
import Panel from "./Panel.vue";
import Storm from "./Storm.vue";
import { config } from "./lib/config";
</script>

<template>
  <div style="max-width: 900px; margin: 0 auto; padding: 24px">
    <h1 style="font: 700 20px/1.4 system-ui, sans-serif">Vue 3: same update stream</h1>
    <p style="font: 14px/1.7 system-ui, sans-serif; max-width: 680px">
      One reactive write per animation frame, and a screen that cannot paint before its data
      arrives (async <code>setup</code> under <code>&lt;Suspense&gt;</code>).
    </p>
    <div style="display: flex; gap: 8px; margin-bottom: 16px">
      <a
        v-for="option in [true, false]"
        :key="String(option)"
        :href="`?storm=${option ? 'on' : 'off'}&nodes=${config.nodes}`"
        :style="`font:13px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:6px;border:1px solid #d9d9d9;text-decoration:none;background:${
          option === config.storm ? '#41b883' : '#fff'
        };color:${option === config.storm ? '#fff' : '#000'}`"
      >
        {{ option ? "storm on" : "storm off" }}
      </a>
    </div>
    <Suspense>
      <Panel />
      <template #fallback>
        <div
          style="
            padding: 24px;
            border: 1px dashed #d9d9d9;
            border-radius: 8px;
            font: 14px/1.6 system-ui, sans-serif;
          "
        >
          Loading the panel… (this is the Suspense fallback)
        </div>
      </template>
    </Suspense>
    <Storm v-if="config.storm" />
  </div>
</template>
