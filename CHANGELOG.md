# Changelog

All notable changes to OKF Forge are recorded here. Dated sections are frozen:
corrections go in the next release's notes, never into a shipped section.

## 0.1.0 — 2026-08-03

First tagged release. The application already existed — this is the release
that makes it verifiable, themeable, and reproducible.

### Added

- **Light / dark / system theme.** A cycling header control, defaulting to the
  OS setting and following it live while the preference is `system`. The
  palette is a two-layer set of CSS variables that `@theme inline` points at,
  so switching a `data-theme` attribute re-themes every existing utility class
  without touching a component. Light values are GitHub Primer light, the
  sibling of the GitHub dark palette the app already used.
- **Desktop font zoom.** `Cmd +`, `Cmd -`, and `Cmd 0` across eight steps from
  80% to 200%, with the level shown in the status bar when it is not 100%.
  Desktop only: WKWebView has no native zoom, which is why this exists, while
  a browser already does the job and persists it per-origin.
- Both preferences persist in `localStorage` and are resolved before first
  paint, so there is no flash of the wrong theme on load.
- **Desktop end-to-end tier.** WebdriverIO driving the real Tauri window
  through an embedded WebDriver server, behind an opt-in `automation` cargo
  feature so release builds do not contain it. Playwright cannot drive Tauri
  on macOS at all — only Windows' WebView2 speaks CDP.
- **Vitest tier** for component and integration tests that need a DOM,
  alongside the existing `node:test` tier for pure functions.
- **CI quality gates.** `checks`, `e2e`, and `rust` jobs, required on `main`
  together with the existing `invariants` job. Branch protection refuses
  force-pushes and deletion.
- **UI specification workflow.** `docs/designs/ui-editor.md` pairs an element
  inventory that is a merge contract with a rubric split into gate rows (each
  naming a real test) and `agent` rows that are advice and never block.
- **Deterministic dev port.** `scripts/dev-port.mjs` probes for a free port at
  or above 8080, remembers it, and verifies a reused port is serving *this*
  app. Several Tauri projects share this machine and all ship the same default
  port; a collision previously made Playwright's `reuseExistingServer` run the
  whole suite against another project's application.

### Fixed

- `main` did not typecheck: five errors in `AppShell.tsx` from camelCase
  property access against a snake_case `ValidateResult`.
- The end-to-end suite had never passed. Three specs raced server-rendered
  markup, clicking real, enabled elements before React had attached a handler.
  All navigation now goes through `gotoApp()`, which waits for hydration.
- Seven lint errors, two of which passed in CI and failed on every developer
  machine because `src-tauri/target/**` was missing from the eslint ignores.
- `GraphCanvas` hardcoded nine dark-palette colours as SVG attributes, which
  would have rendered the graph near-white on white in light mode.
- Two header controls fell off the right edge at 200% zoom. The header now
  scrolls horizontally rather than clipping, and is inert at 100%.

### Changed

- The repository is formatted with Prettier and gated on it. This touched 47
  files; the export had never been formatted.
- `AGENTS.md` is a symlink to `CLAUDE.md`, so Codex, Grok, and OpenCode read
  the same onboarding document.

### Known gaps

- The `prefers-color-scheme` change listener has no automated coverage:
  driving a live OS theme flip needs CDP emulation the Playwright config does
  not set up. The resolution function it calls is unit-tested.
- Non-font pixel literals in `styles.css` — paddings and fixed widths — do not
  scale with zoom, so the interface is denser at 200% than a true proportional
  zoom would be. Borders deliberately do not scale.
- Six of the seven views have no UI specification or wireframe yet. They are
  covered only by the generic structural checks and a mount-without-errors
  test.
- DMG bundling fails on macOS in this environment (`bundle_dmg.sh`), so the
  desktop build is verified with `--no-bundle`.
