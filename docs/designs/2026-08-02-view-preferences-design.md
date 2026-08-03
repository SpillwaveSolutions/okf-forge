---
wiki_key: design/2026-08-02-view-preferences-design
doc_type: design
truth_state: current
git_hash: e5e5be6
title: "Design — view preferences (theme + zoom)"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-2026-08-02-View-Preferences
---

# Design — view preferences (theme + zoom)

Two user-facing features and one documentation backfill:

1. A **light / dark / system** theme toggle, defaulting to the OS setting.
2. **`Cmd +` / `Cmd -` / `Cmd 0` font zoom** on desktop, remembered across launches.
3. **UI specs, wireframes, and rubrics for all six remaining views**, matching
   the `ui-editor.md` template.

Items 1 and 2 ship together (same files, same state module). Item 3 touches no
source and ships separately.

---

## 1. Current state

`src/styles.css` is dark-only by construction. A Tailwind v4 `@theme` block
holds twenty hardcoded hex tokens, with `color-scheme: dark` and
`font-size: 16px` on `html`. There is no `.dark` class selector, no
`prefers-color-scheme` block, and no `data-theme` attribute anywhere.

`src/routes/__root.tsx:25` carries `className="dark"`, which matches no
selector in the codebase. It is vestigial and gets replaced.

The Zustand store itself holds no persisted state — no `localStorage` calls, no
`persist` middleware. It does, however, delegate to one: `integrations.ts:167`
owns `okf-workbench-integrations-v1`, read through a `loadIntegrations()` /
`saveIntegrations()` pair that guards `typeof localStorage === "undefined"` for
SSR and falls back to defaults inside a `try`/`catch`. That is the house
pattern, and `prefs.ts` follows it rather than inventing a second convention.

Zoom, by contrast, is mostly pre-wired: `styles.css` uses `rem` in 64 places,
and the 59 Tailwind `text-xs` / `text-sm` / `text-lg` / `text-xl` usages are
rem-based by default. Both scale off the root font-size for free.

---

## 2. Theme

### 2.1 The variable indirection

Tailwind v4 emits `@theme` variables as real custom properties, but a utility
class compiled from `--color-bg` resolves that variable **once, at `:root`**.
Overriding `--color-bg` under an attribute selector therefore has no effect on
`bg-bg` — the theme silently fails to switch.

The documented fix is `@theme inline`, which makes Tailwind emit the
indirection rather than the resolved value. That requires a second variable
layer:

```css
:root,
:root[data-theme="light"] {
  --okf-bg: #ffffff;
  --okf-fg: #1f2328;
  /* … 20 tokens … */
}

:root[data-theme="dark"] {
  --okf-bg: #0d1117;
  --okf-fg: #e6edf3;
  /* … today's values … */
}

@theme inline {
  --color-bg: var(--okf-bg);
  --color-fg: var(--okf-fg);
  /* … */
}
```

Component code is untouched: `bg-bg` and `text-fg` keep working and now follow
the attribute.

### 2.2 "System" is resolved in JavaScript, never in CSS

Expressing `system` as a `@media (prefers-color-scheme: dark)` block would mean
maintaining the dark palette in two places, and the two copies would drift.

Instead, JavaScript resolves the three-state preference down to a concrete
`data-theme="light" | "dark"` on `<html>`. CSS only ever sees two states. A
`matchMedia("(prefers-color-scheme: dark)")` listener re-resolves when the OS
setting changes, and is active only while the stored preference is `system`.

### 2.3 Palette

The existing dark values are GitHub's dark palette (`#0d1117`, `#58a6ff`,
`#3fb950`). The light values are therefore GitHub Primer light — the coherent
sibling, already contrast-audited.

| Token | Dark (today) | Light (new) |
|---|---|---|
| `bg` | `#0d1117` | `#ffffff` |
| `bg-elevated` | `#161b22` | `#f6f8fa` |
| `bg-subtle` | `#21262d` | `#eff2f5` |
| `bg-hover` | `#30363d` | `#e6eaef` |
| `fg` | `#e6edf3` | `#1f2328` |
| `fg-muted` | `#8b949e` | `#59636e` |
| `fg-subtle` | `#6e7681` | `#818b98` |
| `border` | `#30363d` | `#d1d9e0` |
| `border-strong` | `#484f58` | `#9198a1` |
| `primary` | `#58a6ff` | `#0969da` |
| `primary-fg` | `#0d1117` | `#ffffff` |
| `primary-muted` | `#58a6ff` @ 16% | `#0969da` @ 12% |
| `accent` / `success` | `#3fb950` | `#1a7f37` |
| `accent-fg` | `#0d1117` | `#ffffff` |
| `danger` | `#f85149` | `#d1242f` |
| `warning` | `#f0883e` | `#9a6700` |
| `info` | `#58a6ff` | `#0969da` |
| `card` | `#161b22` | `#ffffff` |
| `ring` | `#58a6ff` | `#0969da` |

