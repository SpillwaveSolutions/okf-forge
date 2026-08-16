# Screen: Concepts

## Goal
Scan every concept in the loaded bundle as a filterable table: title, type, status, verified, path. Click a row to open it in the Editor.

## Layout

```
+--------------------------------------------------------------+
| Concepts                                                     |
| N in this workspace                                          |
+--------------------------------------------------------------+
| [Search concepts]     [All types] [AgentNode] [Workflow] …   |
+--------------------------------------------------------------+
| Title              Type        Status   Verified   Path      |
| Graph Engineer     AgentNode   active   yes        agents/…  |
| …                                                            |
+--------------------------------------------------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Heading | h1 | Concepts |
| Count | copy | N in this workspace (filtered count when a query or type is on) |
| Search | input | Filters title, path, type, tags. aria-label Search concepts |
| Type chips | buttons | Unique types from the bundle plus All. aria-pressed on the active chip. role=group aria-label Concept type |
| Table | table | Columns Title, Type, Status, Verified, Path. Click a row selects the path and opens Editor. |
| Empty | copy | No concepts match when the filter misses. |

## States
- **Loaded**: full table, All types selected.
- **Filtered**: count copy updates; empty copy if zero rows.
- **Empty bundle**: table body empty, count 0.

## Acceptance Criteria
- [ ] Heading Concepts is visible after clicking nav-concepts.
- [ ] `main[data-view]` is `concepts`.
- [ ] Search filters the table by title or path.
- [ ] Type chips narrow the table; All clears the type filter.
- [ ] Clicking a row opens the Editor on that path.
- [ ] Table has Title, Type, Status, Verified, Path columns.

## Notes
- Source: src/components/okf/ConceptsPanel.tsx.
- Ninth nav item, between Explorer and Editor.
