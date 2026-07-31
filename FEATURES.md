# Features

Complete feature catalog for **OKFForge**.  
Back to **[README.md](./README.md)** · Usage: **[USER_GUIDE.md](./USER_GUIDE.md)** · Build: **[DEVELOPERS.md](./DEVELOPERS.md)**

---

## 1. Product shell

| Feature | Description |
|---------|-------------|
| **Motion-style layout** | Header + sidebar + main content, dark technical theme |
| **Responsive UI** | Desktop-first; usable around ~390px width; no horizontal overflow on primary flows |
| **Status bar** | Concept counts, edges, selected path, dirty state, load messages |
| **Toasts** | Short feedback for save, load, classify, export actions |
| **Desktop badge** | Header subtitle reflects web vs Tauri runtime |

### Navigation (sidebar)

| View | Purpose |
|------|---------|
| **Learn OKF** | Guided tour of OKF dual-graph concepts |
| **Explorer** | Workspace overview, type breakdown, focus graph, catalog cards |
| **Editor** | Markdown edit + preview + neighborhood graph |
| **Graph & Search** | Search, impact, packs, validation report, hop-controlled graph |
| **Classify** | Document → type/path suggestions → new OKF bundle |
| **DeepAgents** | Skill map + JSON / Python export for LangChain DeepAgents |
| **Plugins & MCP** | Claude plugins, MCP servers, settings JSON export |

---

## 2. Workspace open / load

Open dialog supports multiple sources:

| Source | Behavior |
|--------|----------|
| **Open folder (native)** | Tauri: OS folder picker + Rust FS jail; Web: fixed `OKF_WORKSPACE` via `/api/fs` |
| **Sample okf-plugin** | Bundled `sample-okf` dual graph (agents + knowledge + decisions) |
| **GitHub** | Public `owner/repo` or `owner/repo/path` (e.g. `…/sample-okf`) |
| **Browser file pick** | Folder or multi-file `.md` upload into an in-memory bundle |
| **Scaffold** | Empty OKF skeleton (index, agents, knowledge, log) with a starter agent |

When a **workspace root** is open (native or `/api/fs`), **Save** writes through the storage provider to disk.

---

## 3. Markdown editor

