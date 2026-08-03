# View preferences (theme + zoom) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light/dark/system theme toggle and a desktop-only `Cmd +/-/0`
font zoom, both remembered across launches.

**Architecture:** A pure `src/lib/okf/prefs.ts` owns resolve/cycle/clamp/persist
and one DOM writer. The Zustand store holds the state; components consume it.
`styles.css` gains a `--okf-*` variable layer that `@theme inline` points at, so
a `data-theme` attribute on `<html>` re-themes every existing utility class
without touching a single component.

**Tech Stack:** Tailwind v4 (`@theme inline`), Zustand, React 19, vitest +
jsdom, Playwright, WebdriverIO.

## Global Constraints

- Design spec: `docs/designs/2026-08-02-view-preferences-design.md`. Palette
  values are copied verbatim from its §2.3 table.
- Prettier: double quotes, semicolons, trailing commas, width 100.
- Unit tests under `src/**/*.test.ts` run on vitest; `tests/*.test.ts` run on
  `node:test`. Do not mix.
- Every commit message ends with the work-item ULID in parentheses.
- `npm run verify` must pass before the PR opens.
- Never hand-edit `.work/*.jsonl` or `docs/roadmap.md`.

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/okf/prefs.ts` (new) | Pure preference logic + one `applyPrefs` DOM writer |
| `src/lib/okf/prefs.test.ts` (new) | vitest unit coverage for the above |
| `src/styles.css` (modify) | `--okf-*` light/dark layers, `@theme inline`, zoom var |
| `src/routes/__root.tsx` (modify) | Anti-FOUC head script; drop dead `className="dark"` |
| `tauri.html` (modify) | Same head script for the desktop SPA |
| `src/lib/okf/store.ts` (modify) | `themePref` / `zoom` state + actions |
| `src/components/okf/Header.tsx` (modify) | The cycling theme button |
| `src/components/okf/AppShell.tsx` (modify) | Zoom keybindings; zoom readout in status bar |
| 8 component files (modify) | 13 `text-[Npx]` → rem |
| `e2e/layout.spec.ts` (modify) | Theme gate rows |
| `e2e-desktop/specs/zoom.e2e.ts` (new) | Real-window zoom + viewport containment at 2.0 |
| `docs/designs/ui-editor.md` (modify) | Element inventory + rubric rows for the new control |

---

### Task 1: `prefs.ts` — pure preference logic

**Files:**
- Create: `src/lib/okf/prefs.ts`
- Test: `src/lib/okf/prefs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ThemePref`, `ResolvedTheme`, `Prefs`, `ZOOM_STEPS`,
  `defaultPrefs()`, `loadPrefs()`, `savePrefs(p)`, `cycleTheme(t)`,
  `resolveTheme(t, prefersDark)`, `stepZoom(current, dir)`,
  `themeLabel(pref, resolved)`, `applyPrefs(root, resolved, zoom)`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  ZOOM_STEPS,
  cycleTheme,
  defaultPrefs,
  loadPrefs,
  resolveTheme,
  savePrefs,
  stepZoom,
  themeLabel,
  applyPrefs,
} from "./prefs.ts";

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
    // steps, where every subsequent press would keep the offset.
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
  it("rejects an unknown theme and an off-scale zoom field-by-field", () => {
    localStorage.setItem(
      "okf-workbench-prefs-v1",
      JSON.stringify({ theme: "neon", zoom: 99 }),
    );
    expect(loadPrefs()).toEqual({ theme: "system", zoom: 1 });
  });
  it("keeps the valid half when only one field is corrupt", () => {
    localStorage.setItem(
      "okf-workbench-prefs-v1",
      JSON.stringify({ theme: "dark", zoom: "big" }),
    );
    expect(loadPrefs()).toEqual({ theme: "dark", zoom: 1 });
  });
});

describe("themeLabel", () => {
  it("states both the current preference and the next action", () => {
    expect(themeLabel("system", "dark")).toBe(
      "Theme: system (dark). Switch to light.",
    );
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/okf/prefs.test.ts`
Expected: FAIL — `Failed to resolve import "./prefs.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
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
 * Coarse near the default and wider at the extremes: users nudge by 10% around
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
 * Snap onto the step grid before moving. A stored value that has drifted off
 * the grid (hand-edited, or written by an older step table) would otherwise
 * carry its offset through every subsequent press.
 */
export function stepZoom(current: number, dir: 1 | -1): number {
  let nearest = 0;
  for (let i = 1; i < ZOOM_STEPS.length; i++) {
    if (Math.abs(ZOOM_STEPS[i] - current) < Math.abs(ZOOM_STEPS[nearest] - current)) {
      nearest = i;
    }
  }
  const next = Math.min(Math.max(nearest + dir, 0), ZOOM_STEPS.length - 1);
  return ZOOM_STEPS[next];
}

export function themeLabel(pref: ThemePref, resolved: ResolvedTheme): string {
  const next = cycleTheme(pref);
  const shown = pref === "system" ? `system (${resolved})` : pref;
  return `Theme: ${shown}. Switch to ${next}.`;
}

function isThemePref(v: unknown): v is ThemePref {
  return v === "light" || v === "dark" || v === "system";
}

function isZoom(v: unknown): v is number {
  return typeof v === "number" && ZOOM_STEPS.includes(v as (typeof ZOOM_STEPS)[number]);
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/okf/prefs.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/okf/prefs.ts src/lib/okf/prefs.test.ts
git commit -m "feat(prefs): pure theme and zoom preference logic (<ULID>)"
```

