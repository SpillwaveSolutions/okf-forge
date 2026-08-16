# Wireframes

As-built UI contracts for OKFForge. Required by [Spillwave UI Guard](https://github.com/SpillwaveSolutions/spillwave-ui-guard).

These describe the **current** product, not a redesign. Update the matching file *before* changing layout, navigation, or a primary flow. The adversarial reviewer treats acceptance criteria as the contract.

| Screen | File | View id |
|--------|------|---------|
| App chrome | [shell.md](./shell.md) | — |
| Learn OKF | [learn.md](./learn.md) | `learn` |
| Explorer | [explorer.md](./explorer.md) | `explorer` |
| Concepts | [concepts.md](./concepts.md) | `concepts` |
| Editor | [editor.md](./editor.md) | `editor` |
| Graph & Search | [graph-search.md](./graph-search.md) | `search` |
| Classify | [classify.md](./classify.md) | `classify` |
| DeepAgents | [deepagents.md](./deepagents.md) | `deepagent` |
| Plugins & MCP | [plugins-mcp.md](./plugins-mcp.md) | `integrations` |
| Settings | [settings.md](./settings.md) | `settings` |
| Open repository | [open-dialog.md](./open-dialog.md) | overlay |

Skeleton: [_template.md](./_template.md).

There is one route. All nine panels are conditional renders inside `AppShell`. Tests identify the mounted view via `main[data-view]`.
