import { defineConfig, devices } from "@playwright/test";
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

/**
 * Web-mode e2e for OKFForge.
 * Same app as Vercel / live preview — real Vite dev server on :8080 with
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
    baseURL: "http://127.0.0.1:8080",
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
    url: "http://127.0.0.1:8080",
    // Live preview already runs on 8080 in this sandbox — reuse when present.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      OKF_WORKSPACE: E2E_WORKSPACE,
    },
  },
});