---

### Task 2: `styles.css` — the two-layer palette

**Files:**
- Modify: `src/styles.css:6-43` (the `@theme` block), `:50-53` (the `html` rule)

**Interfaces:**
- Consumes: nothing.
- Produces: `data-theme="light" | "dark"` on `<html>` re-themes every existing
  utility class; `--okf-zoom` on `<html>` scales the root font size.

- [ ] **Step 1: Replace the `@theme` block**

Non-colour tokens (`--font-*`, `--radius-*`) stay in a plain `@theme` block —
they never vary by theme and the extra indirection would be noise.

```css
@theme {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono:
    "JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, Menlo, Consolas, monospace;
  --font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* Light is the `:root` default so a document with no data-theme attribute —
   one where the head script failed — still renders legibly rather than
   transparent-on-transparent. */
:root,
:root[data-theme="light"] {
  color-scheme: light;

  --okf-bg: #ffffff;
  --okf-bg-elevated: #f6f8fa;
  --okf-bg-subtle: #eff2f5;
  --okf-bg-hover: #e6eaef;
  --okf-fg: #1f2328;
  --okf-fg-muted: #59636e;
  --okf-fg-subtle: #818b98;
  --okf-border: #d1d9e0;
  --okf-border-strong: #9198a1;
  --okf-primary: #0969da;
  --okf-primary-fg: #ffffff;
  --okf-primary-muted: color-mix(in oklab, #0969da 12%, transparent);
  --okf-accent: #1a7f37;
  --okf-accent-fg: #ffffff;
  --okf-danger: #d1242f;
  --okf-warning: #9a6700;
  --okf-success: #1a7f37;
  --okf-info: #0969da;
  --okf-card: #ffffff;
  --okf-ring: #0969da;

  --okf-shadow-sm: 0 1px 0 rgb(31 35 40 / 0.04);
  --okf-shadow-md: 0 3px 6px rgb(140 149 159 / 0.15);
  --okf-shadow-lg: 0 8px 24px rgb(140 149 159 / 0.2);
}

:root[data-theme="dark"] {
  color-scheme: dark;

  --okf-bg: #0d1117;
  --okf-bg-elevated: #161b22;
  --okf-bg-subtle: #21262d;
  --okf-bg-hover: #30363d;
  --okf-fg: #e6edf3;
  --okf-fg-muted: #8b949e;
  --okf-fg-subtle: #6e7681;
  --okf-border: #30363d;
  --okf-border-strong: #484f58;
  --okf-primary: #58a6ff;
  /* Deliberately inverted against light: these are the contrast partner for a
     filled surface, so dark theme puts near-black text on bright blue while
     light theme puts white on dark blue. Copying them across unchanged is the
     single most likely mistake in this file. */
  --okf-primary-fg: #0d1117;
  --okf-primary-muted: color-mix(in oklab, #58a6ff 16%, transparent);
  --okf-accent: #3fb950;
  --okf-accent-fg: #0d1117;
  --okf-danger: #f85149;
  --okf-warning: #f0883e;
  --okf-success: #3fb950;
  --okf-info: #58a6ff;
  --okf-card: #161b22;
  --okf-ring: #58a6ff;

  --okf-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --okf-shadow-md: 0 4px 12px rgb(0 0 0 / 0.4);
  --okf-shadow-lg: 0 8px 24px rgb(0 0 0 / 0.5);
}

/* `inline` is load-bearing. Without it Tailwind resolves --color-* once at
   :root and bakes the value into every utility, so the [data-theme] override
   never reaches `bg-bg` and the theme silently fails to switch. With it,
   Tailwind emits `var(--okf-bg)` and the indirection survives to runtime. */
@theme inline {
  --color-bg: var(--okf-bg);
  --color-bg-elevated: var(--okf-bg-elevated);
  --color-bg-subtle: var(--okf-bg-subtle);
  --color-bg-hover: var(--okf-bg-hover);
  --color-fg: var(--okf-fg);
  --color-fg-muted: var(--okf-fg-muted);
  --color-fg-subtle: var(--okf-fg-subtle);
  --color-border: var(--okf-border);
  --color-border-strong: var(--okf-border-strong);
  --color-primary: var(--okf-primary);
  --color-primary-fg: var(--okf-primary-fg);
  --color-primary-muted: var(--okf-primary-muted);
  --color-accent: var(--okf-accent);
  --color-accent-fg: var(--okf-accent-fg);
  --color-danger: var(--okf-danger);
  --color-warning: var(--okf-warning);
  --color-success: var(--okf-success);
  --color-info: var(--okf-info);
  --color-card: var(--okf-card);
  --color-ring: var(--okf-ring);

  --shadow-sm: var(--okf-shadow-sm);
  --shadow-md: var(--okf-shadow-md);
  --shadow-lg: var(--okf-shadow-lg);
}
```