Inspired by [Motion](https://github.com/SpillwaveSolutions/motion), tuned for OKF:

| Feature | Description |
|---------|-------------|
| **Preview mode** | Rendered Markdown (frontmatter stripped for body preview) |
| **Markdown mode** | Full raw source (YAML frontmatter + body) |
| **Split mode** | Side-by-side source + preview (default) |
| **Toolbar** | Bold, inline code, H1/H2, lists; **Impact** / **Pack** shortcuts for the open file |
| **⌘S / Ctrl+S** | Save current concept |
| **Type / verified badges** | From frontmatter (`type`, `verified`) |
| **Neighborhood graph** | Under preview when focus matches selection |
| **Dirty tracking** | Header Save enables only when dirty; status shows `*` |

---

## 4. Graph engine (okf-graph-eng model)

In-browser implementation of OKF graph ops over Markdown links + frontmatter edges.

| Capability | Description |
|------------|-------------|
| **Concept load** | Parse YAML frontmatter, body, tags, types |
| **Edge extraction** | Absolute Markdown links + optional typed `links` frontmatter (`routes_to`, `depends_on`, `uses`, …) |
| **Inbound / outbound maps** | Full reverse index for impact |
| **Resolve by path or title** | Flexible targeting for impact/pack/subgraph |
| **Criticality** | From type (high/medium) + `verified` flag |
| **Impact analysis** | Blast radius, direct edges, suggested update order |
| **Context pack** | Progressive disclosure: N-hop pack, max nodes, markdown export body |
| **Subgraph** | Undirected neighborhood for visualization |
| **Validate** | Missing index/log, broken links, missing type/title, unverified high-impact, orphans |
| **Search** | Scored full-text over path, title, type, tags, body, description |
| **Catalog tree** | Group by top-level directory for explorer/sidebar |
| **Mermaid export helper** | `toMermaid(nodes, edges)` for diagram source |

### Concept types

**Knowledge:** Dataset, Table, Metric, Playbook, Runbook, API, Reference, …  
**Harness:** AgentNode, Workflow, Harness, DecisionRecord, SharedState, ToolCapability, TicketLink, …

---

## 5. Graph & Search UI

| Feature | Description |
|---------|-------------|
| **Search box** | Enter runs concept search; results open the editor |
| **Impact panel** | Target select, inbound/outbound stats, suggested order with criticality |
| **Pack panel** | Hops + max nodes; builds pack markdown preview |
| **Neighborhood canvas** | SVG radial layout; click node to select concept |
| **Validation panel** | Error/warn/info list with jump-to-path |

---

## 6. Explorer

| Feature | Description |
|---------|-------------|
| Bundle name + source URL | GitHub or local path attribution |
| Type histogram badges | Counts per `type` |
| Focus graph | Current neighborhood visualization |
| Directory cards | Click into any concept |

---

## 7. Learn OKF

| Feature | Description |
|---------|-------------|
| **Step tour** | Dual graph, frontmatter, typed edges, impact, packs, skills, DeepAgents/MCP |
| **Progress bar** | Step N of M |
| **Quick actions** | Open Graph Engineer, run impact, build pack, jump to DeepAgents |
| **Live stats** | Concept count, validation health, plugin name |

---

## 8. Classify → OKF repo

| Feature | Description |
|---------|-------------|
| **Upload / paste** | Stage Markdown (or text) documents |
| **Heuristic classify** | Suggests type, path, title, tags, description, confidence, reasons |
| **Review UI** | Accept checkbox; edit type/path/title/tags |
| **Create OKF repo** | Writes frontmatter + body into a new in-memory bundle and loads it |

Types available in the classifier include knowledge + harness types used by okf-author workflows.

---

## 9. LangChain DeepAgents

| Feature | Description |
|---------|-------------|
| **Default skill map** | okf-init-graph, okf-author, okf-impact, okf-query, okf-validate, okf-maintain, okf-visualize, … |
| **Enable / subagent toggles** | Per skill |
| **Agent name / description** | Editable export metadata |
| **Pack hops / max nodes** | Defaults aligned with progressive disclosure |
| **JSON export** | Skills + subagents + tools payload |
| **Python export** | Scaffold snippet for DeepAgent harness wiring |
| **Copy / download** | Clipboard or file download |

Skill bodies are loaded from bundled **okf-plugin-meta** when available.

---

## 10. Plugins & MCP

| Feature | Description |
|---------|-------------|
| **Claude plugins** | Enable, rename, source (`owner/repo` or path), description; add/remove |
| **Default plugin** | okf-graph-eng / SpillwaveSolutions/okf-plugin |
| **MCP servers** | stdio / sse / http; command+args or URL; enable; notes |
| **Default MCPs** | Illustrative filesystem / fetch style entries |
| **Export config** | JSON merge target for host Claude Code / MCP settings |
| **Persistence** | `localStorage` in the browser |

---

## 11. Dual runtime & filesystem

| Feature | Description |
|---------|-------------|
| **Tauri desktop** | `set_workspace`, `list_markdown_files`, `read_file`, `write_file`; dialog plugin |
| **Web HttpStorage** | `/api/fs/workspace`, `list`, `read`, `write` |
| **FS jail** | Component-aware containment (no sibling prefix escape); shared TS + Rust core |
| **Playwright surface** | Same web app + real disk ops without a desktop shell |

See [DESKTOP.md](./DESKTOP.md) for ports, env vars, and binary locations.

---

## 12. Sample data & plugin meta

| Asset | Role |
|-------|------|
| `public/sample-okf/` | Full sample dual graph (agents, knowledge, decisions) |
| `public/sample-okf-bundle.json` | Prebundled file map for fast init |
| `public/okf-plugin-meta.json` | Plugin info + skill SKILL.md bodies for DeepAgents |

---

## 13. Quality & tooling (product-facing)

| Feature | Description |
|---------|-------------|
| **TypeScript strict** | `npm run typecheck` |
| **Unit tests** | FS jail (`npm test`) |
| **E2E** | Playwright smoke, `/api/fs`, open workspace (`npm run test:e2e`) |
| **Verify gate** | `npm run verify` |
| **Production build** | TanStack Start + Nitro Vercel preset |
| **Tauri SPA build** | Separate client-only `dist/` for desktop webview |

---

## Non-goals (current)

- Multiplayer / shared cloud OKF host (local-first + optional public GitHub load)
- TipTap rich blocks (Mermaid/Dataset/Query) as in upstream Motion — OKFForge focuses on graph engineering, not Motion’s generative block suite
- Built-in LLM CLI calls from the desktop shell (skills are exported for host agents)

---

## Feature map by persona

| Persona | Start here |
|---------|------------|
| Learning OKF | Learn tab + sample-okf |
| Graph engineer | Explorer → Editor → Graph & Search (impact/pack) |
| Content triage | Classify → Create OKF repo |
| Agent harness author | DeepAgents + Plugins & MCP exports |
| QA / automation | Web mode + Playwright + `OKF_WORKSPACE` |
| Desktop user | Tauri open folder + save to disk |
