---
wiki_key: design/ui-explorer
doc_type: design
truth_state: current
git_hash: d3d7c7a
title: "UI spec — Explorer view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Explorer
---

# UI spec — Explorer view

The Explorer is the bundle at a glance: identity and validation state at the
top, the neighborhood graph in the middle, then every concept grouped by
directory. It answers "what is in here and is it healthy" before any editing
starts.

Reached by `nav-explorer`; `main[data-view]` reads `explorer` while mounted.

**Wireframe:** ![explorer wireframe](ui-explorer.png)

The wireframe is authoritative for exactly three things: the **element
inventory** below, **containment and reading order** (header spans the top;
sidebar left of main; status bar last), and **ordinal sequence**. It is **not**
authoritative for pixels, spacing, colour, typography, icons, or density — it
draws monochrome boxes and the real UI is a dense workbench. Never diff a
screenshot against it.

## Element inventory

This table is a contract. Adding or removing a control means updating this spec
and its `git_hash` in the same commit. A control listed here and absent from
the DOM blocks the merge.

| Region | Element | Addressable by |
|---|---|---|
| header | brand, search, view-mode toggle, theme toggle, Learn / Open / Classify / Save | see `ui-editor.md` |
| sidebar | 7 nav items in order: Learn OKF, Explorer, Editor, Graph & Search, Classify, DeepAgents, Plugins & MCP | `nav-learn` … `nav-integrations` |
| sidebar | bundle name, validation badge, file filter, nested file tree | `role="listbox"` / `role="option"` |
| main | bundle name as page heading | `h1` — data-driven |
| main | source URL, when the bundle came from GitHub | link |
| main | concept count, edge count, validation badge | badge text |
| main | type-distribution badges (Index · 7, Reference · 3, …) | badge text |
| main | focus heading — “Focus: &lt;path&gt;” | `h2` |
| main | neighborhood graph | `role="img"` name `OKF concept graph` |
| main | catalog groups, one per directory, each a card | `h3` |
| main | one button per concept inside its group | button text = title + path |
| status | concept/edge counts, selected path, dirty marker, zoom level | `app-status`, `zoom-level` |

## Rubric — Explorer view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `explorer` after clicking `nav-explorer` | `views.spec.ts › explorer view renders its documented structure` |
| 3 | The documented `h1` and section headings are present, and the panel-card count meets the inventory minimum | `views.spec.ts › explorer view renders its documented structure` |
| 4 | Zero console or page errors on mount | `views.spec.ts › explorer view renders its documented structure` |
| 5 | No interactive element escapes sideways at 1280×800 | `views.spec.ts › no view lets an interactive element escape sideways` |
| 6 | The theme toggle cycles and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 7 | Catalog groups are ordered so `(root)` sits with its siblings, not first | agent |
| 8 | The validation badge is legible against the elevated surface | agent |
| 9 | Graph node labels do not overlap illegibly at the default hop count | agent |

### Acceptable differences

- Any spacing, font size, radius, shadow, or colour value.
- Icon choice, provided the accessible name is unchanged.
- Deliberate truncation on paths, badges, and the status bar.
- Wireframe geometry and proportion. Topology and inventory only.
- Dynamic content: concept counts, edge counts, timestamps, and anything driven
  by the loaded bundle rather than by the code.
- Either theme. Visual rows are judged **within** a theme, never across the two:
  light and dark are different palettes, not a defect in one of them.
- Any zoom level. Density at 200% is not a finding; a control that has become
  unreachable is.

### Failure criteria

- Any Must-match row with a named Check failing → **blocks merge**.
- A control listed in the element inventory and absent from the DOM → **blocks merge**.
- Any `agent` row failing → comment on the PR; does **not** block.

## Known gaps

Tracked separately, deliberately not fixed by writing this spec:

- **Graph labels overlap** at the default layout when a hub concept has many
  neighbours; the radial placement does not repel text.
- Concept buttons carry no `data-testid`, so tests address them by accessible
  name, which is the title concatenated with the path.
- The type-distribution badges are not interactive; a user reasonably expects
  clicking `AgentNode · 2` to filter.