- [ ] **Step 2: Make the root font size zoomable**

Replace the `html` rule at `src/styles.css:50-53`. `color-scheme` now lives on
the palette layers, so it comes out here.

```css
  html {
    /* Zoom rides the root font size so every rem in this file and every
       rem-based Tailwind text-* utility scales together. Borders and shadows
       keep their px values on purpose — a 1px hairline should stay 1px at
       200%, not become a blurry 2px frame. */
    font-size: calc(16px * var(--okf-zoom, 1));
  }
```

- [ ] **Step 3: Verify both themes compile and switch**

Run: `npm run dev`, then in the browser console:

```js
document.documentElement.setAttribute("data-theme", "light");
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.style.setProperty("--okf-zoom", "1.5");
```

Expected: the interface repaints light, then dark; text grows at 1.5.
If nothing changes on the first two, `inline` is missing from `@theme inline`.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "feat(theme): two-layer palette with light values and a zoom variable (<ULID>)"
```

---

### Task 3: Anti-FOUC head script in both entries

**Files:**
- Modify: `src/routes/__root.tsx:23-35`
- Modify: `tauri.html`

**Interfaces:**
- Consumes: the `okf-workbench-prefs-v1` key shape from Task 1.
- Produces: `data-theme` and `--okf-zoom` are correct before first paint.

- [ ] **Step 1: Add the script to the SSR shell**

Web mode server-renders, so HTML paints before any module loads. Without this
a user on light sees a dark frame flash. The script is inlined and duplicated
across the two entries deliberately — a shared module would be a network round
trip, which reintroduces the flash it exists to prevent.

Replace `RootComponent` in `src/routes/__root.tsx`. Note `className="dark"`
goes away: it matched no selector in the codebase and was already dead.

```tsx
/**
 * Runs before first paint. Duplicated verbatim in tauri.html — see the comment
 * there. Kept dependency-free and tiny on purpose; it cannot import prefs.ts
 * because a module fetch is exactly the delay that causes the flash.
 */
