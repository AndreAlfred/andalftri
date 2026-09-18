import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  root: ".",
  publicDir: "client/public",
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: "dist",
    // The scene is already a dynamic import. Let Rollup keep its complete
    // dependency graph behind that boundary; package-by-package manual chunks
    // pulled Vite's preload helper into vendor-scene and made the initial entry
    // import the entire 3D stack before React.lazy could do its job.
    chunkSizeWarningLimit: 1_500,
  },
});
