#!/usr/bin/env node
/**
 * `tauri dev` with a dynamic devUrl.
 *
 * tauri.conf.json's `build.devUrl` is static JSON, but the dev-server port is
 * resolved at runtime (see scripts/dev-port.mjs) because several Tauri projects
 * share this machine. The Tauri CLI's `--config` flag merges a JSON patch over
 * the config file, which is the supported way to override it per-invocation.
 *
 * OKF_DEV_PORT is exported so the Vite server started by `beforeDevCommand`
 * binds exactly the port the webview is pointed at, rather than re-resolving.
 *
 * Any extra args are forwarded: `npm run tauri:dev -- --features automation`.
 */
import { spawn } from "node:child_process";
import { resolveDevPort } from "./dev-port.mjs";

const port = await resolveDevPort();
const devUrl = `http://127.0.0.1:${port}`;
const patch = JSON.stringify({ build: { devUrl } });

console.log(`[tauri-dev] devUrl ${devUrl}`);

const child = spawn(
  "npx",
  ["tauri", "dev", "--config", patch, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, OKF_DEV_PORT: String(port) },
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
