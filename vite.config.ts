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
  },
});
