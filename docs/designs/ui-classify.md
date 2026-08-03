---
wiki_key: design/ui-classify
doc_type: design
truth_state: current
git_hash: 6cd5b53
title: "UI spec — Classify view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough".
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Classify
---

# UI spec — Classify view

Classify turns unstructured Markdown into a typed OKF bundle. Raw documents
arrive by file upload or paste, a heuristic proposes a concept type and path for
each, the user corrects the proposals, and the result becomes a new bundle.

Reached by `nav-classify`; `main[data-view]` reads `classify` while mounted.

**Wireframe:** ![classify wireframe](ui-classify.png)

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
| main | page heading — “Classify into OKF” | `h1` |
| main | file upload control | `input[type=file]` |
| main | paste textarea + Add | placeholder “# Incident runbook…” |
| main | Classify action | button text |
| main | one suggestion card per document, each with an include checkbox | `.panel-card` |
| main | per-suggestion type selector and target path field | — |
| main | Apply / build bundle action | button text |
| status | concept/edge counts, selected path, dirty marker, zoom level | `app-status`, `zoom-level` |

## Rubric — Classify view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `classify` after clicking `nav-classify` | `views.spec.ts › classify view renders its documented structure` |
| 3 | The documented `h1` and section headings are present, and the panel-card count meets the inventory minimum | `views.spec.ts › classify view renders its documented structure` |
| 4 | Zero console or page errors on mount | `views.spec.ts › classify view renders its documented structure` |
| 5 | No interactive element escapes sideways at 1280×800 | `views.spec.ts › no view lets an interactive element escape sideways` |
| 6 | The theme toggle cycles and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 7 | Every visible control has an accessible name, in every sub-tab | `views.spec.ts › every control in every view has an accessible name` |
| 8 | Each `.view-toggle` strip marks exactly one button `aria-pressed="true"` | `views.spec.ts › every view-toggle strip marks exactly one button pressed` |
| 9 | The file tree is a `role="tree"` with one tab stop and working Arrow/Home/End/typeahead | `tree.spec.ts` |
| 10 | Suggestion cards make the proposed type and path editable in place | agent |
| 11 | The empty state explains what to drop in, rather than showing bare controls | agent |
| 12 | It is obvious which suggestions are included before applying | agent |

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

- This view has no tab strip; an earlier draft of this spec said it did, having
  mistaken the Upload / Paste action buttons for one.
- Suggestion cards carry no `data-testid`, so a test cannot address the Nth
  suggestion without relying on document order.
