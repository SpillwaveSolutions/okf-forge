# Screen: Graph and Search

## Goal
Search the loaded graph, compute blast radius, build a progressive-disclosure pack, inspect the neighborhood, and jump from validation issues into files.

## Layout

```
+--------------------------------------------------------------+
| Graph & search                                               |
| Full-text search + impact, pack, neighborhood, validation    |
+--------------------------------------------------------------+
| Search  [ query input                          ] [Search]    |
|  hit title  [type]                         score N           |
|  path.md                                                     |
|  snippet...                                                  |
+-----------------------------+--------------------------------+
| Impact analysis             | Progressive disclosure pack    |
| Target [select            ] | Hops [2]  Max nodes [20]       |
| [Compute impact]            | [Build pack]                   |
| inbound / outbound / typed  | N nodes  mode  trimmed         |
| Suggested update order      | markdown preview               |
+-----------------------------+--------------------------------+
| Neighborhood graph                              Hops [2]     |
| [ SVG canvas ]                                               |
+--------------------------------------------------------------+
| Validation                                                   |
| [concepts] [edges] [errors] [warnings]                       |
| severity  message  path                                      |
+--------------------------------------------------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Search field | input | Enter or Search button. aria-label Graph search query |
| Hits | list | Title, type badge, score, path, snippet. Click selects path and opens Editor |
| Impact target | select | All concepts by title. Changing selection runs impact. |
| Compute impact | button | Re-runs for current target |
| Impact stats | badges | inbound, outbound, typed |
| Update order | numbered list | First 12; click path selects (stays on this view). Criticality badge when inbound. |
| Pack hops / max | numbers | Hops 1-5, max nodes 3-50 |
| Build pack | button | |
| Pack preview | markdown | Node count, mode, trimmed count |
| Neighborhood hops | number | 1-4 |
| Graph canvas | SVG | Click node selects concept. Empty copy: Select a concept to visualize. |
| Validation | list | Up to 40 issues. Path is a jump link. |

## States
- **Default / no query**: Empty hit list; impact/pack wait for action.
- **Hits**: Ranked list under search.
- **No graph**: Canvas placeholder copy.
- **No validation**: Validation card omitted.

## Acceptance Criteria
- [ ] Heading Graph & search is visible.
- [ ] Enter in the search field runs search; a hit click opens Editor on that path.
- [ ] Impact panel has a target select and Compute impact.
- [ ] After impact, inbound/outbound/typed badges and a suggested order are shown.
- [ ] Pack panel has hops, max nodes, and Build pack.
- [ ] After pack, markdown preview and node count are shown.
- [ ] Neighborhood hops control is labeled.
- [ ] Validation issues with a path are clickable.
- [ ] Impact and pack sit side-by-side on lg and stack on small screens.

## Notes
- Source: src/components/okf/SearchPanel.tsx.
- Header search and this query share store state.