const THEME_BOOTSTRAP = `
try {
  var p = JSON.parse(localStorage.getItem("okf-workbench-prefs-v1") || "{}");
  var t = p.theme === "light" || p.theme === "dark" ? p.theme
    : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", t);
  if (typeof p.zoom === "number" && p.zoom >= 0.8 && p.zoom <= 2) {
    document.documentElement.style.setProperty("--okf-zoom", String(p.zoom));
  }
} catch (e) {}
`;

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="bg-bg text-fg antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add the same script to the desktop entry**

In `tauri.html`, immediately before `</head>`:

```html
    <script>
      // Duplicated from src/routes/__root.tsx by design: this must run before
      // first paint, and importing a module would cost a round trip and
      // reintroduce the flash of the wrong theme.
      try {
        var p = JSON.parse(localStorage.getItem("okf-workbench-prefs-v1") || "{}");
        var t =
          p.theme === "light" || p.theme === "dark"
            ? p.theme
            : matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
        document.documentElement.setAttribute("data-theme", t);
        if (typeof p.zoom === "number" && p.zoom >= 0.8 && p.zoom <= 2) {
          document.documentElement.style.setProperty("--okf-zoom", String(p.zoom));
        }
      } catch (e) {}
    </script>
```

- [ ] **Step 3: Verify no flash**

Run: `npm run dev`, set the OS to light mode, hard-reload.
Expected: the first painted frame is light. No dark flash.

- [ ] **Step 4: Commit**

```bash
git add src/routes/__root.tsx tauri.html
git commit -m "feat(theme): resolve theme before first paint in both entries (<ULID>)"
```

---

### Task 4: Store wiring and the header control

**Files:**
- Modify: `src/lib/okf/store.ts` (interface near `:47`, actions near `:343`, initial state near `:266`)
- Modify: `src/components/okf/Header.tsx`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: store fields `themePref: ThemePref`, `resolvedTheme: ResolvedTheme`,
  `zoom: number`; actions `cycleThemePref(): void`, `setZoom(z: number): void`,
  `syncSystemTheme(prefersDark: boolean): void`, `initPrefs(): void`.

- [ ] **Step 1: Add state and actions to the store**

Add to the `OkfState` interface:

```ts
  themePref: ThemePref;
  resolvedTheme: ResolvedTheme;
  zoom: number;

  initPrefs: () => void;
  cycleThemePref: () => void;
  setZoom: (z: number) => void;
  /** Re-resolve when the OS flips; a no-op unless the preference is system. */
  syncSystemTheme: (prefersDark: boolean) => void;
```

Import at the top:

```ts
import {
  applyPrefs,
  cycleTheme,
  defaultPrefs,
  loadPrefs,
  resolveTheme,
  savePrefs,
  type ResolvedTheme,
  type ThemePref,
} from "./prefs";
```

Initial state — defaults only, never a `loadPrefs()` call. The store module is
evaluated during SSR where `localStorage` does not exist, and seeding from
storage here would also make the server and client render different markup:

```ts
  themePref: defaultPrefs().theme,
  resolvedTheme: "dark",
  zoom: defaultPrefs().zoom,
```

Actions:

