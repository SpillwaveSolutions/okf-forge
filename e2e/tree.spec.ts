/**
 * The tree keyboard contract, end to end.
 *
 * `src/lib/okf/tree.test.ts` pins the pure decision logic; this pins the parts
 * only a browser has — that focus actually moves, that the roving tabindex
 * leaves exactly one tab stop, and that the ARIA attributes reach the DOM.
 * Between them they cover the promise `role="tree"` makes: without working
 * arrows, Home/End, and typeahead, the role is worse than the invalid
 * `role="listbox"` it replaced, because it advertises a contract nothing keeps.
 */
import { test, expect, type Page } from "@playwright/test";
import { gotoApp } from "./helpers";

const DESKTOP = { width: 1280, height: 800 };

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute("role") === "treeitem"
      ? { name: el.textContent?.trim(), kind: el.getAttribute("data-kind") }
      : null;
  });

async function openTree(page: Page) {
  await page.setViewportSize(DESKTOP);
  await gotoApp(page);
  const tree = page.getByRole("tree", { name: "Workspace files" });
  await expect(tree).toBeVisible();
  return tree;
}

test("exposes one tab stop, not one per file", async ({ page }) => {
  const tree = await openTree(page);
  // 22 concepts plus their directories: without a roving tabindex, Tab would
  // walk every one of them before reaching the editor.
  expect(await tree.getByRole("treeitem").count()).toBeGreaterThan(10);
  await expect(tree.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1);
});

test("arrow keys move focus and open directories", async ({ page }) => {
  const tree = await openTree(page);
  await tree.locator('[role=treeitem][tabindex="0"]').focus();

  const first = await focused(page);
  expect(first).not.toBeNull();

  await page.keyboard.press("ArrowDown");
  expect((await focused(page))?.name).not.toBe(first?.name);

  await page.keyboard.press("ArrowUp");
  expect((await focused(page))?.name).toBe(first?.name);

  // Walk to a directory and drive it closed, then open again.
  const dir = tree.locator("[role=treeitem][data-kind=dir]").first();
  await dir.focus();
  await expect(dir).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(dir).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowRight");
  await expect(dir).toHaveAttribute("aria-expanded", "true");

  // Right again from an open directory steps into its first child.
  await page.keyboard.press("ArrowRight");
  expect((await focused(page))?.kind).toBe("file");
  // And Left climbs back out to the parent rather than collapsing it.
  await page.keyboard.press("ArrowLeft");
  expect((await focused(page))?.kind).toBe("dir");
});

test("Home and End jump to the ends of the visible tree", async ({ page }) => {
  const tree = await openTree(page);
  await tree.locator('[role=treeitem][tabindex="0"]').focus();

  await page.keyboard.press("End");
  const last = await focused(page);
  await page.keyboard.press("Home");
  const first = await focused(page);

  expect(first).not.toBeNull();
  expect(last).not.toBeNull();
  expect(first?.name).not.toBe(last?.name);
});

test("typeahead jumps to a row by name", async ({ page }) => {
  const tree = await openTree(page);
  await tree.locator('[role=treeitem][tabindex="0"]').focus();
  await page.keyboard.press("Home");

  // "knowledge" is a top-level directory in sample-okf.
  for (const ch of "know") await page.keyboard.press(ch);
  expect((await focused(page))?.name).toContain("knowledge");
});

test("Enter opens the focused file in the editor", async ({ page }) => {
  const tree = await openTree(page);
  const file = tree.locator("[role=treeitem][data-kind=file]").first();
  await file.focus();
  // `title` is the concept path. textContent is not usable here: the type
  // badge abuts the filename with no separator, so it reads "a.mdAgent".
  const path = await file.getAttribute("title");

  await page.keyboard.press("Enter");
  await expect(file).toHaveAttribute("aria-selected", "true");
  // Selecting a file is what routes to the editor; the status bar echoes it.
  await expect(page.getByTestId("app-status")).toContainText(path!);
});

test("rows carry the nesting the flat DOM no longer does", async ({ page }) => {
  const tree = await openTree(page);
  // aria-level is the only thing telling assistive tech about depth now that
  // rows are siblings rather than nested containers.
  const levels = await tree.locator("[role=treeitem]").evaluateAll((els) =>
    els.map((el) => ({
      level: el.getAttribute("aria-level"),
      depth: el.getAttribute("data-depth"),
    })),
  );
  expect(levels.length).toBeGreaterThan(10);
  for (const { level, depth } of levels) {
    expect(Number(level)).toBe(Number(depth) + 1);
  }
  // A real bundle has nesting; a tree that is all depth 0 means filtering or
  // flattening silently lost the hierarchy.
  expect(levels.some((l) => Number(l.depth) > 0)).toBe(true);
});
