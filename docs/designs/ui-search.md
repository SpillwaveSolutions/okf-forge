---
wiki_key: design/ui-search
doc_type: design
truth_state: current
git_hash: d3d7c7a
title: "UI spec — Graph & search view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Search
---

# UI spec — Graph & search view

Graph & search is the analysis surface: four independent graph operations
stacked as cards, each with its own inputs and its own result region. Nothing
here mutates the bundle — every card answers a question about it.

Reached by `nav-search`; `main[data-view]` reads `search` while mounted.

**Wireframe:** ![search wireframe](ui-search.png)

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
| sidebar | bundle name, validation badge, file filter, nested file tree | `role="tree"` / `role="treeitem"`, `data-kind`, `data-depth` |
| main | page heading — “Graph & search” | `h1` |
| main | graph search query field + Search | `aria-label="Graph search query"` |
| main | search results list | — |
| main | “Impact analysis” section | `h2` |
| main | impact target field + Compute impact | `aria-label="Impact target"` |
| main | “Progressive disclosure pack” section | `h2` |
| main | pack hops + max-nodes numeric inputs, Build pack | `input[type=number]` |
| main | “Neighborhood graph” section | `h2` |
| main | graph hops numeric input | `input[type=number]` |
| main | “Validation” section with error and warning lists | `h2` |
| status | concept/edge counts, selected path, dirty marker, zoom level | `app-status`, `zoom-level` |

## Rubric — Graph & search view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `search` after clicking `nav-search` | `views.spec.ts › search view renders its documented structure` |
| 3 | The documented `h1` and section headings are present, and the panel-card count meets the inventory minimum | `views.spec.ts › search view renders its documented structure` |
| 4 | Zero console or page errors on mount | `views.spec.ts › search view renders its documented structure` |
| 5 | No interactive element escapes sideways at 1280×800 | `views.spec.ts › no view lets an interactive element escape sideways` |
| 6 | The theme toggle cycles and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 7 | The four sections appear in this order: Impact, Pack, Neighborhood, Validation | `views.spec.ts › search view renders its documented structure` |
| 8 | Every visible control has an accessible name, in every sub-tab | `views.spec.ts › every control in every view has an accessible name` |
| 9 | Each `.view-toggle` strip marks exactly one button `aria-pressed="true"` | `views.spec.ts › every view-toggle strip marks exactly one button pressed` |
| 10 | The file tree is a `role="tree"` with one tab stop and working Arrow/Home/End/typeahead | `tree.spec.ts` |
| 11 | Empty result regions read as “not run yet”, not as “no results” | agent |
| 12 | The three numeric inputs are visibly associated with their card | agent |

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

- The three `input[type=number]` controls sit beside visible `<label>` elements
  that are not associated via `htmlFor`. They now carry an `aria-label`, so the
  name is correct, but the visible label is still decorative markup.
- Search results and impact results are plain lists with no landmark, so a
  screen-reader user gets no announcement when a result set changes.
