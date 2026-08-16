# Screen: Editor

## Goal
Edit one OKF Markdown concept (YAML frontmatter plus body) with Preview / Markdown / Split, formatting helpers, and one-click Impact / Pack for the open file.

## Layout

### Empty (no file selected)

```
+----------------------------------+
|      No file selected            |
|  Open a repo and pick a concept  |
|  from the sidebar -- or Learn.   |
+----------------------------------+
```

### Split (default)

```
+-----------------------------------------------------------------+
| path.md  unsaved  [Type] [verified] | B ` H1 H2 list | Impact Pack |
+-------------------------------+---------------------------------+
| Markdown textarea             | Rendered preview                |
| (frontmatter + body)          | (body; frontmatter stripped)    |
|                               | Neighborhood graph (if focus    |
|                               | matches selection)              |
+-------------------------------+---------------------------------+
```

On viewports below lg, Split stacks source above preview.

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Path | mono text | Selected path; appends unsaved when dirty |
| Type badge | badge | From frontmatter |
| Verified badge | success badge | Only if verified |
| Format buttons | toolbar | Bold, inline code, H1, H2, bullet, numbered -- wrap selection |
| Impact | toolbar | runImpact(selectedPath) then Graph and Search |
| Pack | toolbar | runPack(selectedPath) then Graph and Search |
| Toolbar Save | icon | Disabled when clean |
| Source | textarea | id=okf-md-editor aria-label Markdown editor. Spellcheck off. |
| Preview | rendered MD | Body only |
| Neighborhood | GraphCanvas | Under preview when graphData.root equals selectedPath. Click node selects path. |
| Mode toggle | header | Preview / Markdown / Split live in the shell header, not this pane |

## States
- **Empty**: Centered No file selected copy.
- **Preview**: Preview only (plus neighborhood if present).
- **Markdown**: Source only.
- **Split**: Both; two columns on lg+.
- **Dirty**: Path shows unsaved; header Save enabled.

## Acceptance Criteria
- [ ] With no selection, empty state is shown (no blank white pane).
- [ ] With a selection, toolbar shows path and type badge.
- [ ] Preview / Markdown / Split from the header change this pane as named.
- [ ] Split is two columns on large screens and stacked on small.
- [ ] Cmd/Ctrl+S and toolbar Save persist the draft.
- [ ] Impact and Pack act on the open path.
- [ ] Source textarea is labeled Markdown editor.
- [ ] Neighborhood graph appears only when its root is the open file.

## Notes
- Source: src/components/okf/EditorPane.tsx.
- Frontmatter stays in source; preview strips it.