Note that the `*-fg` tokens **invert direction**. They are the contrast
partner for a filled surface: dark theme puts near-black text on bright blue,
light theme puts white text on dark blue. Copying them across unchanged
produces unreadable buttons, and is the most likely mistake in this change.

Shadows are themed too. `rgb(0 0 0 / 0.4)` reads as a bruise on white:

| | Dark | Light |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.3)` | `0 1px 0 rgb(31 35 40 / 0.04)` |
| `shadow-md` | `0 4px 12px rgb(0 0 0 / 0.4)` | `0 3px 6px rgb(140 149 159 / 0.15)` |
| `shadow-lg` | `0 8px 24px rgb(0 0 0 / 0.5)` | `0 8px 24px rgb(140 149 159 / 0.2)` |

`color-scheme` follows the attribute so native scrollbars, form controls, and
the caret match.

### 2.4 The control

One button in the header's right-hand cluster, `data-testid="theme-toggle"`,
cycling `system → light → dark → system`. Its accessible name states both the
current preference and what a click will do ("Theme: system (dark). Switch to
light."), because an icon alone cannot convey a three-state cycle to a screen
reader. `data-theme-pref` on the button carries the raw preference so the e2e
tests assert against state rather than against an icon glyph.

The desktop build additionally shows the zoom level in the status bar when it
differs from 100%. There is no zoom button — the shortcuts are the interface.

### 2.5 The flash-of-wrong-theme trap

Web mode is server-rendered. The HTML arrives and paints before any JavaScript
runs, so a user whose preference is "light" sees a dark frame flash first.

The fix is a small synchronous script in the document head — before any
stylesheet-dependent paint — that reads `localStorage` and stamps the
attribute. It ships in both entries:

- `src/routes/__root.tsx` (SSR shell), replacing the dead `className="dark"`
- `tauri.html` (desktop SPA)

The script must not import anything. It is inlined, duplicated in two places,
and that duplication is deliberate: a shared module would be a network round
trip, which reintroduces the flash it exists to prevent.

---

## 3. Zoom

### 3.1 Mechanism

```css
html {
  font-size: calc(16px * var(--okf-zoom, 1));
}
```

Steps: `0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0`. `Cmd+=` steps up, `Cmd+-`
steps down, `Cmd+0` resets to `1.0`. Both ends clamp rather than wrap.

### 3.2 Desktop only

`Cmd +/-` is the browser's own zoom in web mode, and Chrome already persists it
per-origin. Fighting it buys nothing and risks stacking two zooms if a browser
declines `preventDefault()`. The handler is therefore guarded by
`isTauriRuntime()`, which is also the honest framing: WKWebView has no native
zoom, so this feature exists *because* the desktop runtime lacks what the
browser gives away.

### 3.3 The thirteen pixel literals

Root font-size scaling reaches everything expressed in `rem`. It does not reach
these, which would stay pinned while the interface grew around them:

| File | Class |
|---|---|
| `ClassifyPanel.tsx:190` | `text-[11px]` |
| `EditorPane.tsx:167` | `text-[13px]` |
| `DeepAgentPanel.tsx:138,166,192` | `text-[11px]` |
| `ExplorerPanel.tsx:102` | `text-[10px]` |
| `IntegrationsPanel.tsx:170,210,213` | `text-[11px]` |
| `Header.tsx:34` | `text-[10px]` |
| `SearchPanel.tsx:69` | `text-[10px]` |
| `Sidebar.tsx:220,268` | `text-[10px]` |

All convert to the rem equivalent (`10px` → `0.625rem`, `11px` → `0.6875rem`,
`13px` → `0.8125rem`). At the default zoom the rendered output is byte-identical.

Borders and shadows keep their pixel values on purpose. A 1px hairline should
stay 1px at 200%; scaling it produces a heavy, blurry frame.

---

## 4. Where the state lives

Pure logic goes in **`src/lib/okf/prefs.ts`** — resolve, cycle, clamp, step,
load, save. No React, no Zustand, no DOM beyond a single `applyPrefs(doc)`
writer. State itself lives in the Zustand store, which `CLAUDE.md` names as the
app's only state container.

This is the split the codebase already uses: `lib/okf/*` is pure and testable,
`store.ts` wires it, components consume it. It also means the branchy parts —
clamping at both ends, resolving `system`, recovering from a corrupt
`localStorage` value — are unit-testable without a DOM.

`localStorage` rather than Zustand's `persist` middleware: the middleware would
wrap the entire store, and the store holds parsed bundles and graph results
that must not be serialized. Two scalars do not justify it — and the codebase
already answers this question the same way in `integrations.ts`.

The storage key is `okf-workbench-prefs-v1`, matching the existing naming. A
corrupt or out-of-range stored value falls back to defaults rather than
throwing; a preferences read must never be able to prevent the app booting.

---

## 5. Testing

| Tier | Asserts | Gate |
|---|---|---|
| `src/lib/okf/prefs.test.ts` (vitest) | step clamping at both ends, cycle order, `system` resolution against a stubbed `matchMedia`, corrupt-value fallback, round trip | **required** |
| `e2e/layout.spec.ts` (playwright) | the toggle exists and is reachable; `data-theme` flips; `aria-pressed` / accessible name tracks state; zero console errors in **both** themes | **required** |
| `e2e-desktop/specs/zoom.e2e.ts` (wdio) | `Cmd+=` raises computed root font-size; `Cmd+0` resets; **nothing escapes the viewport at 2.0** | advisory |

The last row is the one that earns its keep. The existing viewport-escape test
runs at zoom `1.0` in web mode, so at `2.0` the rem-based grid could push
`main` off-screen and no required check would notice. It belongs in the desktop
tier because that is the only runtime where the feature exists at all — which
is exactly that tier's stated scope.

---

## 6. Specs and wireframes for the remaining six views

`ui-editor.md` is the template. Each of `learn`, `explorer`, `search`,
`classify`, `deepagent`, and `integrations` gets:

- `docs/designs/ui-<view>.md` — frontmatter (with the `wiki:` pin, without
  which `ia_render` maps the page onto `Code-Walkthrough`), acceptance
  criteria, and an **element inventory** that is a contract: a control listed
  there and absent from the DOM blocks the merge.
- `docs/designs/wireframes/ui-<view>.puml` and its rendered `.png`.
- A `## Rubric` section preserving the full structure:
  - **Must match** — rows with a named Check are the gate; rows marked `agent`
    are advice and never block. A merge blocked by model judgement has "the
    model was in a mood" as its failure mode.
  - **Acceptable differences** — spacing, colour, font size, radius, shadow,
    icon choice, wireframe geometry and proportion, and dynamic content.
    Without this section, any judge with a comparison instinct reports every
    pixel delta as a finding. Naming what does not matter is what makes the
    judgement usable.
  - **Failure criteria** — which rows block and which only comment.

The wireframes are authoritative for exactly three things: element inventory,
containment and reading order, and ordinal sequence. Not pixels, spacing,
colour, or density. A screenshot is never compared against a Salt render.

`ui-editor.md` also needs its element inventory extended with the new header
controls and its `git_hash` bumped in the same commit.

---

## 7. Delivery

**PR A — view preferences.** `prefs.ts` + its tests, the `styles.css`
restructure, the light palette, the head scripts in both entries, the header
toggle, the thirteen rem conversions, the two e2e additions, and the
`ui-editor.md` inventory update.

**PR B — spec backfill.** Six specs, six wireframes, six rubrics. No source
changes, so a red gate on one cannot block the other.

---

## 8. Out of scope

- A theme *editor* or user-supplied palettes. Two themes, fixed.
- Per-view or per-pane zoom. One global level.
- Syncing preferences between the web and desktop runtimes. `localStorage` is
  per-origin and per-machine, and that is the expected behavior.
- Zoom in web mode — the browser already does it, better.
- `role="tree"` conversion, the Sidebar collapse-on-save bug, and the stale
  README screenshots. Tracked separately.
