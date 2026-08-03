/**
 * Structural layout checks — the machine-judgeable half of the visual rubric in
 * docs/designs/ui-editor.md. Every assertion here maps to a "Must match" row
 * with a named Check. Rows marked `agent` in that rubric are judged by a human
 * or a multimodal agent and are deliberately NOT tested here: a gate whose
 * failure mode is "the model was in a mood" is worse than no gate.
 *
 * No pixel comparison on purpose. Font rasterization differs between macOS and
 * Linux CI, so screenshot diffing needs a Linux-only project and a fudge factor
 * before it means anything. These checks catch the structural regressions this
 * codebase actually experiences.
 */
import { test, expect, type Page } from "@playwright/test";
import { gotoApp } from "./helpers";

// .app-shell collapses to a single column at max-width: 900px (src/styles.css).
// Every test here asserts the two-column desktop contract, so the viewport must
// be pinned above that breakpoint or the assertions are meaningless.
const DESKTOP = { width: 1280, height: 800 };

async function gotoView(page: Page, view: string) {
  await page.setViewportSize(DESKTOP);
  await gotoApp(page);
  await page.getByTestId(`nav-${view}`).click();
  await expect(page.getByTestId("app-main")).toHaveAttribute("data-view", view);
}

test.describe("app shell layout", () => {
  test("grid topology: sidebar and main are side-by-side columns", async ({ page }) => {
    await gotoView(page, "editor");

    const side = (await page.getByTestId("app-sidebar").boundingBox())!;
    const main = (await page.getByTestId("app-main").boundingBox())!;
    const head = (await page.getByTestId("app-header").boundingBox())!;

    // The exact failure mode recorded in AppShell.tsx: wrapping sidebar+main in
    // a div collapsed both into the 280px left column, so the nav and editor
    // panels rendered but looked dead. Nothing caught it at the time.
    expect(side.x + side.width).toBeLessThanOrEqual(main.x + 1);
    expect(main.width).toBeGreaterThan(600);
    expect(head.width).toBeGreaterThanOrEqual(side.width + main.width - 2);
    expect(main.y).toBeGreaterThanOrEqual(head.y + head.height - 1);
  });

  test("no interactive element renders outside the viewport", async ({ page }) => {
    await gotoView(page, "editor");

    const escaped = await page.evaluate(() => {
      const bad: string[] = [];
      const sel = "button, input, a, [role=option]";
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // hidden is fine
        if (el.closest("[data-scroll]")) continue; // scroll containers opt out
        if (
          r.right > window.innerWidth + 1 ||
          r.left < -1 ||
          r.bottom > window.innerHeight + 1 ||
          r.top < -1
        ) {
          bad.push(`${el.tagName}.${el.className} @ ${Math.round(r.left)},${Math.round(r.top)}`);
        }
      }
      return bad;
    });

    expect(escaped, escaped.join("\n")).toEqual([]);
  });

  test("headings and button labels are not clipped", async ({ page }) => {
    await gotoView(page, "search");

    const clipped = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("h1, h2, h3, button")) {
        // .truncate is deliberate: file names, type badges and the status-bar
        // path are all designed to ellipsize.
        if (el.closest(".truncate") || el.querySelector(".truncate")) continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          bad.push(`${el.tagName}: ${el.textContent?.trim()}`);
        }
      }
      return bad;
    });

    expect(clipped, clipped.join("\n")).toEqual([]);
  });

  test("editor view-mode toggle exposes exactly one pressed button", async ({ page }) => {
    await gotoView(page, "editor");

    const group = page.getByRole("group", { name: "Editor view mode" });
    await expect(group.getByRole("button")).toHaveCount(3);
    // Without aria-pressed the selected state was a CSS class only — invisible
    // to assistive tech and unassertable here.
    await expect(group.locator("button[aria-pressed=true]")).toHaveCount(1);
  });

  test("every view mounts and identifies itself", async ({ page }) => {
    const VIEWS = [
      "learn",
      "explorer",
      "editor",
      "search",
      "classify",
      "deepagent",
      "integrations",
    ];

    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.setViewportSize(DESKTOP);
    await gotoApp(page);

    // explorer, classify, deepagent and integrations had no test coverage at
    // all before this: a runtime crash in any of them shipped silently.
    for (const view of VIEWS) {
      await page.getByTestId(`nav-${view}`).click();
      await expect(page.getByTestId("app-main")).toHaveAttribute("data-view", view);
    }

    expect(errors, `console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("theme toggle cycles system, light, and dark", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.setViewportSize(DESKTOP);
    await gotoApp(page);

    const toggle = page.getByTestId("theme-toggle");
    const html = page.locator("html");

    // The starting preference depends on the runner's OS setting, so cycle to
    // a known state rather than assuming one.
    for (let i = 0; i < 3; i++) {
      if ((await toggle.getAttribute("data-theme-pref")) === "system") break;
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("data-theme-pref", "system");

    for (const expected of ["light", "dark"]) {
      await toggle.click();
      await expect(toggle).toHaveAttribute("data-theme-pref", expected);
      await expect(html).toHaveAttribute("data-theme", expected);
    }

    // The accessible name must carry state AND next action: an icon alone
    // cannot convey a three-state cycle to a screen reader.
    await expect(toggle).toHaveAccessibleName("Theme: dark. Switch to system.");

    await toggle.click();
    await expect(toggle).toHaveAttribute("data-theme-pref", "system");

    expect(errors, `console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("the light theme actually repaints the surface", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await gotoApp(page);

    const toggle = page.getByTestId("theme-toggle");
    const html = page.locator("html");
    const bodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    const settle = async (want: string) => {
      for (let i = 0; i < 3; i++) {
        if ((await html.getAttribute("data-theme")) === want) return;
        await toggle.click();
      }
      throw new Error(`could not reach ${want}`);
    };

    await settle("dark");
    const dark = await bodyBg();
    await settle("light");

    // This is the one that catches a missing `inline` on @theme: without it
    // Tailwind bakes the resolved colour into every utility, so data-theme
    // flips but nothing repaints.
    expect(await bodyBg()).not.toBe(dark);
  });
});