```ts
  initPrefs: () => {
    if (typeof window === "undefined") return;
    const prefs = loadPrefs();
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = resolveTheme(prefs.theme, prefersDark);
    applyPrefs(document.documentElement, resolved, prefs.zoom);
    set({ themePref: prefs.theme, resolvedTheme: resolved, zoom: prefs.zoom });
  },

  cycleThemePref: () => {
    const next = cycleTheme(get().themePref);
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = resolveTheme(next, prefersDark);
    applyPrefs(document.documentElement, resolved, get().zoom);
    savePrefs({ theme: next, zoom: get().zoom });
    set({ themePref: next, resolvedTheme: resolved });
  },

  setZoom: (zoom) => {
    applyPrefs(document.documentElement, get().resolvedTheme, zoom);
    savePrefs({ theme: get().themePref, zoom });
    set({ zoom });
  },

  syncSystemTheme: (prefersDark) => {
    if (get().themePref !== "system") return;
    const resolved = resolveTheme("system", prefersDark);
    applyPrefs(document.documentElement, resolved, get().zoom);
    set({ resolvedTheme: resolved });
  },
```

- [ ] **Step 2: Add the header button**

Import `Moon`, `Sun`, `MonitorCog` from `lucide-react` alongside the existing
icons, and `themeLabel` from `@/lib/okf/prefs`. Insert as the first child of
the right-hand cluster at `Header.tsx:74`, before the Learn button:

```tsx
        <button
          type="button"
          className="btn btn-ghost"
          onClick={cycleThemePref}
          data-testid="theme-toggle"
          data-theme-pref={themePref}
          aria-label={themeLabel(themePref, resolvedTheme)}
          title={themeLabel(themePref, resolvedTheme)}
        >
          {themePref === "system" ? (
            <MonitorCog className="size-3.5" aria-hidden />
          ) : themePref === "light" ? (
            <Sun className="size-3.5" aria-hidden />
          ) : (
            <Moon className="size-3.5" aria-hidden />
          )}
        </button>
```

With the selectors:

```tsx
  const themePref = useOkfStore((s) => s.themePref);
  const resolvedTheme = useOkfStore((s) => s.resolvedTheme);
  const cycleThemePref = useOkfStore((s) => s.cycleThemePref);
```

The accessible name carries state *and* next action because a single icon
cannot convey a three-state cycle. `data-theme-pref` gives the e2e tests
something to assert against that is not an icon glyph.

- [ ] **Step 3: Boot preferences and subscribe to OS changes**

In `AppShell.tsx`, alongside the existing `init` effect:

```tsx
  const initPrefs = useOkfStore((s) => s.initPrefs);
  const syncSystemTheme = useOkfStore((s) => s.syncSystemTheme);

  useEffect(() => {
    initPrefs();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => syncSystemTheme(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [initPrefs, syncSystemTheme]);
```

- [ ] **Step 4: Verify by hand**

Run: `npm run dev`. Click the toggle three times.
Expected: system → light → dark → system, repainting each time, and the choice
survives a reload.

- [ ] **Step 5: Commit**

```bash
git add src/lib/okf/store.ts src/components/okf/Header.tsx src/components/okf/AppShell.tsx
git commit -m "feat(theme): cycling theme control wired through the store (<ULID>)"
```

---

### Task 5: Zoom keybindings and the thirteen pixel literals

**Files:**
- Modify: `src/components/okf/AppShell.tsx` (the keydown effect at `:30-39`, the status bar at `:74-82`)
- Modify: `ClassifyPanel.tsx:190`, `EditorPane.tsx:167`, `DeepAgentPanel.tsx:138,166,192`, `ExplorerPanel.tsx:102`, `IntegrationsPanel.tsx:170,210,213`, `Header.tsx:34`, `SearchPanel.tsx:69`, `Sidebar.tsx:220,268`

