/**
 * Re-shoot every image the README embeds, against the running dev server.
 *
 *   npm run dev          # in one terminal
 *   npm run screenshots  # in another
 *
 * This exists because the README went stale invisibly: its images still showed
 * the pre-rename "OKF Motion" branding, a seven-item nav, and the flat sidebar,
 * across two releases that changed all three. Nothing failed, because nothing
 * checks an image. Making the refresh one command is the cheap half of the fix.
 *
 * Deliberately NOT wired into `verify` or CI. Fonts rasterize differently on
 * macOS and Linux, so a committed PNG regenerated on a CI runner would diff on
 * every byte and prove nothing. A human runs this and looks at the output.
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const PORT = readFileSync(".dev-port", "utf8").trim();
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "screenshots";

/** Seed prefs before the bootstrap script reads them, so there is no flash. */
async function newPage(browser, { theme, width, height }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    colorScheme: theme === "light" ? "light" : "dark",
  });
  await ctx.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    ["okf-workbench-prefs-v1", JSON.stringify({ theme, zoom: 1 })],
  );
  return ctx.newPage();
}

/** Same hydration gate as e2e/helpers.ts — SSR copy is visible long before React attaches. */
async function gotoApp(page) {
  await page.goto(BASE);
  await page.getByText("Learn OKF by using it").waitFor({ timeout: 20_000 });
  await page.locator("[role=treeitem]").first().waitFor({ timeout: 20_000 });
  await page.waitForTimeout(600);
}

async function shoot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  wrote ${OUT}/${name}.png`);
}

const browser = await chromium.launch();

// 1. Hero — Learn view, dark.
{
  console.log("hero (okf-prod)");
  const page = await newPage(browser, { theme: "dark", width: 1280, height: 800 });
  await gotoApp(page);
  await shoot(page, "okf-prod");
  await page.close();
}

// 2. Editor — split source + preview on the Graph Engineer AgentNode.
{
  console.log("editor (okf-editor)");
  const page = await newPage(browser, { theme: "dark", width: 1280, height: 800 });
  await gotoApp(page);
  await page.getByRole("button", { name: "Split" }).click();
  await page.getByRole("treeitem", { name: /graph-engineer/ }).click();
  await shoot(page, "okf-editor");
  await page.close();
}

// 3. Impact — search, blast radius, and a context pack, all on screen at once.
{
  console.log("impact (okf-impact)");
  const page = await newPage(browser, { theme: "dark", width: 1280, height: 800 });
  await gotoApp(page);
  await page.getByTestId("nav-search").click();
  // Scoped to main: the nav item is also called "Search".
  const main = page.getByTestId("app-main");
  await page.getByLabel("Graph search query").fill("AgentNode");
  await main.getByRole("button", { name: "Search" }).click();
  await main.getByRole("button", { name: "Compute impact" }).click();
  await main.getByRole("button", { name: "Build pack" }).click();
  // The caption promises update order and the pack, both of which render
  // *below* the search hits. scrollIntoViewIfNeeded is not enough here — the
  // heading is already partly on screen, so it declines to move at all.
  await main
    .getByRole("heading", { name: "Impact analysis" })
    .evaluate((el) => el.scrollIntoView({ block: "start" }));
  await shoot(page, "okf-impact");
  await page.close();
}

// 4. DeepAgents skill map.
{
  console.log("deepagents (okf-deepagent)");
  const page = await newPage(browser, { theme: "dark", width: 1280, height: 800 });
  await gotoApp(page);
  await page.getByTestId("nav-deepagent").click();
  await shoot(page, "okf-deepagent");
  await page.close();
}

// 5. Mobile shell — 390px, the iPhone-class viewport the layout collapses at.
{
  console.log("mobile (okf-mobile)");
  const page = await newPage(browser, { theme: "dark", width: 390, height: 844 });
  await gotoApp(page);
  await shoot(page, "okf-mobile");
  await page.close();
}

// 6. Light theme — shipped in v0.1.0 and invisible in every previous image.
{
  console.log("light theme (okf-light)");
  const page = await newPage(browser, { theme: "light", width: 1280, height: 800 });
  await gotoApp(page);
  await page.getByRole("button", { name: "Split" }).click();
  await page.getByRole("treeitem", { name: /graph-engineer/ }).click();
  await shoot(page, "okf-light");
  await page.close();
}

await browser.close();
console.log("done");
