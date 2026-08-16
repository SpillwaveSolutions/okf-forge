# Screen: Plugins and MCP

## Goal
Configure Claude plugins and MCP servers in this browser profile, then export a JSON merge target for the host.

## Layout

```
+--------------------------------------------------------------+
| Plugins & MCP                                                |
| persist-in-this-browser note                                 |
| [ Claude plugins | MCP servers | Export config ]             |
+--------------------------------------------------------------+
| [x] okf-graph-eng                               [delete]     |
| Source [SpillwaveSolutions/okf-plugin]                       |
| Description [...]                                            |
| [+ Add plugin]                                               |
+--------------------------------------------------------------+
```

MCP tab: enable, name, transport (stdio/sse/http), command+args or URL, remove, Add MCP server.

Export tab: Copy settings JSON plus preview plus illustrative merge target note.

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Tabs | toggle | plugins / mcp / export |
| Plugin card | form | Enable, name, source (visible label), description (visible label), remove |
| Add plugin | button | New enabled claude-plugin stub |
| MCP card | form | Enable, name, transport select, command/args or URL, optional notes, remove |
| Args hint | hint | Space-separated; spaces inside an arg do not survive |
| Add MCP | button | Disabled-by-default stdio stub |
| Copy settings JSON | button | Toast Config copied / Copy failed |

## States
- **Default**: okf-graph-eng plugin plus illustrative MCPs.
- **Empty list**: Add button still present.
- **stdio vs remote**: Command/args vs URL field swap.

## Acceptance Criteria
- [ ] Heading Plugins & MCP is visible.
- [ ] Three tabs; aria-pressed on the active one.
- [ ] Plugin source and description use visible label for pairs.
- [ ] User can add and remove plugins and MCP servers.
- [ ] stdio shows command plus args; sse/http show URL.
- [ ] Export tab shows JSON and a copy control.
- [ ] Settings persist in localStorage for this origin.

## Notes
- Source: src/components/okf/IntegrationsPanel.tsx.