**Interfaces:**
- Consumes: `stepZoom`, `ZOOM_STEPS` from Task 1; `setZoom`, `zoom` from Task 4.
- Produces: nothing downstream.

- [ ] **Step 1: Convert the pixel literals to rem**

Root-font-size zoom reaches everything in `rem`. These thirteen would stay
pinned while the interface grew around them. At the default zoom the rendered
output is byte-identical.

| Replace | With |
|---|---|
| `text-[10px]` | `text-[0.625rem]` |
| `text-[11px]` | `text-[0.6875rem]` |
| `text-[13px]` | `text-[0.8125rem]` |

```bash
# Scoped to text-[Npx] only: other px literals (borders, shadows, fixed
# widths) are deliberately not scaled.
sed -i '' \
  -e 's/text-\[10px\]/text-[0.625rem]/g' \
  -e 's/text-\[11px\]/text-[0.6875rem]/g' \
  -e 's/text-\[13px\]/text-[0.8125rem]/g' \
  src/components/okf/*.tsx
```

Verify exactly 13 replacements and no stragglers:

```bash
grep -rc "text-\[0\.\(625\|6875\|8125\)rem\]" src/components/okf/*.tsx | awk -F: '{s+=$2} END {print s}'   # 13
grep -rn "text-\[[0-9]*px\]" src/components/okf/                                                            # empty
```

- [ ] **Step 2: Add the keydown handler**

Extend the existing effect in `AppShell.tsx`. Guarded by `isTauriRuntime()`:
in web mode `Cmd +/-` is the browser's own zoom, which Chrome already persists
per-origin, and hijacking it risks stacking two zooms if a browser declines
`preventDefault`.

```tsx
  const zoom = useOkfStore((s) => s.zoom);
  const setZoom = useOkfStore((s) => s.setZoom);

  useEffect(() => {
    // Desktop only: WKWebView has no native zoom, which is the whole reason
    // this exists. The browser already does this job, and better.
    if (!isTauriRuntime()) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      // "=" is the unshifted key that carries "+" on a US layout; both arrive
      // depending on whether shift is held, so accept either.
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom(stepZoom(zoom, 1));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom(stepZoom(zoom, -1));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, setZoom]);
```

Import `stepZoom` from `@/lib/okf/prefs` and `isTauriRuntime` from
`@/lib/platform/storage`.

- [ ] **Step 3: Show the level in the status bar**

Only when it is not 100% — a permanent "100%" is noise. Add to the right-hand
group of the footer, before the loading indicator:

```tsx
          {zoom !== 1 && (
            <span className="text-fg-muted" data-testid="zoom-level">
              {Math.round(zoom * 100)}%
            </span>
          )}
```

- [ ] **Step 4: Verify**

Run: `npm run tauri:dev`. Press `Cmd+=` four times, then `Cmd+0`.
Expected: text grows through 110/125/150/175%, the status bar tracks it, and
`Cmd+0` returns to 100% with the readout disappearing.

Run: `npm run dev` in a browser. Press `Cmd+=`.
Expected: the browser's own zoom, unchanged — the app does not interfere.

- [ ] **Step 5: Commit**

```bash
git add src/components/okf/
git commit -m "feat(zoom): desktop font zoom with rem-safe type scale (<ULID>)"
```

---

### Task 6: End-to-end coverage

**Files:**
- Modify: `e2e/layout.spec.ts`
- Create: `e2e-desktop/specs/zoom.e2e.ts`

**Interfaces:**
- Consumes: `data-testid="theme-toggle"`, `data-theme-pref`, `data-testid="zoom-level"`.
- Produces: nothing.

- [ ] **Step 1: Add theme rows to the web suite**

