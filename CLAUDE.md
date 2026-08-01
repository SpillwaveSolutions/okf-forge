# OKF Forge

A local-first graph-engineering workbench for **Open Knowledge Format (OKF)** repos.
A folder of `.md` files with YAML frontmatter *is* a dual graph (knowledge graph +
agent/harness graph). You open a bundle, edit concepts in a split source/preview
editor, and run graph ops over them: search, impact/blast-radius, N-hop "context
packs" for progressive disclosure, neighborhood subgraphs, and structural validation.

Ships as **one UI on two runtimes**: web (TanStack Start → Vercel) and desktop
(Tauri 2 with a native folder picker and a Rust FS jail).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite on `0.0.0.0:8080`. **Host/port are a contract** — see Invariants. |
| `npm run build` | Web/SSR prod build (Nitro → `.vercel/output/`) then `db:migrate`. |
| `npm run build:tauri` | SPA-only build for the desktop webview → `dist/`. |
| `npm run tauri:dev` | Native window against the Vite dev server. |
| `npm run tauri:build` | Full desktop package → `src-tauri/target/release/bundle/`. |
| `npm run typecheck` | `tsc --noEmit`. Covers `src/` only. |
| `npm test` | Unit tests: **`node:test`**, not vitest/jest. |
| `npm run test:e2e` | Playwright. Needs `npx playwright install chromium`. |
| `npm run test:rust` | `cd src-tauri && cargo test`. |
| `npm run verify` | typecheck + unit + e2e. **Does not run lint or build.** |
| `npm run lint` / `format` | `eslint .` / `prettier --write .` |

Node 22+ (`npm test` uses `--experimental-strip-types`), Rust 1.77+, npm (only
`package-lock.json`). `OKF_WORKSPACE=/abs/path npm run dev` points `/api/fs` at a
real directory instead of `public/sample-okf`.

## Architecture

```
src/lib/okf/       domain core — pure, testable, runtime-agnostic
  types.ts         Concept, OkfBundle, TypedEdge + the type/rel vocabularies
  graph.ts         the whole graph engine (pure fns over Record<path, Concept>)
  store.ts         Zustand — the app's ONLY state container
  loaders.ts       bundle acquisition (sample, github, upload, scaffold)
  frontmatter.ts   hand-rolled YAML-ish parser (no yaml dep)
  markdown.ts      hand-rolled MD→HTML renderer (no markdown dep)
  classify.ts      heuristic raw-docs → typed OKF paths
  integrations.ts  DeepAgents / Claude plugin / MCP exporters
src/lib/platform/  dual-runtime filesystem
  storage.ts       StorageProvider interface + HttpStorage / TauriStorage
  fsCore.ts        Node-only path jail + walker (never in the browser bundle)
  fsApiPlugin.ts   Vite dev middleware: /api/fs/workspace|list|read|write
src/components/okf/  all UI, every file a Zustand consumer
src-tauri/src/     main.rs, lib.rs (5 commands), fs_core.rs (the jail)
```

**Data model.** An `OkfBundle` is a flat in-memory map `Record<path, content>` — not
a filesystem handle. A `Concept` is one parsed `.md` file. Edges come from two
merged sources: markdown `[text](path)` links (untyped, `rel: "links_to"`) and
frontmatter `links:` entries (typed). `mergeEdges` dedupes **by target**, so a
typed frontmatter edge always beats a markdown `links_to` to the same file.
`loadConcepts` filters `outbound` to targets that actually exist, keeping the
runtime graph closed; broken links survive only in `edges`, which is how
`validateBundle` finds them.

**Dual-runtime strategy.** One `StorageProvider` interface, two impls, chosen at
runtime by `isTauriRuntime()` sniffing `window.__TAURI_INTERNALS__`. The React
tree, store, and graph engine are 100% runtime-agnostic — only `getStorage()`
knows the difference. Tauri API imports are **dynamic** (`await import(...)`) so
the browser bundle never pulls them in.

| | Web | Desktop |
|---|---|---|
| Entry | `src/routes/index.tsx` (SSR shell) | `src/tauri-main.tsx` → `tauri.html` |
| Provider | `HttpStorage` → `fetch("/api/fs/...")` | `TauriStorage` → `invoke(...)` |
| Backend | `fsApiPlugin.ts` → `fsCore.ts` | `lib.rs` commands → `fs_core.rs` |
| Root | `OKF_WORKSPACE` env | OS folder picker, held in a Rust `Mutex` |

**Two Vite configs, on purpose.** `vite.config.ts` is web/SSR: tsconfig paths,
`base: "/"`, and the `pgliteBootstrap` / `authPopup` / `okfFsApi` serve-only
plugins, with Nitro gated to `command === "build"` (leaving it on in dev opens a
second port and breaks the 8080 contract). `vite.tauri.config.ts` is the desktop
SPA: explicit `@` alias, `base: "./"` for relative asset paths in the webview,
entry `tauri.html`, no Start/Nitro/fs plugins.

## Invariants

- **`fsCore.ts` and `fs_core.rs` are deliberate mirrors.** Any FS behavior change
  updates **both**, plus both test suites. They mirror name-for-name
  (`isInsideWorkspace`/`is_inside_workspace`, `collectFiles`/`collect_files`, …)
  and share one jail rule: realpath both sides, then check containment
  **by path component** so `/ws-evil/x.md` cannot escape `/ws` via string prefix.
