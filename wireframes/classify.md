# Screen: Classify

## Goal
Stage uploaded or pasted documents, review type/path/title/tag suggestions, and create a new in-memory OKF bundle without scanning or rewriting the open workspace on disk.

## Layout

```
+--------------------------------------------------------------+
| Classify into OKF                                            |
| intro + safety note (upload/paste only; in-memory until Save)|
+--------------------------------------------------------------+
| [Upload markdown]   N documents staged                       |
| Or paste markdown                                            |
| [ textarea ]                                                 |
| [Add pasted doc]  [Classify documents]                       |
+--------------------------------------------------------------+
| Bundle name [classified-okf]     [Create OKF repo]           |
+--------------------------------------------------------------+
| [x] source.md                          82% conf              |
| Type [Runbook]  Path [knowledge/runbook.md]                  |
| Title [...]       Tags [ops, api]                            |
| description  reasons                                         |
+--------------------------------------------------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Safety note | callout | Classify does not scan the open workspace. Apply creates an in-memory bundle. |
| Upload | file input | .md / .txt, multiple. Hidden input plus button. |
| Staged count | text | N document(s) staged |
| Paste | textarea | aria-label Paste raw markdown |
| Add pasted doc | button | No-op if paste empty |
| Classify documents | primary | Disabled when nothing staged |
| Bundle name | input | Default classified-okf |
| Create OKF repo | primary | Applies accepted rows as the active in-memory bundle |
| Row accept | checkbox | Default accepted |
| Confidence | badge | Percent |
| Type | select | ALL_OKF_TYPES |
| Path / title / tags | inputs | Tags comma-separated |
| Reasons | muted text | Heuristic explanation |

## States
- **Empty**: Upload plus paste only; classify disabled.
- **Staged**: Count updates; classify enabled.
- **Reviewed**: Result cards plus Create OKF repo.
- **Applied**: New bundle becomes workspace (in memory).

## Acceptance Criteria
- [ ] Heading Classify into OKF and the safety note are visible.
- [ ] Upload and paste can both stage documents; count is accurate.
- [ ] Classify is disabled with zero staged docs.
- [ ] After classify, each row can edit type, path, title, tags, and accept.
- [ ] Create OKF repo loads a new in-memory bundle (does not write disk by itself).
- [ ] Does not mutate files in the currently open workspace folder.

## Notes
- Source: src/components/okf/ClassifyPanel.tsx.