```ts
test("theme toggle cycles system, light, and dark without console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await gotoApp(page);
  const toggle = page.getByTestId("theme-toggle");
  const html = page.locator("html");

  // The starting preference depends on the runner's OS setting, so cycle to a
  // known state rather than assuming one.
  while ((await toggle.getAttribute("data-theme-pref")) !== "system") {
    await toggle.click();
  }

  for (const expected of ["light", "dark"]) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-theme-pref", expected);
    await expect(html).toHaveAttribute("data-theme", expected);
  }

  // The accessible name must name both the state and the next action; an icon
  // alone cannot convey a three-state cycle.
  await expect(toggle).toHaveAccessibleName("Theme: dark. Switch to system.");

  await toggle.click();
  await expect(toggle).toHaveAttribute("data-theme-pref", "system");

  expect(errors).toEqual([]);
});

test("the light theme actually repaints the surface", async ({ page }) => {
  await gotoApp(page);
  const toggle = page.getByTestId("theme-toggle");
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  while ((await page.locator("html").getAttribute("data-theme")) !== "dark") {
    await toggle.click();
  }
  const dark = await bg();

  while ((await page.locator("html").getAttribute("data-theme")) !== "light") {
    await toggle.click();
  }
  // Catches a missing `inline` on @theme, where the attribute flips but every
  // utility class keeps its baked-in colour.
  expect(await bg()).not.toBe(dark);
});
```

- [ ] **Step 2: Run the web suite**

Run: `npm run test:e2e -- layout.spec.ts`
Expected: 7 passed.

- [ ] **Step 3: Write the desktop zoom spec**

```ts
/**
 * Zoom exists only in the desktop runtime — web mode defers to the browser's
 * own zoom — so this is the only tier that can test it at all.
 */
import { browser, $, expect } from "@wdio/globals";

const rootFontSize = () =>
  browser.execute(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

async function zoom(key: string, times = 1) {
  for (let i = 0; i < times; i++) await browser.keys(["Meta", key]);
}

describe("desktop zoom", () => {
  before(async () => {
    await $("[data-testid='app-header']").waitForExist({ timeout: 60_000 });
    await $("[role='option']").waitForDisplayed({ timeout: 60_000 });
  });

  afterEach(async () => {
    await zoom("0");
  });

  it("grows and shrinks the root font size", async () => {
    const base = await rootFontSize();
    await zoom("=");
    expect(await rootFontSize()).toBeGreaterThan(base);
    await zoom("-", 2);
    expect(await rootFontSize()).toBeLessThan(base);
  });

  it("resets to 100% on Cmd+0", async () => {
    const base = await rootFontSize();
    await zoom("=", 3);
    await zoom("0");
    expect(await rootFontSize()).toBeCloseTo(base, 1);
  });

  it("keeps every control inside the window at maximum zoom", async () => {
    // The web suite's viewport-escape check runs at 100% only, so this is the
    // sole guard against the rem-based grid pushing main off-screen at 2.0.
    await zoom("=", ZOOM_PRESSES_TO_MAX);
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
  });
});

// ZOOM_STEPS has 8 entries and 1.0 sits at index 2, so six presses reach 2.0.
const ZOOM_PRESSES_TO_MAX = 6;
```

- [ ] **Step 4: Run the desktop suite**

Run: `npm run tauri:build:automation && npm run test:desktop`
Expected: 5 passed (2 existing shell tests + 3 zoom tests).

- [ ] **Step 5: Commit**

```bash
git add e2e/layout.spec.ts e2e-desktop/specs/zoom.e2e.ts
git commit -m "test: theme and zoom coverage across web and desktop tiers (<ULID>)"
```

---

### Task 7: Update the editor spec and verify the whole change

