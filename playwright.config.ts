import { defineConfig, devices } from "@playwright/test";
import { resolveDevPortSync } from "./scripts/dev-port.mjs";
import { mkdtempSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Seed a scratch OKF workspace for e2e so tests never mutate tracked fixtures.
 */
function createE2EWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "okf-e2e-"));
  const sample = join(process.cwd(), "public/sample-okf");
  if (existsSync(sample)) {
    cpSync(sample, dir, { recursive: true });
  } else {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const E2E_WORKSPACE =
  process.env.OKF_WORKSPACE ?? process.env.MOTION_WORKSPACE ?? createE2EWorkspace();

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
