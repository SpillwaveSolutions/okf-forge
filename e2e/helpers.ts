import { expect, type Page } from "@playwright/test";

/**
 * Navigate to the app and wait until it is actually interactive.
 *
 * This exists because the web build is server-rendered (TanStack Start). The
 * SSR HTML contains the static copy — "Learn OKF by using it", the nav labels,
 * the header buttons — so those become visible well before React hydrates.
 * Waiting on them and then clicking produces a click that lands on a real,
 * enabled element with no handler attached yet, and the test fails with a
 * symptom ("dialog not found") that looks nothing like the cause.
 *
 * The file tree is the signal: it is populated by init() on the client from
 * the bundle fetch, so a `role=option` row cannot exist in the SSR HTML. Once
 * one is visible, hydration has run and event handlers are live.
 */
export async function gotoApp(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Learn OKF by using it")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator("[role=option]").first()).toBeVisible({
    timeout: 15_000,
  });
}
