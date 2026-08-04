---
wiki_key: design/current-code-walkthrough
doc_type: design
truth_state: current
tag: v0.1.1
git_hash: PLACEHOLDER_SHA
branch: main
generated_at: 2026-08-04T03:26:00Z
roadmap: docs/roadmap.md
---

# OKF Forge — Code Walkthrough

A reading order for someone opening this repository for the first time.
Generated against `PLACEHOLDER_SHORT`, tag `v0.1.1`. Follow it top to bottom and the
architecture assembles itself; jump into `components/` first and it will not.

## Where to start: `src/lib/okf/types.ts`

Read this before anything else. It defines `Concept` — one parsed `.md` file —
along with `OkfBundle`, `TypedEdge`, `AppView`, and the closed vocabularies for
concept types and relationship types. Every other module is downstream of these
shapes.

The key realization is that `OkfBundle` is a flat `Record<path, content>`, not
a directory handle. That single decision is why a GitHub tarball, a file
upload, an in-memory scaffold, and a real folder all flow through identical
code afterwards.

## The engine: `src/lib/okf/graph.ts`

Fourteen exported functions, all pure, all operating on
`Record<path, Concept>`. No React, no I/O, no globals. This is where every
graph algorithm in the product lives, and the invariant in `CLAUDE.md` is that
it stays that way — graph logic never migrates into a component.

Read in this order:

1. **`loadConcepts` (`:22`)** — parses each file and builds the concept map.
   The subtle part is at the end: it filters `outbound` down to targets that
   actually exist. This keeps the runtime graph *closed*, so no traversal has
   to defend against dangling references. Broken links are not discarded, they
   survive in `edges`.
2. **`buildInbound` (`:55`)** — inverts the edge set. Impact analysis is a
   question about inbound edges, so this is the index that makes it cheap.
3. **`resolveConcept` (`:66`)** — accepts a path, a title, or a partial and
   returns a canonical path. Every user-facing graph action goes through it,
   which is why the UI can let people type what they remember.
4. **`criticalityOf` (`:100`)** — derives a criticality signal from frontmatter
   and graph position.
5. **`impact` (`:155`)** — blast radius, ranked by the above rather than
   returned flat.
6. **`pack` (`:195`)** — the progressive-disclosure function. Breadth-first
   from a root, bounded by *both* hop count and node budget. This is the one
   worth reading twice; it is the feature the product is really built around.
7. **`subgraph` (`:304`)** — the neighborhood view the canvas renders.
8. **`validateBundle` (`:349`)** — finds the broken links that `loadConcepts`
   deliberately left in `edges`, plus missing frontmatter and orphans. The
   symmetry between these two functions is the design.
9. **`buildFromBundle` (`:606`)** — the entry point everything else calls:
   parse plus validate in one step.

## State: `src/lib/okf/store.ts`

One Zustand store, and per `CLAUDE.md` the app's only state container. Every
component in `src/components/okf/` is a consumer.

Two things to understand here:

**`resolveWorkspaceSelection`** decides whether the logical OKF root is the
folder the user opened or a nested `sample-okf/` or `.okf/` subtree. It returns
a `workspacePrefix` that every subsequent disk read and write re-adds, because
bundle keys are relative to the logical root while the filesystem is not.
In-memory bundles clear `workspaceRoot` entirely so they cannot write to disk.

**`recompute`** reruns `buildFromBundle` over the whole bundle on every save.
`MAX_WORKSPACE_MD_FILES` (`:174`) caps this at 400 files. Past that cap the
approach does not degrade gracefully — it is a cliff, not a slope.

## The runtime split: `src/lib/platform/storage.ts`

The file that makes "one UI, two runtimes" true. It defines a `StorageProvider`
interface with two implementations, `HttpStorage` and `TauriStorage`, and one
selector:

- `isTauriRuntime()` (`:124-131`) sniffs `window.__TAURI_INTERNALS__`.
- `getStorage()` (`:133-137`) caches the choice at module scope.

Note the Tauri API imports are **dynamic** (`await import(...)`). That is what
keeps them out of the browser bundle. A static import here would ship Tauri
internals to every web visitor and break the build.

The module-level cache is also why `storage.test.ts` must call
`setStorageForTests(null)` in `afterEach` — without it the first test's
provider poisons every later one.

## The mirror: `fsCore.ts` and `fs_core.rs`

Read these two side by side. They are deliberate mirrors and the most important
invariant in the repository.

| TypeScript (`src/lib/platform/fsCore.ts`) | Rust (`src-tauri/src/fs_core.rs`) |
|---|---|
| `isInsideWorkspace` (`:31`) | `is_inside_workspace` (`:63`) |
| `resolveInWorkspace` (`:45`) | `resolve_in_workspace` (`:67`) |
| `collectFiles` (`:85`) | `collect_files` (`:108`) |
| `readWorkspaceFile` (`:110`) | `read_workspace_file` (`:167`) |
| `writeWorkspaceFile` (`:118`) | `write_workspace_file` (`:179`) |

Both implement one jail rule: realpath both sides, then check containment **by
path component**. The component check is not stylistic — a naive string-prefix
comparison lets `/ws-evil/x.md` escape a `/ws` jail, and there is a Rust test
named `rejects_sibling_directory_sharing_prefix` that exists solely to pin
that.

Changing filesystem behavior means changing both files and both test suites.

## The desktop surface: `src-tauri/src/lib.rs`

