/**
 * View preferences: colour theme and font zoom.
 *
 * Pure by design — everything here is testable without a browser except the
 * single `applyPrefs` DOM writer, which takes its target as an argument so a
 * test can hand it a detached element.
 *
 * Mirrors the persistence shape already used by integrations.ts: an
 * `okf-workbench-*-v1` key, an SSR guard, and a try/catch that degrades to
 * defaults. A preferences read must never be able to stop the app booting.
 */
const STORAGE_KEY = "okf-workbench-prefs-v1";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Fine near the default and coarse at the extremes: users nudge by 10% around
 * 100% and jump when they want a genuinely different size.
 */
export const ZOOM_STEPS = [0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0] as const;

export interface Prefs {
  theme: ThemePref;
  zoom: number;
}

export function defaultPrefs(): Prefs {
  return { theme: "system", zoom: 1 };
}

const THEME_PREFS: readonly ThemePref[] = ["system", "light", "dark"];

export function cycleTheme(current: ThemePref): ThemePref {
  const i = THEME_PREFS.indexOf(current);
  return THEME_PREFS[(i + 1) % THEME_PREFS.length];
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): ResolvedTheme {
  if (pref === "system") return prefersDark ? "dark" : "light";
  return pref;
}

/**
 * The next step strictly past `current`, clamped at both ends.
 *
 * Deliberately not "snap to nearest, then move one index": from an off-grid
 * 1.06 that would snap to 1.1 and then advance to 1.25, skipping the step the
 * user was asking for. Searching past the current value instead lands on 1.1,
 * behaves identically for on-grid values, and pulls an out-of-range value
 * (stale storage, a hand edit) back onto the scale rather than off the end.
 */
export function stepZoom(current: number, dir: 1 | -1): number {
  // Guards against a stored value that is a float hair away from a step, where
  // a strict comparison would return that same step and the key would look dead.
  const EPS = 1e-6;
  if (dir === 1) {
    return ZOOM_STEPS.find((s) => s > current + EPS) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }
  return [...ZOOM_STEPS].reverse().find((s) => s < current - EPS) ?? ZOOM_STEPS[0];
}

/** Accessible name for the toggle: current state plus what a click will do. */
export function themeLabel(pref: ThemePref, resolved: ResolvedTheme): string {
  const shown = pref === "system" ? `system (${resolved})` : pref;
  return `Theme: ${shown}. Switch to ${cycleTheme(pref)}.`;
}

function isThemePref(v: unknown): v is ThemePref {
  return v === "light" || v === "dark" || v === "system";
}

function isZoom(v: unknown): v is number {
  return typeof v === "number" && (ZOOM_STEPS as readonly number[]).includes(v);
}

export function loadPrefs(): Prefs {
  if (typeof localStorage === "undefined") return defaultPrefs();
  const base = defaultPrefs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    // Validated per field rather than whole-object: one corrupt value should
    // not discard the other, which is still perfectly good.
    return {
      theme: isThemePref(parsed.theme) ? parsed.theme : base.theme,
      zoom: isZoom(parsed.zoom) ? parsed.zoom : base.zoom,
    };
  } catch {
    return base;
  }
}

export function savePrefs(prefs: Prefs) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private browsing and quota exhaustion both throw here. Losing a
    // preference is not worth breaking the interaction that changed it.
  }
}

/** The one impure function: stamp resolved values onto the document root. */
export function applyPrefs(root: HTMLElement, resolved: ResolvedTheme, zoom: number) {
  root.setAttribute("data-theme", resolved);
  root.style.setProperty("--okf-zoom", String(zoom));
}
