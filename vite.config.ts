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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          const match = id.match(
            /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
          );
          const packageName = match?.[1];

          if (!packageName) {
            return "vendor";
          }

          if (packageName === "three") {
            return "vendor-three";
          }

          if (
            [
              "@react-three/fiber",
              "@react-three/drei",
              "three-stdlib",
              "troika-three-text",
              "troika-three-utils",
              "troika-worker-utils",
              "webgl-sdf-generator",
              "bidi-js",
              "suspend-react",
              "tunnel-rat",
            ].includes(packageName)
          ) {
            return "vendor-scene";
          }

          if (packageName === "react" || packageName === "scheduler") {
            return "vendor-react";
          }

          if (packageName === "react-dom") {
            return "vendor-react-dom";
          }

          if (packageName === "zustand" || packageName === "use-sync-external-store") {
            return "vendor-state";
          }

          if (packageName === "detect-gpu") {
            return "vendor-device";
          }

          return undefined;
        },
      },
    },
  },
});
