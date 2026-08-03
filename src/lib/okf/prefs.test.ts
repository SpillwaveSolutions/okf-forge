import { beforeEach, describe, expect, it } from "vitest";
import {
  ZOOM_STEPS,
  applyPrefs,
  cycleTheme,
  defaultPrefs,
  loadPrefs,
  resolveTheme,
  savePrefs,
  stepZoom,
  themeLabel,
} from "./prefs";

/**
 * These functions are the whole reason prefs.ts exists as a separate module:
 * the branchy parts — clamping at both ends, snapping an off-grid value,
 * recovering from a corrupt stored value — are exactly what breaks silently
 * when they live inline in a component.
 */

beforeEach(() => localStorage.clear());

describe("cycleTheme", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(cycleTheme("system")).toBe("light");
    expect(cycleTheme("light")).toBe("dark");
    expect(cycleTheme("dark")).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("passes explicit preferences through untouched", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the OS only when the preference is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("stepZoom", () => {
  it("moves one step in the requested direction", () => {
    expect(stepZoom(1, 1)).toBe(1.1);
    expect(stepZoom(1, -1)).toBe(0.9);
  });

  it("clamps at both ends instead of wrapping", () => {
    expect(stepZoom(ZOOM_STEPS[ZOOM_STEPS.length - 1], 1)).toBe(2);
    expect(stepZoom(ZOOM_STEPS[0], -1)).toBe(0.8);
  });

  it("snaps an off-grid value onto the nearest step first", () => {
    // A hand-edited or stale stored value must not strand the user between
    // steps, where every subsequent press would carry the same offset.
    expect(stepZoom(1.06, 1)).toBe(1.1);
    expect(stepZoom(1.06, -1)).toBe(1);
  });
});

describe("loadPrefs", () => {
  it("returns defaults when nothing is stored", () => {
    expect(loadPrefs()).toEqual({ theme: "system", zoom: 1 });
  });

  it("round-trips a saved value", () => {
    savePrefs({ theme: "dark", zoom: 1.5 });
    expect(loadPrefs()).toEqual({ theme: "dark", zoom: 1.5 });
  });

  it("falls back to defaults on unparseable JSON", () => {
    localStorage.setItem("okf-workbench-prefs-v1", "{not json");
    expect(loadPrefs()).toEqual(defaultPrefs());
  });

  it("rejects an unknown theme and an off-scale zoom", () => {
    localStorage.setItem("okf-workbench-prefs-v1", JSON.stringify({ theme: "neon", zoom: 99 }));
    expect(loadPrefs()).toEqual({ theme: "system", zoom: 1 });
  });

  it("keeps the valid half when only one field is corrupt", () => {
    localStorage.setItem("okf-workbench-prefs-v1", JSON.stringify({ theme: "dark", zoom: "big" }));
    expect(loadPrefs()).toEqual({ theme: "dark", zoom: 1 });
  });
});

describe("themeLabel", () => {
  it("states both the current preference and the next action", () => {
    // An icon alone cannot convey a three-state cycle, so the accessible name
    // has to carry it.
    expect(themeLabel("system", "dark")).toBe("Theme: system (dark). Switch to light.");
    expect(themeLabel("light", "light")).toBe("Theme: light. Switch to dark.");
    expect(themeLabel("dark", "dark")).toBe("Theme: dark. Switch to system.");
  });
});

describe("applyPrefs", () => {
  it("writes the resolved theme and zoom onto the root element", () => {
    const root = document.createElement("html");
    applyPrefs(root, "light", 1.25);
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.style.getPropertyValue("--okf-zoom")).toBe("1.25");
  });
});
