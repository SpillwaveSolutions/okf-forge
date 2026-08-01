/**
 * Single source of truth for the dev-server port.
 *
 * Several Tauri projects are developed side by side on one machine (often by
 * several agents at once), and every Vite template ships the same hardcoded
 * port. When two of them collide the failure is nasty rather than loud: Vite
 * with `strictPort` refuses to boot, and Playwright's `reuseExistingServer`
 * silently points the whole e2e suite at the *other* project's app, which then
 * fails with assertions that look like application bugs.
 *
 * So: pick a port that is actually free, remember it in `.dev-port`
 * (gitignored, machine-local), and have every consumer read it from here —
 * vite.config.ts, playwright.config.ts, the Tauri devUrl, and the smoke
 * scripts.
 *
 * Resolution order:
 *   1. OKF_DEV_PORT env var, if set. An explicit override always wins.
 *   2. The port in `.dev-port`, if it is free or already serving THIS app.
 *   3. The first free port at or above BASE_PORT, which is then persisted.
 *
 * Step 2's "already serving this app" case is what makes re-running `npm run
 * dev` and `npm run test:e2e` land on the same server instead of drifting to a
 * new port every time.
 *
 * CLI: `node scripts/dev-port.mjs`         -> prints the resolved port
 *      `node scripts/dev-port.mjs --url`   -> prints http://127.0.0.1:<port>
 *      `node scripts/dev-port.mjs --peek`  -> prints the remembered port
 *                                             without allocating a new one
 */
import { createServer } from "node:net";
import { execFileSync } from "node:child_process";
import { get } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT_FILE = join(ROOT, ".dev-port");

export const BASE_PORT = 8080;
const MAX_PORT = BASE_PORT + 100;

/** Marker proving a responding server is ours and not a sibling project's. */
const APP_MARKER = "OKFForge";

function isFree(port) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    // 0.0.0.0 because that is what the dev server binds; checking only
    // 127.0.0.1 would miss a server bound to all interfaces.
    srv.listen(port, "0.0.0.0", () => srv.close(() => resolve(true)));
  });
}

function servesThisApp(port) {
  return new Promise((resolve) => {
    // Settle exactly once. A socket held open by a process that never answers
    // (a bare TCP listener, another project's server mid-boot) emits neither
    // `end` nor `error` on destroy, so without this guard and the timer the
    // promise hangs and takes the whole resolution with it.
    let done = false;
    const settle = (v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      req.destroy();
      resolve(v);
    };
    const timer = setTimeout(() => settle(false), 1500);

    const req = get({ host: "127.0.0.1", port, path: "/" }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => {
        body += c;
        if (body.length > 65536) settle(body.includes(APP_MARKER));
      });
      res.on("end", () => settle(body.includes(APP_MARKER)));
      res.on("error", () => settle(false));
    });
    req.on("error", () => settle(false));
  });
}

function remembered() {
  if (!existsSync(PORT_FILE)) return null;
  const n = Number.parseInt(readFileSync(PORT_FILE, "utf8").trim(), 10);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : null;
}

function remember(port) {
  writeFileSync(PORT_FILE, `${port}\n`);
  return port;
}

/**
 * Resolve the port to use. Writes `.dev-port` when it allocates a new one.
 */
export async function resolveDevPort() {
  const env = Number.parseInt(process.env.OKF_DEV_PORT ?? "", 10);
  if (Number.isInteger(env) && env > 0) return env;

  const prev = remembered();
  if (prev !== null) {
    if (await isFree(prev)) return prev;
    // Occupied — but if it is our own dev server, keep using it.
    if (await servesThisApp(prev)) return prev;
  }

  for (let p = BASE_PORT; p < MAX_PORT; p++) {
    if (p === prev) continue; // already known bad
    if (await isFree(p)) {
      if (prev !== null) {
        console.error(`[dev-port] ${prev} is taken by another process; using ${p} instead.`);
      }
      return remember(p);
    }
  }
  throw new Error(`No free port in ${BASE_PORT}-${MAX_PORT}`);
}

/**
 * Synchronous `resolveDevPort`, for configs that cannot await — Playwright
 * loads its config through `require`, so top-level await is not available.
 * Runs this file as a subprocess rather than duplicating the logic.
 */
export function resolveDevPortSync() {
  const out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], {
    encoding: "utf8",
  });
  return Number.parseInt(out.trim(), 10);
}

/** The remembered port without probing or allocating. Falls back to BASE_PORT. */
export function peekDevPort() {
  const env = Number.parseInt(process.env.OKF_DEV_PORT ?? "", 10);
  if (Number.isInteger(env) && env > 0) return env;
  return remembered() ?? BASE_PORT;
}

// Wrapped rather than top-level await: a module with TLA is an async module
// for every importer, which breaks node:test's loop accounting when the test
// file imports this one.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  (async () => {
    const port = args.includes("--peek") ? peekDevPort() : await resolveDevPort();
    process.stdout.write(args.includes("--url") ? `http://127.0.0.1:${port}/\n` : `${port}\n`);
  })();
}
