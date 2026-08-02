#!/usr/bin/env node
/**
 * Build the Tauri SPA frontend into dist/ and rename the HTML entry to index.html.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

console.log("[build:tauri] vite build -c vite.tauri.config.ts");
const r = spawnSync("npx", ["vite", "build", "-c", "vite.tauri.config.ts"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});
if (r.status !== 0) process.exit(r.status ?? 1);

const tauriHtml = join(dist, "tauri.html");
const indexHtml = join(dist, "index.html");
if (existsSync(tauriHtml)) {
  if (existsSync(indexHtml)) rmSync(indexHtml);
  renameSync(tauriHtml, indexHtml);
  console.log("[build:tauri] renamed tauri.html → index.html");
}

// Sanity: public sample data present
const sample = join(dist, "sample-okf-bundle.json");
if (!existsSync(sample)) {
  console.warn("[build:tauri] warning: sample-okf-bundle.json missing from dist");
}

console.log("[build:tauri] dist contents:", readdirSync(dist).join(", "));
console.log("[build:tauri] done");
