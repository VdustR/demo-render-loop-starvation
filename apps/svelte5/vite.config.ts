import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base: the same build works at a GitHub Pages subpath and from file://
  base: "./",
  plugins: [svelte()],
  server: { port: 5183 },
});
