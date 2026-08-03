---
wiki_key: design/ui-editor
doc_type: design
truth_state: current
git_hash: 6cd5b53
title: "UI spec — Editor view"
# Pins the wiki page name. Without this, ia_render's page_name() maps every
# design doc whose filename lacks "design_doc" onto "Code-Walkthrough" and this
# spec would overwrite that page. The explicit URL wins over the derivation and
# survives worklog upgrades, unlike patching bin/.
wiki: https://github.com/SpillwaveSolutions/okf-forge/wiki/Design-UI-Editor
---

# UI spec — Editor view

The Editor is the primary work surface: a split Markdown source/preview pane for
one concept, with graph actions (Impact, Pack) and the neighborhood subgraph
below. It is reached by `nav-editor`, or automatically whenever a file is
selected in the sidebar tree.

**Wireframe:** ![Editor wireframe](ui-editor.png)

The wireframe is authoritative for exactly three things: the **element
inventory** below, **containment and reading order** (header spans the top;
sidebar left of main; status bar last), and **ordinal sequence** (nav order,
view-toggle order). It is **not** authoritative for pixels, spacing, colour,
typography, icons, or density — it draws monochrome boxes and the real UI is a
dark workbench. Never diff a screenshot against it.

## Element inventory

This table is a contract. Adding or removing a control means updating this spec
and its `git_hash` in the same commit.

| Region | Element | Addressable by |
|---|---|---|
| header | brand / logo | `aria-hidden` decoration |
| header | concept search | `type="search"`, `aria-label="Search notes and graph"` |
| header | view-mode toggle (Preview, Markdown, Split — in that order) | `role="group"` name `Editor view mode`; one `aria-pressed="true"` |
| header | theme toggle, cycling system → light → dark | `theme-toggle`, `data-theme-pref`; accessible name states current state and next action |
| header | Learn, Open, Classify, Save | `header-open`, `header-save` |
| sidebar | 8 nav items, in order: Learn, Explorer, Editor, Graph & Search, Classify, DeepAgents, Plugins & MCP, Settings | `nav-learn` … `nav-settings` |
| sidebar | bundle name + validation badge | — |
| sidebar | file filter | `aria-label="Filter files"` |
| sidebar | nested file tree, dirs collapsible | `role="tree"` / `role="treeitem"`, `aria-expanded` on dirs, `aria-level`, `data-depth`, `data-kind` |
| main | formatting + action toolbar (Impact, Pack, Save) | `title=` only — see backlog |
| main | Markdown source textarea | `aria-label="Markdown editor"` |
| main | rendered preview | — |
| main | neighborhood graph | `role="img"` name `OKF concept graph` |
| status | concept/edge counts, selected path, dirty marker | `app-status` |
| status | zoom level, desktop only, hidden at 100% | `zoom-level` |

## Acceptance criteria

1. Selecting a file in the sidebar switches to this view and loads that
   concept's raw source, including frontmatter.
2. Editing marks the buffer dirty; ⌘S/Ctrl+S saves and clears it.
3. Save recomputes the graph, so validation counts in the status bar update.
4. The view-mode toggle switches between source-only, preview-only, and split
   without losing the buffer.

## Rubric — Editor view

Rows with a named **Check** are the gate. Rows marked `agent` are **never** a
gate — they are reported in the PR body and nothing more. A merge blocked by
model judgement has "the model was in a mood" as a failure mode.

### Must match

| # | Criterion | Check |
|---|---|---|
| 1 | Sidebar occupies the left column; main starts at or after its right edge; header spans both | `layout.spec.ts › grid topology` |
| 2 | `main[data-view]` equals `editor` after clicking `nav-editor` | `layout.spec.ts › grid topology` |
| 3 | No interactive element renders outside the viewport at 1280×800 | `layout.spec.ts › no interactive element renders outside the viewport` |
| 4 | Headings and button labels are not clipped (except deliberate `.truncate`) | `layout.spec.ts › headings and button labels are not clipped` |
| 5 | The view-mode toggle has 3 buttons and exactly one `aria-pressed="true"` | `layout.spec.ts › editor view-mode toggle exposes exactly one pressed button` |
| 6 | All 7 views mount and identify themselves with zero console errors | `layout.spec.ts › every view mounts and identifies itself` |
| 7 | The theme toggle cycles all three states and `html[data-theme]` follows | `layout.spec.ts › theme toggle cycles system, light, and dark` |
| 8 | Switching to light changes the computed body background | `layout.spec.ts › the light theme actually repaints the surface` |
| 9 | Every control stays reachable at 200% zoom | `zoom.e2e.ts › keeps every control reachable at maximum zoom` |
| 10 | The file tree is a `role="tree"` with one tab stop and working Arrow/Home/End/typeahead | `tree.spec.ts` |
| 11 | Toolbar reads as a grouped toolbar, not a row of loose buttons | agent |
| 12 | Source and preview panes are visually balanced in Split mode | agent |
| 13 | Type badges are legible against the elevated surface | agent |
| 14 | The empty state ("no file selected") reads as intentional, not broken | agent |
| 15 | Both themes read as the same product, not two skins | agent |

### Acceptable differences

- Any spacing, font size, radius, shadow, or colour value.
- Icon choice, provided the accessible name is unchanged.
- Truncation on file paths, badges, and the status bar — deliberate.
- Wireframe geometry and proportion. Topology and inventory only.
- Dynamic content: concept counts, edge counts, timestamps.
- Either theme. Visual rows are judged **within** a theme, never across the two:
  light and dark are different palettes, not a defect in one of them.
- Any zoom level. Density at 200% is not a finding; a control that has become
  unreachable is, and row 9 gates that.

### Failure criteria

- Any Must-match row with a named Check failing → **blocks merge**.
- A control listed in the element inventory and absent from the DOM → **blocks merge**.
- Any `agent` row failing → comment on the PR; does **not** block.

## Known gaps

Tracked separately, deliberately not fixed here:

- Toolbar buttons use `title=` rather than `aria-label`; `title` is a weak
  accessible-name source and fragile for `getByRole(name:)`.
- New directories added while a bundle is open are not auto-expanded. Seeding
  now happens only on a bundle or filter change, which is what stops a save
  from collapsing the tree; the cost is that a folder created mid-session
  starts closed.
