<script lang="ts">
  import Panel from "./Panel.svelte";
  import Storm from "./Storm.svelte";
  import { config } from "./lib/config";
  import { createRenderStartedResource } from "./lib/resource";

  const primary = createRenderStartedResource(300);
  // `{#await}` is Svelte's async gate: the screen cannot paint before the data
  // is there, same contract as React's Suspense and Vue's async setup.
  const ready = primary.readAsync();
</script>

<div style="max-width:900px;margin:0 auto;padding:24px">
  <h1 style="font:700 20px/1.4 system-ui,sans-serif">Svelte 5: same update stream</h1>
  <p style="font:14px/1.7 system-ui,sans-serif;max-width:680px">
    One reactive write per animation frame, and a screen gated on data through <code
      >{"{#await}"}</code
    >.
  </p>
  <div style="display:flex;gap:8px;margin-bottom:16px">
    {#each [true, false] as option (option)}
      <a
        href={`?storm=${option ? "on" : "off"}&nodes=${config.nodes}`}
        style="font:13px/1.4 system-ui,sans-serif;padding:8px 12px;border-radius:6px;border:1px solid #d9d9d9;text-decoration:none;background:{option ===
        config.storm
          ? '#ff3e00'
          : '#fff'};color:{option === config.storm ? '#fff' : '#000'}"
      >
        {option ? "storm on" : "storm off"}
      </a>
    {/each}
  </div>
  {#await ready}
    <div
      style="padding:24px;border:1px dashed #d9d9d9;border-radius:8px;font:14px/1.6 system-ui,sans-serif"
    >
      Loading the panel… (this is the await fallback)
    </div>
  {:then}
    <Panel />
  {/await}
  {#if config.storm}<Storm />{/if}
</div>
