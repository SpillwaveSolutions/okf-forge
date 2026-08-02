/**
 * Desktop end-to-end, driving the real Tauri window.
 *
 * Playwright cannot do this on macOS: of the three Tauri webviews only
 * Windows' WebView2 speaks CDP, so there is nothing to attach to. `tauri-driver`
 * is Windows/Linux only for the same reason (no WKWebView driver exists). The
 * supported macOS path is WebdriverIO with an embedded WebDriver server running
 * inside the app, which is what `tauri-plugin-wdio-webdriver` provides under the
 * `automation` cargo feature.
 *
 * Separate directory and runner from e2e/ on purpose — four tiers, four
 * disjoint globs, no testIgnore gymnastics:
 *
 *   tests/*.test.ts            node:test
 *   src/ ** /*.test.ts(x)      vitest
 *   e2e/*.spec.ts              playwright   (web mode)
 *   e2e-desktop/specs/*.e2e.ts wdio         (real window)
 *
 * Prerequisite: `npm run tauri:build:automation` — the service launches the
 * built debug binary, it does not build it.
 *
 * Deliberately NOT a required CI check. It needs a full cargo build and a real
 * window, which makes it the slowest and flakiest tier here; it runs on a
 * schedule and on demand instead. See .github/workflows/desktop-e2e.yml.
 */
import { join } from "node:path";

// Lowercase: the Cargo package is `okfforge`, so that is the binary name.
// productName ("OKFForge") only names the .app bundle, which --no-bundle skips.
const BINARY = join(import.meta.dirname, "../src-tauri/target/debug/okfforge");

export const config: WebdriverIO.Config = {
  runner: "local",
  specs: ["./specs/**/*.e2e.ts"],
  // One window at a time: the app holds a single workspace root in a Mutex,
  // so parallel instances would fight over it.
  maxInstances: 1,
  // `tauri:options` on the capability is where the service looks for the
  // binary; passing `application` as a service option is silently ignored and
  // fails later with "No browserName defined in capabilities".
  capabilities: [{ browserName: "tauri", "tauri:options": { application: BINARY } }],
  services: ["tauri"],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: { ui: "bdd", timeout: 120_000 },
  logLevel: "warn",
};
