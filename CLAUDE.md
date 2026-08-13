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
| `npm run dev` | Vite on `0.0.0.0:<resolved port>`. The port is **never** hardcoded — see Invariants. |
| `npm run port` | Prints the resolved dev port. |
| `npm run build` | Web/SSR prod build (Nitro → `.vercel/output/`) then `db:migrate`. |
| `npm run build:tauri` | SPA-only build for the desktop webview → `dist/`. |
| `npm run tauri:dev` | Native window against the Vite dev server. |
| `npm run tauri:build` | Full desktop package → `src-tauri/target/release/bundle/`. |
| `npm run typecheck` | `tsc --noEmit`. Covers `src/` only. |
| `npm test` | **Both** unit tiers: `node:test` for `tests/`, then vitest for `src/`. |
| `npm run test:e2e` | Playwright. Needs `npx playwright install chromium`. |
| `npm run test:desktop` | WebdriverIO against the real Tauri window. Needs `tauri:build:automation` first. |
| `npm run test:rust` | `cd src-tauri && cargo test`. |
| `npm run verify` | typecheck + unit + e2e. **Does not run lint, build, rust, or desktop.** |
| `npm run lint` / `format` | `eslint .` / `prettier --write .` |
| `npm run wireframes` / `wiki` | Re-render `.puml` → PNG / publish docs to the GitHub wiki. |
| `npm run screenshots` | Re-shoot the README images. Needs `npm run dev` already running. |

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
  integrations.ts  DeepAgents / Claude plugin / MCP exporters + localStorage
  prefs.ts         theme + zoom; pure except one applyPrefs(root) DOM writer
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
- **The dev port is resolved, never hardcoded.** `scripts/dev-port.mjs` is the
  single source of truth: it probes for a free port at or above 8080, remembers
  it in `.dev-port` (gitignored), and every consumer reads from it —
  `vite.config.ts`, `playwright.config.ts`, the Tauri `devUrl` (via
  `tauri dev --config`), `startup.sh`, and the smoke scripts. Several Tauri
  projects share this machine and they all ship the same default port; a
  collision used to make Playwright's `reuseExistingServer` silently run the
  whole suite against *another project's app*. `npm run port` prints the
  current one; `OKF_DEV_PORT=9000 npm run dev` overrides for one run. Never
  reintroduce a literal port, and never bind a second dev port in web mode.
- **Graph logic stays pure** in `src/lib/okf/*`; UI in `src/components/okf/*` wires
  through `store.ts`. Don't put graph algorithms in components.
- **`@theme inline` is load-bearing and fails silently.** Colour tokens are defined
  twice in `src/styles.css` — a `--okf-*` layer under `:root[data-theme="light"]`
  and `:root[data-theme="dark"]` — and referenced through `@theme inline`. Drop
  `inline` and Tailwind resolves `--color-*` once at `:root` and bakes the literal
  value into every utility, so flipping `data-theme` repaints **nothing** and no
  error appears anywhere. `layout.spec.ts › the light theme actually repaints the
  surface` exists solely to catch that. Never add a colour straight to a plain
  `@theme` block, and never hardcode a hex in a component.
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
- **SVG presentation attributes do not reliably honour `var()`.** `fill="var(--x)"`
  is a coin flip; `style={{ fill: "var(--x)" }}` always resolves, and CSS beats the
  attribute anyway. `GraphCanvas.tsx` shipped nine hardcoded dark hex values this
  way and would have rendered white-on-white in light mode.
- **Zoom rides the root font size** (`html { font-size: calc(16px * var(--okf-zoom)) }`),
  so anything in `rem` scales and anything in `px` does not. Borders and shadows
  stay px deliberately. Use `text-[0.6875rem]`, never `text-[11px]`.
- **Zoom keybindings are desktop-only**, gated on `isTauriRuntime()`. In a browser
  `Cmd +/-` belongs to the browser, which already persists it per origin.
