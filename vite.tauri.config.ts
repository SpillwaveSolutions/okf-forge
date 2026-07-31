/**
 * SPA build for Tauri desktop (no SSR / Nitro).
 * Output: /workspace/dist — referenced by src-tauri/tauri.conf.json frontendDist.
 */
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  root: __dirname,
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: resolve(__dirname, "tauri.html"),
    },
  },
  // Ensure assets resolve from / in the webview
  base: "./",
});
