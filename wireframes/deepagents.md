# Screen: DeepAgents

## Goal
Map okf-graph-eng skills onto a LangChain DeepAgent (enable / subagent), set pack defaults, and export JSON or Python scaffolding.

## Layout

```
+--------------------------------------------------------------+
| LangChain DeepAgents                                         |
| intro                                                        |
+---------------------------+----------------------------------+
| Agent name                | Pack hops / max nodes            |
| Description (full width)                                     |
+--------------------------------------------------------------+
| [ Skill map | JSON export | Python ]                         |
+--------------------------------------------------------------+
| [x] okf-impact     [x] Subagent    [SKILL.md loaded]         |
| description  tools: ...                                      |
+--------------------------------------------------------------+
```

JSON / Python tabs: Copy plus Download plus pre preview.

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Agent name | input | Persisted in integrations store / localStorage |
| Pack hops / max | numbers | Export defaults |
| Description | textarea | |
| Tabs | toggle | Skill map / JSON export / Python. aria-pressed |
| Skill row | card | Enable checkbox, Subagent checkbox, optional SKILL.md badge, tools list |
| Copy / Download | buttons | Clipboard toast on success/fail; download okf-deepagent.json or okf_deepagent.py |

## States
- **Map**: Default tab; one card per mapping.
- **JSON / Python**: Live preview of current mapping.
- **Copy fail**: Toast tells user to copy manually.

## Acceptance Criteria
- [ ] Heading LangChain DeepAgents is visible.
- [ ] Name, description, hops, and max nodes are editable.
- [ ] Three tabs exist; only one panel shows at a time.
- [ ] Each skill can be enabled and marked Subagent independently.
- [ ] JSON and Python tabs show Copy and Download.
- [ ] Successful copy shows a toast.

## Notes
- Source: src/components/okf/DeepAgentPanel.tsx.
- Skill bodies come from bundled okf-plugin-meta when present.