- **`0.0.0.0:8080` is a contract**, not a preference. Changing it means also
  updating `tauri.conf.json` `devUrl`, Playwright `baseURL`, and the preview proxy.
  Never bind a second dev port in web mode.
- **Graph logic stays pure** in `src/lib/okf/*`; UI in `src/components/okf/*` wires
  through `store.ts`. Don't put graph algorithms in components.
- **Never hand-edit `.work/*.jsonl` or `docs/roadmap.md`** — see the policy block below.

## Gotchas

- **`src/lib/auth/`, `src/lib/db.ts`, `src/lib/multiplayer/`, and
  `migrations/0001_auth.sql` are dead code** — leftovers from a TanStack
  Start + better-auth + PGlite + WebRTC starter template. Nothing in `components/`,
  `routes/`, or `tauri-main.tsx` imports them. FEATURES.md lists multiplayer as a
  non-goal. Don't extend them; don't assume auth works.
- **There is effectively one route.** All seven "views" are conditional renders
  driven by `store.view`, not URLs. Deep-linking to a concept is not possible.
- **`/api/fs` is dev-only** (`apply: "serve"`) — it 404s in prod web. Prod disk I/O
  is desktop-only.
- **No YAML or Markdown libraries.** Both parsers are hand-rolled and intentionally
  partial: frontmatter understands flat scalars, inline `[a, b]` arrays, and the one
  nested `links:` shape. Nothing else.
- **The whole bundle is reparsed and revalidated on every save** (`recompute` →
  `buildFromBundle`). Fine at the 400-file cap, a cliff beyond it.
- **Bundle keys are relative to the logical OKF root**, which may sit below the
  opened folder. `resolveWorkspaceSelection` computes a `workspacePrefix` that every
  disk read/write re-adds. In-memory bundles clear `workspaceRoot` so they can't
  write to disk.
- **`tsconfig` `include` is `["src"]`** — `tests/`, `e2e/`, `scripts/`, and the vite
  configs are not covered by `npm run typecheck`.
- `.vercel/output/`, `dist/`, and `src-tauri/target/` are **committed** — `.gitignore`
  is minimal. Expect build artifacts in diffs.
- Rust edits need a `tauri:dev` restart; frontend HMR flows through the webview.
- Stale desktop UI after a change: `rm -rf dist src-tauri/target/release`, rebuild.

## Conventions

- Tests are **not colocated**: unit in `tests/`, e2e in `e2e/`. Unit tests use
  `node:test` + `node:assert/strict` and import source with **explicit `.ts`
  extensions** (types are stripped, not compiled).
- Prefer e2e coverage for user-visible flows; put `data-testid` on critical controls
  (`header-open`, `open-workspace`).
- Prettier: double quotes, semicolons, trailing commas, width 100. `no-explicit-any`
  is **off**; `no-unused-vars` is a warning ignoring `^_`.
- There is **no CI and no pre-commit hook** beyond what worklog installed. `npm run
  verify` before pushing is manual discipline.
- Before a desktop release, run the DEVELOPERS.md §8 checklist on a real host.

## More docs

`DEVELOPERS.md` (dev workflow, Tauri build/deploy, pre-release checklist),
`DESKTOP.md` (dual-mode cheat sheet), `FEATURES.md`, `USER_GUIDE.md`, `README.md`.

<!-- worklog:policy:start -->
## Work tracking policy

- Every plan MUST end by running `worklog plan-capture` — it writes
  `docs/plans/<date>-<slug>.md` and appends the plan's steps as work items.
- Work discovered mid-flight that wasn't in the plan: run
  `worklog add --unplanned --discovered-during <item>` BEFORE doing the work.
- Never hand-edit `.work/*.jsonl` (use `worklog`) or `docs/roadmap.md`
  (it is generated; change the work items instead).
- After changing work items, run `worklog roadmap-render` and commit the log
  and roadmap together.
<!-- worklog:policy:end -->

<!-- worklog:taxonomy:start -->
## Work taxonomy

Every work item sits on four independent axes:

| Axis | Field | Values | Answers |
|---|---|---|---|
| Level | `level` | epic / story / task / subtask | size & place in the parent tree |
| Kind | `kind` | feature / bug / ops / triage | nature of the work |
| Milestone | `milestone` | free string (e.g. v0.6.0) or null | what ships together |
| Planned | `unplanned` + `discovered_during` | bool + ULID | deliberate vs discovered |

Rules (the validator enforces these; apply them when proposing items):
1. Kind is free at story/task/subtask.
2. Epics are `feature` or `ops` only — a bug is never epic-sized.
3. `kind` defaults to `triage` when omitted — never silently default to feature.
4. `bug.parent` is optional; bugs may float free of any epic.
5. `milestone` lives on leaves (story and below); an epic's milestone derives from its children.
6. `triage` and `ops` both trend down: triage shrinks by classifying, ops by automating.

When trackable work surfaces in conversation, propose an item inline as part of
the normal response — "want me to file this? `level:story kind:feature
parent:<ulid> milestone:v0.6.0`" — and create it only on assent, via the
work-track or plan-capture skill. When unsure of the kind, propose `kind:triage`
with the open question stated — triage is the honest default, never a confident
guess. This inline path is the default; the flag-gated classifier (`classifier:`
in `.work/config.yml`, off by default) is the escape hatch for teams where work
keeps escaping the log.
<!-- worklog:taxonomy:end -->
