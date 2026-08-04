import { defineConfig, devices } from "@playwright/test";
import { resolveDevPortSync } from "./scripts/dev-port.mjs";
import { rmSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/** Fixed, not `mkdtemp` — see seedE2EWorkspace. */
const SCRATCH_WORKSPACE = join(tmpdir(), "okf-e2e-workspace");

/**
 * Seed a scratch OKF workspace so e2e never mutates the tracked fixture.
 *
 * The path is deterministic on purpose. Playwright loads this config in the
 * main process AND again in every worker, so `mkdtempSync` handed out a
 * different directory to each: the dev server served one tree while the
 * workers believed in another, and every run orphaned the extras under /tmp.
 * A fixed path is what makes all of those processes agree.
 *
 * Reseeding is guarded on `TEST_WORKER_INDEX`, which Playwright sets only in
 * worker processes. Without the guard a worker starting mid-run would delete
 * the tree the dev server is currently reading.
 */
function seedE2EWorkspace(): string {
  if (process.env.TEST_WORKER_INDEX === undefined) {
    rmSync(SCRATCH_WORKSPACE, { recursive: true, force: true });
    const sample = join(process.cwd(), "public/sample-okf");
    if (existsSync(sample)) {
      cpSync(sample, SCRATCH_WORKSPACE, { recursive: true });
    } else {
      mkdirSync(SCRATCH_WORKSPACE, { recursive: true });
    }
  }
  return SCRATCH_WORKSPACE;
}

const E2E_WORKSPACE =
  process.env.OKF_WORKSPACE ?? process.env.MOTION_WORKSPACE ?? seedE2EWorkspace();

// Resolved once here, then pinned into webServer.env so the dev server this
// config spawns cannot independently resolve a different port. Without the pin
// there is a real race: the port can be taken between our probe and Vite's.
const PORT = resolveDevPortSync();
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Web-mode e2e for OKFForge.
 * Same app as Vercel / live preview — a real Vite dev server with
 * OKF_WORKSPACE pointing at a scratch copy of sample-okf.
 */
export default defineConfig({
  testDir: "./e2e",
  // Runs after webServer is up. Fails the whole run if that server is serving
  // a directory inside the repo — see e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    // Safe to reuse now that the port is resolved rather than assumed: a
    // foreign server on the old fixed port used to be silently reused, and the
    // whole suite would run against a different project's app.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      OKF_DEV_PORT: String(PORT),
      OKF_WORKSPACE: E2E_WORKSPACE,
    },
  },
});
