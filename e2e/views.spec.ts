/**
 * Per-view structural gate. One table-driven spec rather than six bespoke
 * files: the assertions are identical for every view, and six copies would
 * drift apart the first time one of them needed a tweak.
 *
 * Each row here is the machine-judgeable half of one `docs/designs/ui-<view>.md`
 * rubric. The `h1` and `cards` values are the element-inventory contract in
 * executable form — a view that loses its heading or a whole section fails
 * here rather than in a screenshot review nobody runs.
 *
 * `cards` is a MINIMUM, not an equality. Several panels render one card per
 * plugin, suggestion, or catalog group, so the count moves with fixture data;
 * pinning it exactly would make this suite fail whenever sample-okf changes.
 */
import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

const DESKTOP = { width: 1280, height: 800 };

interface ViewSpec {
  /** nav-<view> testid and the data-view value. */
  view: string;
  /** Exact h1 text, or a prefix when the heading is data-driven. */
  h1: string | RegExp;
  /** Lower bound on `.panel-card` count. */
  cards: number;
  /** Section headings that must be present, in order. */
  sections?: string[];
}

const VIEWS: ViewSpec[] = [
  { view: "learn", h1: "Learn OKF by using it", cards: 8 },
  // Data-driven: the heading is the bundle name, so it tracks the fixture.
  { view: "explorer", h1: /^sample-okf$|^Workspace$/, cards: 2 },
  {
    view: "search",
    h1: "Graph & search",
    cards: 5,
    sections: [
      "Impact analysis",
      "Progressive disclosure pack",
      "Neighborhood graph",
      "Validation",
    ],
  },
  { view: "classify", h1: "Classify into OKF", cards: 1 },
  { view: "deepagent", h1: "LangChain DeepAgents", cards: 4 },
  { view: "integrations", h1: "Plugins & MCP", cards: 1 },
];

for (const spec of VIEWS) {
  test(`${spec.view} view renders its documented structure`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.setViewportSize(DESKTOP);
    await gotoApp(page);
    await page.getByTestId(`nav-${spec.view}`).click();

    const main = page.getByTestId("app-main");
    await expect(main).toHaveAttribute("data-view", spec.view);

    await expect(main.locator("h1")).toHaveText(spec.h1);
    expect(await main.locator(".panel-card").count()).toBeGreaterThanOrEqual(spec.cards);

    if (spec.sections) {
      await expect(main.locator("h2")).toHaveText(spec.sections);
    }

    expect(errors, `console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });
}

/**
 * Applied to every view rather than the editor alone. The equivalent check in
 * layout.spec.ts only ever visits the editor, so horizontal overflow in, say,
 * the classify panel went unnoticed.
 *
 * HORIZONTAL ONLY, deliberately. Panels scroll vertically by design — the
 * explorer lists every concept in the bundle and the DeepAgents panel renders a
 * checkbox per skill, so most of both sits below the fold and is reached by
 * scrolling. Asserting on `bottom > clientHeight` flags all of that as broken.
 * Sideways overflow is the real defect: this grid has no horizontal scroll, so
 * anything past the right edge is unreachable rather than merely off-screen.
 */
test("no view lets an interactive element escape sideways", async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await gotoApp(page);

  const offenders: Record<string, string[]> = {};
  for (const { view } of VIEWS) {
    await page.getByTestId(`nav-${view}`).click();
    await expect(page.getByTestId("app-main")).toHaveAttribute("data-view", view);

    const escaped = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll<HTMLElement>("button, input, a, [role=option]")]
        .filter((el) => !el.closest("[data-scroll]"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return false;
          return r.right > w + 1 || r.left < -1;
        })
        .map((el) => `${el.tagName}.${el.className}`.slice(0, 60));
    });
    if (escaped.length) offenders[view] = escaped;
  }

  expect(offenders, JSON.stringify(offenders, null, 2)).toEqual({});
});