- `npm run tauri:build` produces a working `.dmg` and `.app` on macOS. The
  `--no-bundle` flag on `tauri:build:automation` is a *speed* choice for the
  test binary, not a workaround: WebdriverIO launches the bare executable at
  `target/debug/okfforge`, so packaging it would be wasted minutes.

## Desktop automation (opt-in)

`--features automation` compiles in an MCP bridge (agent-driven inspection) and
an embedded WebDriver server. They are **optional cargo deps**, not
`debug_assertions` gates, so a release build does not contain them at all.

```
npm run tauri:dev:automation      # dev window with both surfaces
npm run tauri:build:automation    # debug binary (--no-bundle)
npm run test:desktop              # WebdriverIO against that binary
```

Three traps, all already paid for:

- **The capability is added at runtime**, from `src-tauri/automation-capability.json`
  — deliberately *outside* `capabilities/`, which `tauri-build` scans
  unconditionally. A static file naming `mcp-bridge:default` fails every build
  with the feature off.
- **`add_capability` needs `tauri/dynamic-acl`**, which the `automation` feature
  pulls in so release builds skip it.
- **WebdriverIO needs two Rust crates** — `tauri-plugin-wdio` (always) and
  `-webdriver` (the embedded server that makes macOS work). Playwright cannot
  drive Tauri on macOS at all: only Windows' WebView2 speaks CDP.

`@wdio/native-utils` is pinned to 2.5.0 in `overrides` — `@wdio/tauri-service@1.2.0`
pins 2.4.0 exactly but imports a symbol only 2.5.0 exports.

`npm run test:desktop` is **not** a required check; it runs weekly and on demand
(`.github/workflows/desktop-e2e.yml`). Scope it to what only the real runtime can
prove — the native window, the FS jail, the picker. The React tree is identical
in both runtimes by design.

## Test tiers

Four runners, four **disjoint** globs. Putting a test in the wrong directory
means it either runs twice or never — there is no overlap and no `testIgnore`.

| Tier | Glob | Runner | Required check? |
|---|---|---|---|
| pure functions | `tests/*.test.ts` | `node:test` | yes (`checks`) |
| component / integration | `src/**/*.test.ts(x)` | vitest + jsdom | yes (`checks`) |
| web end-to-end | `e2e/*.spec.ts` | Playwright | yes (`e2e`) |
| desktop end-to-end | `e2e-desktop/specs/*.e2e.ts` | WebdriverIO, real window | **no** |

Two import conventions, and they are not interchangeable:

- `tests/` uses `node:test` + `node:assert/strict` and imports source with
  **explicit `.ts` extensions** — types are stripped, not compiled.
- `src/` uses vitest and imports **without** an extension (bundler resolution).
  Colocation here is deliberate: `tsconfig`'s `include: ["src"]` means these
  tests are typechecked, which the `tests/` tier is not.

`vitest.config.ts` is standalone on purpose. Merging it into `vite.config.ts`
would drag in the serve-only plugins, and `pgliteBootstrap` boots a database in
`configureServer` — you would stand up PGlite to test a string function.

## Conventions

- Prefer e2e coverage for user-visible flows; put `data-testid` on critical controls
  (`header-open`, `open-workspace`, `theme-toggle`).
- Prettier: double quotes, semicolons, trailing commas, width 100. `no-explicit-any`
  is **off**; `no-unused-vars` is a warning ignoring `^_`.
- **CI gates `main`.** `.github/workflows/ci.yml` runs `checks`, `e2e`, and `rust`;
  with worklog's `invariants` these are four required contexts, and `main` refuses
  force-pushes. Keep app jobs in `ci.yml`, **never** in `worklog.yml` — that file is
  re-copied by `worklog init` and your jobs would vanish on the next upgrade.
- `npm run verify` before pushing is still worth it; it is faster than a red PR.
- Before a desktop release, run the DEVELOPERS.md §8 checklist on a real host.

## Releasing

`CHANGELOG.md` holds a `## X.Y.Z — unreleased` section written **as features
land**, not reconstructed at tag time. Released sections are frozen: corrections
go in the next release's notes.

