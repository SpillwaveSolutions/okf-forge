# Screen: Explorer

## Goal
Give a workspace overview: what is loaded, type mix, neighborhood of the current focus, and directory cards that jump into the editor.

## Layout

```
+--------------------------------------------------------------+
| {bundle name}                     [N concepts] [M edges] [valid] |
| Source: {url or source}                                      |
| [AgentNode  3] [Dataset  4] ...                              |
+--------------------------------------------------------------+
| Focus: {root path}                                           |
| [ SVG neighborhood graph ]                                   |
+-------------+-------------+-------------+
| agents/     | knowledge/  | decisions/  |
|  title      |  title      |  title      |
|  path.md    |  path.md    |  path.md    |
+-------------+-------------+-------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Title | h1 | Bundle name, else Workspace |
| Source | link or text | External URL if GitHub; otherwise Source: {source} |
| Validation badges | badges | Concept count, edge count, valid or N errors |
| Type histogram | badges | Sorted by count descending |
| Focus graph | SVG | Shown when graphData exists. Click node selects path and opens Editor |
| Directory cards | grid | Grouped by top-level dir. Click concept selects path and opens Editor. Selected path highlighted. |

## States
- **Default**: Bundle loaded, types and cards populated.
- **Empty**: Title Workspace, no cards, no graph.
- **No focus graph**: Graph card omitted until a concept neighborhood exists.

## Acceptance Criteria
- [ ] Bundle name (or Workspace) is the page title.
- [ ] Type badges reflect the loaded concepts.
- [ ] Clicking a concept in a directory card opens Editor on that path.
- [ ] Clicking a graph node also opens Editor on that path.
- [ ] Selected concept is visually marked in its card.
- [ ] Cards wrap to 1 / 2 / 3 columns (sm / lg) without horizontal overflow.

## Notes
- Source: src/components/okf/ExplorerPanel.tsx.
