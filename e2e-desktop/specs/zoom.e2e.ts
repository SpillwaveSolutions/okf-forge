/**
 * Zoom exists only in the desktop runtime — web mode defers to the browser's
 * own zoom, which Chrome already persists per-origin — so this is the only
 * tier that can exercise it at all.
 *
 * The web suite's viewport-containment check runs at 100% and nowhere else,
 * which makes the max-zoom row below the sole guard against the rem-based grid
 * pushing controls out of the window.
 */
import { browser, $, expect } from "@wdio/globals";

// ZOOM_STEPS is [0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0] and 1.0 sits at
// index 2, so six presses walk from the default to the maximum.
const PRESSES_TO_MAX = 6;

const rootFontSize = () =>
  browser.execute(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

async function press(key: string, times = 1) {
  for (let i = 0; i < times; i++) await browser.keys(["Meta", key]);
}

describe("desktop zoom", () => {
  before(async () => {
    // Same hydration rule as web mode: static copy is present before React is
    // live, so wait for a client-rendered row before touching anything.
    await $("[data-testid='app-header']").waitForExist({ timeout: 60_000 });
    await $("[role='option']").waitForDisplayed({ timeout: 60_000 });
  });

  afterEach(async () => {
    await press("0");
  });

  it("grows and shrinks the root font size", async () => {
    const base = await rootFontSize();
    await press("=");
    expect(await rootFontSize()).toBeGreaterThan(base);
    await press("-", 2);
    expect(await rootFontSize()).toBeLessThan(base);
  });

  it("resets to 100% on Cmd+0", async () => {
    const base = await rootFontSize();
    await press("=", 3);
    await press("0");
    expect(await rootFontSize()).toBeCloseTo(base, 1);
  });

  it("shows the level in the status bar only when it is not 100%", async () => {
    // A permanent "100%" readout is noise, so its absence is part of the
    // contract rather than an accident.
    await expect($("[data-testid='zoom-level']")).not.toBeExisting();
    await press("=");
    await expect($("[data-testid='zoom-level']")).toBeDisplayed();
  });

  it("keeps every control reachable at maximum zoom", async () => {
    await press("=", PRESSES_TO_MAX);

    const escaped = await browser.execute(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll("button, input, [role=option]")]
        .filter((el) => !el.closest("[data-scroll]"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > w + 1);
        })
        .map((el) => el.getAttribute("data-testid") ?? el.tagName);
    });
    expect(escaped).toEqual([]);

    // The header opts out above because it scrolls horizontally at this zoom.
    // Scrollable is reachable; clipped is not — so assert its controls fit
    // inside its own scrollWidth rather than inside the window.
    const clipped = await browser.execute(() => {
      const header = document.querySelector("[data-testid='app-header']");
      if (!header) return ["header missing"];
      const origin = header.getBoundingClientRect().left + header.scrollLeft;
      return [...header.querySelectorAll("button, input")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right - origin > header.scrollWidth + 1;
        })
        .map((el) => el.getAttribute("data-testid") ?? el.tagName);
    });
    expect(clipped).toEqual([]);
  });
});
