# Changelog

All notable changes to OKF Forge are recorded here. Dated sections are frozen:
corrections go in the next release's notes, never into a shipped section.

## 0.1.1 — unreleased

### Fixed

- **The e2e suite no longer writes into the tracked `public/sample-okf`
  fixture.** `webServer.env` reaches only a dev server Playwright spawns
  itself, and `reuseExistingServer` is on outside CI — so a dev server started
  by hand, which has no `OKF_WORKSPACE` and falls back to the fixture, was
  silently reused and `/api/fs/write` mutated tracked files. Nine had already
  been committed. A `globalSetup` now refuses to run at all when the server is
  serving a directory inside the repo.
- **The e2e scratch workspace is one directory, not one per process.** The
  config is loaded in the main process and again in every worker, so
  `mkdtempSync` handed each a different tree: the dev server served one while
  the workers believed in another, and every run orphaned the rest under
  `/tmp` (77 had accumulated). The path is now deterministic and reseeded only
  outside workers.
- Saving a file no longer collapses the sidebar tree. `recompute` rebuilds the
  concepts map, giving the memoized tree a new identity, and the effect that
  seeds expanded folders listed that identity in its dependencies.

### Added

- **`okff` — a shell launcher.** `okff [directory]` opens OKF Forge on that
  folder from any terminal, defaulting to the current directory. Install it
  from the new Settings view; it goes to `/usr/local/bin/okff`, which is
  already on the default macOS `PATH`, and asks for a password once only when
  that directory is not yours to write to. Each invocation opens its own
  window, so two workspaces can sit side by side. macOS only for now.
- **A Settings view**, eighth in the nav, holding the CLI installer. Theme and
  zoom stay in the header — a second place to change a setting is a second
  place for it to disagree with the first.
- The file tree is a real `role="tree"`: roving tabindex, arrow navigation,
  Home/End, typeahead, and `aria-level`/`setsize`/`posinset`. It was
  `role="listbox"` with directory buttons interleaved, which is invalid.
- Visible labels on the plugin and MCP fields, which previously showed their
  caption only as placeholder text.
- Accessible names on thirteen controls, and `aria-pressed` on the DeepAgents
  and Plugins & MCP tab strips.

### Corrections to 0.1.0

Released sections are frozen, so the fix is recorded here.

- **0.1.0's Known gaps wrongly stated that DMG bundling fails on macOS.** It
  does not. `npm run tauri:build` produces `OKFForge.app` and a checksum-valid
  `OKFForge_0.1.0_aarch64.dmg` that mounts and carries the conventional
  `/Applications` symlink. The `--no-bundle` flag on the automation build is a
  speed choice for the WebdriverIO binary, which is launched directly, and was
  mistaken for a workaround.

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
