import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base: the same build works at a GitHub Pages subpath and from file://
  base: "./",
  plugins: [vue()],
  server: { port: 5182 },
});