Cutting one (the `worklog:release` skill drives this): stamp the changelog date
in UTC → `worklog roadmap-snapshot --name vX.Y.Z-release` → `worklog ia-index` →
land it as a PR (the branch guard refuses commits directly on `main`) → tag the
merge commit → `gh release create` → regenerate `docs/designs/current_*` against
the tag and freeze the dated pair → refresh README/USER_GUIDE → `npm run wiki`.

Docs land **after** the tag. They describe the release; the release does not wait
on them.

## UI change loop

Any change under `src/components/okf/` or `src/styles.css` follows this loop.

1. **Read** `docs/designs/ui-<view>.md` — spec, element inventory, rubric. No spec
   for the view you're changing? Write one first (template: `ui-editor.md`).
2. **Implement.** The element inventory is a contract: adding or removing a control
   means updating the spec and its `git_hash` in the same commit.
3. **Screenshot, in both themes.** Web: chrome-devtools MCP — resize to 1280×800,
   navigate, click `nav-<view>`, screenshot. That MCP needs Chrome already running
   with `--remote-debugging-port=9222`; when it isn't, a throwaway Playwright
   script driving `chromium.launch()` is faster than starting one. Desktop-only
   behavior (native picker, FS jail) needs the Tauri MCP. Screenshots go to the
   scratchpad, never to `screenshots/` (those are README assets).
4. **Judge** only the rubric rows marked `agent`. Also take an accessibility
   snapshot and read console messages — a console error is a failure. **Never
   compare a screenshot to the Salt wireframe**: it is authoritative for element
   inventory, containment order, and ordinal sequence, not pixels. And never
   compare light against dark — every rubric has an *Acceptable differences*
   section naming what does not count, and a judge without one reports every
   pixel delta as a finding.
5. **Verify.** `npm run test:e2e -- layout.spec.ts`. Every rubric row with a named
   Check must pass. Those are the gate; `agent` rows are advice.
6. **Iterate** from 2. Report `agent`-row concerns in the PR body; never block a
   merge on them.

**If the change alters anything the README shows** — the nav, the branding, the
sidebar, a view the README embeds — run `npm run screenshots` in the same PR.
Nothing checks an image, so a stale README is invisible: the hero sat on a
public repo advertising the pre-rename "OKF Motion" name, a seven-item nav, and
the flat sidebar for two releases after all three changed. The script re-shoots
all six; look at the output before committing, because a script that runs is not
a screenshot that is correct.

Wireframes: edit the `.puml`, run `npm run wireframes` to re-render, then
`npm run wiki` to publish. `npm run wiki` renders the worklog manifest into the
wiki checkout, strips frontmatter (Gollum shows it as raw text), copies wireframe
PNGs to the flat wiki root, and corrects the banner on `docs/designs/ui-*.md` —
worklog treats every design doc except `current_design_doc.md` as a frozen dated
artifact, which these are not. Never patch `bin/` for this; it is re-copied on
every worklog upgrade.

E2E tests must call `gotoApp()` from `e2e/helpers.ts` before interacting. The web
build is SSR, so static copy is visible before React hydrates — clicking earlier
lands on a real, enabled element with no handler and fails with a symptom that
looks nothing like the cause.

**SSR also means anything a script mutates on `<html>` before hydration is a
React mismatch error**, which `layout.spec.ts` treats as a failure. `__root.tsx`
carries `suppressHydrationWarning` for exactly that reason: the theme bootstrap
script stamps `data-theme` pre-paint, and `localStorage` cannot be read on the
server. Its copy in `tauri.html` is duplicated verbatim on purpose — sharing a
module would cost a round trip and reintroduce the flash it prevents.

## More docs

`DEVELOPERS.md` (dev workflow, Tauri build/deploy, pre-release checklist),
`DESKTOP.md` (dual-mode cheat sheet), `FEATURES.md`, `USER_GUIDE.md`, `README.md`,
`CHANGELOG.md`.

`docs/designs/current_design_doc.md` and `current_code_walkthrough.md` are
regenerated against each release tag. The walkthrough is the fastest way into the
codebase: it gives a reading order and names where the traps are.

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
