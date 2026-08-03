---
wiki_key: design/ui-integrations
doc_type: design
truth_state: current
git_hash: 6cd5b53
title: "UI spec — Plugins & MCP view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Integrations
---

# UI spec — Plugins & MCP view

Plugins & MCP configures which Claude Code plugins and MCP servers the
workspace declares, and exports that configuration. Everything on this view
persists to `localStorage` rather than to the bundle — it is machine state, not
graph state.

Reached by `nav-integrations`; `main[data-view]` reads `integrations` while mounted.

**Wireframe:** ![integrations wireframe](ui-integrations.png)

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
| sidebar | 8 nav items in order: Learn OKF, Explorer, Editor, Graph & Search, Classify, DeepAgents, Plugins & MCP, Settings | `nav-learn` … `nav-settings` |
| sidebar | bundle name, validation badge, file filter, nested file tree | `role="tree"` / `role="treeitem"`, `data-kind`, `data-depth` |
| main | page heading — “Plugins & MCP” | `h1` |
| main | mode strip: Claude plugins, MCP servers, Export config | button text |
| main | one card per plugin: enable checkbox, name, delete, then labelled Source and Description fields | `.panel-card`, `label[for]` |
| main | Add plugin | button text |
| main | one card per MCP server: enable, name, transport, delete, then labelled Command + Arguments (stdio) or URL | `.panel-card`, `label[for]` |
| main | Add MCP server | button text |
| main | generated settings snippet under Export config | — |
| status | concept/edge counts, selected path, dirty marker, zoom level | `app-status`, `zoom-level` |

## Rubric — Plugins & MCP view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `integrations` after clicking `nav-integrations` | `views.spec.ts › integrations view renders its documented structure` |
| 3 | The documented `h1` and section headings are present, and the panel-card count meets the inventory minimum | `views.spec.ts › integrations view renders its documented structure` |
| 4 | Zero console or page errors on mount | `views.spec.ts › integrations view renders its documented structure` |
| 5 | No interactive element escapes sideways at 1280×800 | `views.spec.ts › no view lets an interactive element escape sideways` |
| 6 | The theme toggle cycles and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 7 | Every visible control has an accessible name, in every sub-tab | `views.spec.ts › every control in every view has an accessible name` |
| 8 | Each `.view-toggle` strip marks exactly one button `aria-pressed="true"` | `views.spec.ts › every view-toggle strip marks exactly one button pressed` |
| 9 | The file tree is a `role="tree"` with one tab stop and working Arrow/Home/End/typeahead | `tree.spec.ts` |
| 10 | Disabled entries are visibly distinct from enabled ones | agent |
| 11 | The persistence note is stated on the page, not only in docs | agent |
| 12 | Delete is visually subordinate to the fields it sits beside | agent |

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

- The server name and transport controls carry an `aria-label` but no visible
  caption. Their values are self-describing (`filesystem`, `stdio`), so a
  caption above every card would be noise; the stacked fields below them, whose
  values are not self-describing, do have one.
- The arguments field round-trips through `split(/\s+/)` and `join(" ")`, so an
  argument containing a space cannot survive editing. The hint says "separated
  by spaces"; it does not say that is also a limit.
