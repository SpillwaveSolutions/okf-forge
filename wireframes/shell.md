# Screen: App chrome (shell)

## Goal
Give a Motion-style workbench: persistent header, sidebar nav plus file tree, one main panel, and a status bar. The user always knows which workspace is open, which view is active, and whether the current file is dirty.

## Layout

```
+-----------------------------------------------------------------+
| Logo + subtitle | Search          | Preview Markdown Split |    |
|                 |                 | Theme Learn Open Classify Save |
+-----------------+-----------------------------------------------+
| Learn OKF       |                                               |
| Explorer        |                                               |
| Concepts        |              Main (one of 9 views)            |
| Editor          |                                               |
| Graph & Search  |                                               |
| Classify        |                                               |
| DeepAgents      |                                               |
| Plugins & MCP   |                                               |
| Settings        |                                               |
| --------------- |                                               |
| [bundle] valid  |                                               |
| Filter files... |                                               |
| > agents/       |                                               |
|   graph-eng.md  |                                               |
| > knowledge/    |                                               |
| --------------- |                                               |
| N concepts      |                                               |
+-----------------+-----------------------------------------------+
| status  N concepts  M edges  healthy   path.md *   125% Loading |
+-----------------------------------------------------------------+
```

CSS grid children are **direct**: header | sidebar | main | status. Do not wrap sidebar+main -- that collapses both into the left column.

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Logo + title | brand | Title OKFForge. Subtitle Desktop workbench on Tauri, Graph engineering workbench on web. Hidden on smallest width. |
| Header search | search input | Filters the file tree and sets graph search query. Enter runs search. Hidden on mobile. aria-label Search notes and graph. |
| View toggle | 3-button group | Preview / Markdown / Split. Switching also opens Editor. Hidden on mobile. role=group aria-label Editor view mode. |
| Theme | icon button | Cycles system to light to dark. data-testid=theme-toggle data-theme-pref. Accessible name is the full cycle label. |
| Learn | ghost button | Opens Learn view. Hidden on mobile. |
| Open | secondary | Opens Open dialog. Disabled while loading. data-testid=header-open. |
| Classify | secondary | Opens Classify. Hidden on mobile. |
| Save | primary | Enabled only when dirty. Label Save / Saved. data-testid=header-save. Cmd/Ctrl+S. |
| Nav rail | 9 buttons | data-testid=nav-{id}. Active item visually marked. Order: Learn, Explorer, Concepts, Editor, Graph & Search, Classify, DeepAgents, Plugins & MCP, Settings. |
| Bundle header | text + badge | Bundle name; valid or N err from validation. |
| File filter | search | Filters tree by path, title, type. |
| File tree | ARIA tree | Flat role=treeitem rows, aria-level, roving tabindex. Dirs expand/collapse; files select and open editor. Type badge on non-Index files. |
| Tree empty | copy | No markdown in workspace. Open a repo or scaffold one. |
| Sidebar footer | meta | N concepts plus source |
| Main | region | data-testid=app-main data-view={view} |
| Status bar | footer | Status message, concept/edge/health counts, selected path plus star, zoom percent if not 100%, Loading. data-testid=app-status. |
| Toast | status | Click to dismiss. role=status. |
| Open dialog | modal | See open-dialog.md. |

## States
- **Default / happy path**: Sample or workspace loaded, Learn or Editor visible, Save disabled, status healthy.
- **Empty**: No concepts; tree empty copy; Open still available.
- **Loading**: Open disabled; status shows Loading.
- **Dirty**: Save enabled; path shows star; toolbar shows unsaved.
- **Error**: Open dialog surfaces load error; toast for save/export.
- **Narrow (~390px)**: Header search, view toggle, Learn, Classify hidden. Nav + Open + Save remain. No horizontal overflow on primary flows.
- **Desktop zoom**: Cmd+/Cmd-/Cmd+0, 80% to 200%. Level in status bar when not 100%. Header may scroll horizontally (data-scroll).

## Acceptance Criteria
- [ ] Header, sidebar, main, and status bar are all visible on a desktop viewport.
- [ ] Exactly one main view is mounted; main[data-view] matches the active nav item.
- [ ] All nine nav items switch the main panel without a route change.
- [ ] Header subtitle distinguishes desktop vs web.
- [ ] Save is disabled when clean and enabled when dirty; Cmd/Ctrl+S saves.
- [ ] Theme cycle has an accessible name that states current and next.
- [ ] File tree is keyboard-navigable (arrows, Home/End, Enter/Space, type-ahead) and uses role=tree.
- [ ] Tab into the tree once; Tab again leaves the tree (roving tabindex).
- [ ] Status bar shows concept/edge counts and selected path when a bundle is loaded.
- [ ] At ~390px the primary chrome still works and does not overflow horizontally.

## Notes
- Source: src/components/okf/AppShell.tsx, Header.tsx, Sidebar.tsx.
- Tests address views via data-view and data-testid on nav items, not routes.
