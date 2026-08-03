---
wiki_key: design/ui-settings
doc_type: design
truth_state: current
git_hash: 6cd5b53
title: "UI spec — Settings view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Settings
---

# UI spec — Settings view

Settings holds workbench configuration that is neither graph state nor bundle
state. Today that is one thing: installing the `okff` shell command, which puts
`okff [directory]` on the user's `PATH` so a workspace can be opened from a
terminal instead of a folder picker.

Theme and zoom deliberately do **not** move here. Both already have direct
controls — the header toggle and `⌘ +` / `⌘ -` — and a second place to change
a setting is a second place for it to disagree with the first. The view says
where they live rather than duplicating them.

Reached by `nav-settings`; `main[data-view]` reads `settings` while mounted.

**Wireframe:** ![settings wireframe](ui-settings.png)

The wireframe is authoritative for exactly three things: the **element
inventory** below, **containment and reading order** (header spans the top;
sidebar left of main; status bar last), and **ordinal sequence**. It is **not**
authoritative for pixels, spacing, colour, typography, icons, or density — it
draws monochrome boxes and the real UI is a dense workbench. Never diff a
screenshot against it.

## Runtime split

This is the only view whose control set depends on the runtime, so the two
cases are specified separately rather than as one inventory with caveats.

| | Web | Desktop |
|---|---|---|
| Heading, description, usage block | shown | shown |
| Explanation that the CLI is desktop-only | shown (`cli-web-note`) | absent |
| Install / Reinstall / Replace button | **absent** | shown (`cli-install`) |
| Remove button | absent | shown when ours is installed (`cli-uninstall`) |

The web build renders no button at all rather than a disabled one. There is no
degraded path to offer: `install_cli` writes to `/usr/local/bin`, which a
browser cannot do under any permission model, so a greyed-out control would be
a dead end dressed as a feature.

## Install states

`cli_status` answers three booleans and the desktop card reads all three. The
`managed` flag exists so a hand-written `okff` is never overwritten silently.

| `installed` | `managed` | `current` | What the card says | Primary button |
|---|---|---|---|---|
| false | — | — | not installed; names the path and warns about the one password prompt | Install okff |
| true | false | — | something else is already there; replacing overwrites it | Replace it |
| true | true | false | installed but pointing at an older app location | Reinstall |
| true | true | true | installed, with the path | Install (disabled) + Remove |

## Element inventory

This table is a contract. Adding or removing a control means updating this spec
and its `git_hash` in the same commit. A control listed here and absent from
the DOM blocks the merge.

| Region | Element | Addressable by |
|---|---|---|
| header | brand, search, view-mode toggle, theme toggle, Learn / Open / Classify / Save | see `ui-editor.md` |
| sidebar | 8 nav items in order: Learn OKF, Explorer, Editor, Graph & Search, Classify, DeepAgents, Plugins & MCP, Settings | `nav-learn` … `nav-settings` |
| sidebar | bundle name, validation badge, file filter, nested file tree | `role="tree"` / `role="treeitem"`, `data-kind`, `data-depth` |
| main | page heading — “Settings” | `h1` |
| main | section heading — “Command line” | `h2`, `aria-labelledby="cli-heading"` |
| main | usage block showing `okff .`, `okff ~/my-okf`, `okff --help` | `pre > code` |
| main | current install state, one of the four rows above | `cli-state` (desktop) / `cli-web-note` (web) |
| main | install / reinstall / replace | `cli-install` (desktop only) |
| main | remove | `cli-uninstall` (desktop, managed install only) |
| main | error text from a refused or cancelled install | `cli-error`, `role="alert"` |
| main | note that each `okff` opens its own window and windows share preferences | — |
| status | concept/edge counts, selected path, dirty marker, zoom level | `app-status`, `zoom-level` |

## Rubric — Settings view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `settings` after clicking `nav-settings` | `views.spec.ts › settings view renders its documented structure` |
| 3 | The documented `h1` and “Command line” heading are present, and the panel-card count meets the inventory minimum | `views.spec.ts › settings view renders its documented structure` |
| 4 | Zero console or page errors on mount | `views.spec.ts › settings view renders its documented structure` |
| 5 | No interactive element escapes sideways at 1280×800 | `views.spec.ts › no view lets an interactive element escape sideways` |
| 6 | The web build shows the desktop-only note and renders no install button | `views.spec.ts › settings offers no CLI install in the browser` |
| 7 | The usage block is present in both runtimes | `views.spec.ts › settings offers no CLI install in the browser` |
| 8 | Every visible control has an accessible name | `views.spec.ts › every control in every view has an accessible name` |
| 9 | The theme toggle cycles and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 10 | `cli_status`, `install_cli`, and `uninstall_cli` keep the names Rust declares | `src/lib/platform/cli.test.ts` |
| 11 | The shim quotes its app path and tries the bundle id before the path | `src-tauri/src/cli.rs › tests` |
| 12 | The install state is legible without reading the button label | agent |
| 13 | The usage block reads as a terminal, distinct from surrounding prose | agent |
| 14 | Remove is visually subordinate to Install | agent |

### Acceptable differences

- Any spacing, font size, radius, shadow, or colour value.
- Icon choice, provided the accessible name is unchanged.
- Deliberate truncation on paths, badges, and the status bar.
- Wireframe geometry and proportion. Topology and inventory only.
- Dynamic content: the install path, concept counts, and anything driven by the
  runtime rather than by the code.
- Either theme. Visual rows are judged **within** a theme, never across the two:
  light and dark are different palettes, not a defect in one of them.
- Any zoom level. Density at 200% is not a finding; a control that has become
  unreachable is.
- The desktop card showing a different one of the four install states than a
  reference screenshot. State depends on the host machine, not on the code.

### Failure criteria

- Any Must-match row with a named Check failing → **blocks merge**.
- A control listed in the element inventory and absent from the DOM → **blocks merge**.
- Any `agent` row failing → comment on the PR; does **not** block.

## Known gaps

Tracked separately, deliberately not fixed by writing this spec:

- **Two windows share one preferences store.** `okff` opens an independent
  instance per invocation, but both processes load the same `localStorage`
  origin, so a theme or zoom change in one window does not reach the other
  until that window reloads, and the last write wins. This is the accepted cost
  of the multi-instance choice; the card says so on the page rather than only
  here.
- **Install is macOS-only.** The shim calls `open(1)` and escalation goes
  through `osascript`. Windows and Linux return an explicit "macOS-only" error
  rather than pretending to work. No packaged build exists for either platform
  yet, so there is nothing to install to.
- **`cli_status` is read once per mount.** Deleting the shim from a terminal
  while the view is open leaves the card stale until you navigate away and
  back. A watcher for one file that changes twice in a product's lifetime is
  not worth its wakeups.
- **No test drives a real install.** `install_cli` writes to `/usr/local/bin`
  and may prompt for a password; nothing in CI can assert on that. The unit
  tiers cover shim rendering and the IPC names, and the install itself is
  verified by hand — `okff .` in a real shell — before release.