Eight commands, and they are the entire IPC contract: `set_workspace` (`:25`),
`get_workspace` (`:41`), `read_file` (`:47`), `write_file` (`:53`),
`list_markdown_files` (`:63`), plus `cli_status` (`:91`), `install_cli`
(`:96`), and `uninstall_cli` (`:101`). The workspace root lives in a
`Mutex<WorkspaceState>`, one per process.

`run()` (`:106`) does two things before the builder: it handles `--print-shim`,
and it scans argv for `--workspace <path>` and seeds that mutex. The seeding is
the whole reason `okff` needs no new IPC — `get_workspace` already answers
"which folder?", so a workspace set before the window exists is visible to the
frontend for free.

The bug class here is silent: the frontend sends
`invoke("list_markdown_files", { path })` and Rust declares
`fn list_markdown_files(path: String)`. Rename either side and **nothing fails
anywhere** — browser tests never reach this code and Rust tests never reach the
frontend. `src/lib/platform/storage.test.ts` exists specifically to pin the
command names and argument shapes against this file.

The `.setup()` block also carries a `#[cfg(feature = "automation")]` section
that registers the MCP bridge and WebDriver plugins and adds their capability
at runtime from `automation-capability.json` — deliberately outside
`capabilities/`, which `tauri-build` scans unconditionally and which would
therefore break every build made without the feature.

## The launcher: `src-tauri/src/cli.rs`

Read this after `lib.rs`. It renders the `okff` shim, parses `--workspace`, and
installs to `/usr/local/bin`.

Two decisions are worth the reading. First, the shim resolves the app **by
bundle identifier before absolute path** — a hardcoded path breaks the moment
someone drags `OKFForge.app` elsewhere, so the path survives only as a fallback
for a bundle LaunchServices has not registered yet. Second, rendering and
argument parsing are deliberately platform-independent while only the install
side effects are `#[cfg(target_os = "macos")]`, which is what keeps nine of the
eleven Rust tests running on the Linux CI runner.

`workspace_from_args` (`:36`) skips unknown arguments rather than reading the
first positional one. macOS hands every GUI launch a `-psn_0_…` process-serial
argument, and a positional reading would take that for a directory on every
double-click.

`--print-shim` in `lib.rs` exists for verification: it writes the exact
installed script to stdout, so the shim can be tested end to end without
touching a system directory — and without a hand-copied second copy of the text
that would drift from the real one.

## The UI: `src/components/okf/`

Fourteen files, 2,660 lines. `AppShell.tsx` is the frame; read it first.

The structural fact that surprises people: **there is effectively one route.**
All eight views are conditional renders driven by `store.view`, not
by URLs. `data-view` on `<main>` is how tests address a view, because nothing
else identifies which panel is mounted.

`AppShell.tsx` also owns the grid. The comment at `:86-88` records a real
regression: wrapping the sidebar and main in a container collapsed both into
the 280px left column, so the panels rendered but looked dead. `layout.spec.ts`
now asserts the topology that prevents it.

Three `useEffect` blocks handle, in order: bundle initialization, preference
boot plus the OS theme listener, and two keyboard handlers — save, and the
desktop-only zoom bindings guarded by `isTauriRuntime()`.

## The tree's keyboard model: `src/lib/okf/tree.ts`

Separate from `Sidebar.tsx` for the same reason `graph.ts` is separate from the
panels: this is the branchy part, and branchy things need tests.

`role="tree"` is a promise to assistive technology that arrows, Home/End, and
typeahead behave a specific way. Shipping the role without honouring it is
worse than the invalid `role="listbox"` it replaced, because it advertises a
contract the widget does not keep. `flattenTree` (`:43`) produces the visible
rows in exactly arrow-key order, which reduces navigation to array indexing;
`resolveTreeKey` (`:85`) maps a key press to an action or to `null`, and the
`null` is what lets the caller skip `preventDefault` so Tab still works.

One detail only the browser test caught: the roving tabindex has to follow
*real* focus, not just focus the component moved itself. A click or a
screen-reader jump does not go through the key handler, and without an
`onFocus` on each row the keyboard state and the DOM diverge.

## Preferences: `src/lib/okf/prefs.ts`

Small and worth reading as an example of the codebase's preferred shape: pure
functions plus exactly one impure writer (`applyPrefs`), which takes its target
element as an argument so tests can hand it a detached node.

`stepZoom` is the one with a real subtlety. It searches for the next step
*strictly past* the current value rather than snapping to the nearest step and
moving one index. The snap-first version skips a step: from an off-grid `1.06`
it lands on `1.25`, jumping over the `1.1` the user pressed for.

Persistence deliberately copies the shape already in `integrations.ts:192-214`
— an `okf-workbench-*-v1` key, an SSR guard, and a try/catch that degrades to
defaults. Validation is per field, so a corrupt `zoom` does not discard a valid
`theme`.

## Styling: `src/styles.css`

Tailwind v4, and the theming has a trap worth knowing before you touch it.
Colour tokens are defined twice — a `--okf-*` layer under `:root[data-theme]`
selectors — and then referenced through `@theme inline`.

The `inline` keyword is load-bearing. Without it Tailwind resolves `--color-*`
once at `:root` and bakes the literal value into every utility class, so
flipping `data-theme` changes the attribute and repaints nothing. The failure
is completely silent. `layout.spec.ts › the light theme actually repaints the
surface` exists to catch exactly that.

## Where the traps are documented

`CLAUDE.md` is the onboarding contract and `AGENTS.md` symlinks to it. Its
Gotchas section is not decorative — it records dead code, the dev-only nature
of `/api/fs`, the absence of YAML and Markdown libraries, the reparse-on-save
cliff, and the committed build artifacts. Read it before the first change, not
after the first surprise.