**Files:**
- Modify: `docs/designs/ui-editor.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Extend the element inventory**

The inventory is a contract — a control listed there and missing from the DOM
blocks the merge — so the new button must appear in it. Add:

| Element | Selector | Notes |
|---|---|---|
| Theme toggle | `[data-testid="theme-toggle"]` | Cycles system → light → dark. Accessible name states current state and next action. |
| Zoom readout | `[data-testid="zoom-level"]` | Status bar, desktop only, hidden at 100%. |

Add two rubric rows under **Must match**:

| # | Criterion | Check |
|---|---|---|
| 11 | The theme toggle cycles all three states and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 12 | Switching to light actually changes the computed body background | `layout.spec.ts › the light theme actually repaints the surface` |

Add to **Acceptable differences**: "Either theme. The rubric's visual rows are
judged within a theme, never across the two."

Bump `git_hash` in the frontmatter to the current HEAD.

- [ ] **Step 2: Run the full gate**

Run: `npm run verify && npm run lint && npm run format:check`
Expected: all green.

- [ ] **Step 3: Refresh the work log and commit**

```bash
./bin/worklog roadmap-render && ./bin/worklog ia-inventory && ./bin/worklog ia-render
git add docs/ .work/
git commit -m "docs(ui-editor): inventory and rubric rows for the theme control (<ULID>)"
```

---

## Self-Review

**Spec coverage.** §2.1 → Task 2. §2.2 → Task 4 (`syncSystemTheme`). §2.3 →
Task 2. §2.4 → Task 4. §2.5 → Task 3. §3.1 → Tasks 2 and 5. §3.2 → Task 5.
§3.3 → Task 5. §4 → Tasks 1 and 4. §5 → Tasks 1 and 6. §6 → separate plan.
§7 PR A → this plan.

**Type consistency.** `ThemePref`, `ResolvedTheme`, `Prefs`, `ZOOM_STEPS`,
`stepZoom`, `cycleTheme`, `resolveTheme`, `themeLabel`, `applyPrefs`,
`loadPrefs`, `savePrefs` are defined in Task 1 and used with those exact names
in Tasks 3, 4, 5 and 6. Store actions `initPrefs`, `cycleThemePref`, `setZoom`,
`syncSystemTheme` are declared and implemented in Task 4 and consumed in
Tasks 4 and 5.

**Known gap, accepted.** The 66 non-font `px` literals in `styles.css` —
paddings, fixed widths, borders — do not scale with zoom. Borders should not.
Some paddings arguably should, and at 2.0 the interface is tighter than a true
proportional zoom would be. Task 6's viewport-containment test is what keeps
that from becoming a broken layout rather than merely a dense one. Converting
the paddings is a follow-up, not part of this change.

---

## Tasks

Deliberately the last section: `plan-capture` reads every `- [ ]` under this
heading to the end of the file, so placing it above the task bodies would
capture each individual step as its own work item.

- [ ] Pure preference logic in prefs.ts
  Resolve, cycle, clamp, persist, and one DOM writer. Twelve vitest cases
  covering clamping at both ends, off-grid snapping, and per-field recovery
  from a corrupt stored value.
- [ ] Two-layer palette in styles.css
  A --okf-* variable layer for light and dark that @theme inline points at, so
  a data-theme attribute re-themes every existing utility class without
  touching a component. Adds the zoom variable to the root font size.
- [ ] Resolve the theme before first paint
  An inlined head script in both the SSR shell and the desktop HTML entry.
  Without it, web mode paints a frame in the wrong theme before JavaScript
  runs.
- [ ] Theme control wired through the store
  Store state and actions, the cycling header button whose accessible name
  states both current state and next action, and a prefers-color-scheme
  listener that re-resolves while the preference is system.
- [ ] Desktop font zoom
  Cmd +, Cmd -, and Cmd 0 guarded by isTauriRuntime, the status-bar readout,
  and the thirteen text-[Npx] literals converted to rem so they scale with
  everything else.
- [ ] Theme and zoom end-to-end coverage
  Two Playwright rows including one that catches a missing inline on @theme,
  and three WebdriverIO rows including viewport containment at maximum zoom —
  which the web suite cannot check because it only ever runs at 100%.
- [ ] Editor spec inventory and rubric rows
  The element inventory is a merge gate, so the new controls must appear in
  it. Adds two rubric rows and bumps the spec git_hash.
