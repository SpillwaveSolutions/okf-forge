# Screen: Learn OKF

## Goal
Onboard a new user to OKF dual-graph ideas by using the loaded sample, then jump into Editor, impact, pack, or DeepAgents.

## Layout

```
+----------------------------------------------+
| LEARNING PATH                                |
| Learn OKF by using it                        |
| intro + link to okf-graph-eng                |
+----------+----------+------------------------+
| Concepts | Validation | Plugin               |
+----------------------------------------------+
| Step N of 8: Title                     38%   |
| [========--------]                           |
| Body copy                                    |
| [Back]  [Next]                               |
+----------------------+-----------------------+
| Open Graph Engineer  | Run impact analysis   |
| Build a context pack | Wire DeepAgents       |
+----------------------+-----------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Eyebrow | text | Learning path |
| Title | h1 | Learn OKF by using it |
| Stat cards | 3 cards | Concept count, validation (Healthy / N errors / em dash), plugin name |
| Step card | stepper | Title, percent badge, progress bar, body, Back/Next |
| Back / Next | buttons | Back disabled on step 0; Next disabled on last step |
| Open Graph Engineer | action card | Selects agents/graph-engineer.md, opens Editor |
| Run impact analysis | action card | Runs impact on Graph Engineer, opens Graph and Search |
| Build a context pack | action card | Runs pack, opens Graph and Search |
| Wire DeepAgents | action card | Opens DeepAgents view |

## States
- **Default**: Step 1 of 8, sample stats if a bundle is loaded.
- **Empty workspace**: Concept count 0, validation em dash; action cards still fire.
- **Last step**: Next disabled; Back still works.

## Acceptance Criteria
- [ ] Heading Learn OKF by using it is visible.
- [ ] Eight steps exist; progress label is Step N of 8 and the bar matches.
- [ ] Back/Next respect first and last step.
- [ ] Three stat cards show concepts, validation, plugin.
- [ ] Four action cards are present and change view as specified.
- [ ] Layout is a single column that stacks cleanly at ~390px.

## Notes
- Source: src/components/okf/LearnPanel.tsx. Default landing view.
- Step index is session state (resets on reload).
