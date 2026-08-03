/**
 * Scope this tier tightly: only assert what the *real runtime* can prove.
 *
 * The React tree is identical in both runtimes by design — getStorage() is the
 * only runtime-aware code — so re-testing views here would duplicate
 * e2e/layout.spec.ts at ten times the cost. What web mode cannot reach is the
 * desktop shell itself: that a native window opens, that the app hydrates
 * inside WKWebView, and that the app reports itself as native rather than web.
 */
import { browser, $, expect } from "@wdio/globals";

describe("desktop shell", () => {
  it("opens a native window and hydrates the app", async () => {
    // Same hydration rule as web mode: static copy is present before React is
    // live, so wait for a client-rendered row before asserting anything.
    await $("[data-testid='app-sidebar']").waitForExist({ timeout: 60_000 });
    await $("[role='treeitem']").waitForDisplayed({ timeout: 60_000 });

    await expect($("[data-testid='app-main']")).toExist();
    await expect($("[data-testid='app-header']")).toExist();
  });

  it("reports the native runtime, not the web one", async () => {
    // isTauriRuntime() sniffs this; if it is absent the app silently falls back
    // to HttpStorage and every filesystem operation goes to a dev-server
    // endpoint that does not exist in a packaged build.
    const native = await browser.execute(() => "__TAURI_INTERNALS__" in window);
    expect(native).toBe(true);
  });
});
