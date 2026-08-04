import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base: the same build works at a GitHub Pages subpath and from file://
  base: "./",
  plugins: [react()],
  server: { port: 5180 },
});
