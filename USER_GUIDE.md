# User guide

How to use and configure **OKFForge**.  
Back to **[README.md](./README.md)** · Features: **[FEATURES.md](./FEATURES.md)** · Developers: **[DEVELOPERS.md](./DEVELOPERS.md)**

OKFForge runs two ways:

| Mode | How you launch it | Files on disk |
|------|-------------------|---------------|
| **Web** | Browser + `npm run dev` (or a deployed URL) | Optional via `/api/fs` + `OKF_WORKSPACE` |
| **Desktop (Tauri)** | Native window — `npm run tauri:dev` or an installed app | Native folder picker + jailed FS |

Most of the UI is the same. **Desktop is what you want for day-to-day editing of a real OKF folder on your machine.**

---

## 1. Opening the app

### 1.1 Web

```bash
npm install
npm run dev
```

Open the app in your browser (live preview, or `http://localhost:8080` if you run it yourself).

### 1.2 Desktop (Tauri) — overview

The desktop app is a **Tauri 2** shell around the same React UI:

- A real OS window (not a browser tab)
- **Open folder** uses the system file dialog
- Read/write Markdown under that folder only (security jail)
- Header shows **Desktop workbench** when running under Tauri

You can either:

1. **Develop / try from source** — `npm run tauri:dev`  
2. **Install a built app** — `npm run tauri:build`, then install the `.dmg` / `.msi` / `.AppImage` / `.deb`  

Detailed steps: [§2 Running as a Tauri app](#2-running-as-a-tauri-app).

---

## 2. Running as a Tauri app

### 2.1 What you need (once)

On the machine where you build or run from source:

| Requirement | Notes |
|-------------|--------|
| **Node.js 22+** | `npm install` at the project root |
| **Rust** | [rustup](https://rustup.rs/) — stable toolchain, 1.77+ |
| **Tauri system libraries** | Platform packages for WebView + build tools — follow the official guide: [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) |

**By OS (high level):**

- **macOS** — Xcode Command Line Tools (`xcode-select --install`)
- **Windows** — Microsoft C++ Build Tools, WebView2 (often already present on Win10/11; installers can bootstrap it)
- **Linux** — packages such as `pkg-config`, WebKitGTK, GTK 3, glib (names vary by distro; see Tauri docs)

If you only install a **prebuilt** binary from someone else, you do **not** need Node/Rust — just WebView2 on Windows, and a normal desktop environment on Linux/macOS.

### 2.2 Run from source (development desktop)

From the project root:

```bash
npm install
npm run tauri:dev
```

What happens:

1. Tauri starts the **Vite** web UI (`npm run dev` → port **8080**).
2. A **native window** loads that UI (title: **OKFForge**).
3. The window is resizable (default about 1280×800; min ~900×600).

Leave the terminal open while you work. Stopping the process closes the desktop session (and the dev server it started).

**Tip:** Do not run a second conflicting server on port 8080. `tauri:dev` expects that port for the embedded UI.

### 2.3 Day-to-day use on desktop

1. Launch with `npm run tauri:dev` (or open the installed app — §2.4).
2. Confirm the header subtitle says **Desktop workbench** (web says “Graph engineering workbench”).
3. Click **Open** in the header.
4. Choose **Open folder (native)** — the OS folder dialog appears.
5. Select a directory that is (or will be) an OKF repo (Markdown tree with agents/knowledge/etc.).
6. The app lists all `.md` files, builds the graph, and enables **Save** to **write files on disk** under that folder only.
7. Edit, run impact/pack/search as in the rest of this guide.
8. **⌘S / Ctrl+S** or **Save** persists the current file to disk.

You can still load **Sample**, **GitHub**, or **upload** from the same Open dialog; those modes stay in memory until you **Open folder (native)** if you want durable local saves.

### 2.4 Build and install a standalone app

When you want an app you can launch without a terminal:

```bash
npm install
npm run tauri:build
```

This:

1. Builds the frontend SPA into `dist/` (`build:tauri`)
2. Compiles the Rust shell
3. Produces installers / packages under:

```text
src-tauri/target/release/bundle/
```

| Platform | Typical artifacts |
|----------|-------------------|
| **Windows** | `.msi` installer, `.exe` under `target/release/` |
| **macOS** | `.app`, `.dmg` |
| **Linux** | `.AppImage`, `.deb` |

Also useful:

```text
src-tauri/target/release/okfforge      # Linux/mac binary name
src-tauri/target/release/okfforge.exe  # Windows
```

**Portable Windows:** you can run the `.exe` without the MSI if **WebView2** is available. The project is configured to help download/bootstrap WebView2 when needed. If the app fails to open with a blank window, install [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) and retry.

**Linux AppImage:** mark executable and run:

```bash
chmod +x OKF*.AppImage
./OKF*.AppImage
```

### 2.5 Desktop vs web (what changes for you)

| | **Web** | **Tauri desktop** |
|--|---------|-------------------|
| Launch | Browser | Native window / installed app |
| Open folder | Server `OKF_WORKSPACE` via `/api/fs` (or browser file pick → memory) | **System folder dialog** |
| Save to disk | Only if web workspace API is configured | **Yes**, under the opened folder |
| GitHub load | Yes (public repos) | Yes (needs network) |
| Sample-okf | Bundled | Bundled (same UI) |
| Playwright / browser agents | Primary test surface | Not required for normal use |
| Offline after install | Depends on host | UI runs offline; GitHub load needs net |

### 2.6 Desktop security (important)

When you open a folder on Tauri:

- The app may **only** read/write paths **inside** that folder.
- Paths like `../secrets` or a sibling directory that only *looks* similar (`my-okf-evil` vs `my-okf`) are **denied**.
- That is intentional — same rules as the web `/api/fs` jail used in testing.

Open the **root of your OKF repo**, not a parent that contains unrelated private files you do not want the app to touch.

### 2.7 Desktop troubleshooting

| Symptom | What to try |
|---------|-------------|
| `tauri:dev` fails on missing libraries | Install [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS |
| Window opens blank | Check that port 8080 is free; look at the terminal for Vite errors |
| **Open folder** does nothing | Stay on `tauri:dev` or an installed build; grant OS dialog permission if prompted |
| Save does not update files | Confirm you used **Open folder (native)** (workspace root set); check the folder is writable |
| GitHub fails offline | Expected without network; use local folder or sample |
| Windows: app won’t start | Install/repair WebView2; try the MSI install |
| Build very slow first time | Normal — Rust crates compile once |

More build/architecture detail: **[DEVELOPERS.md](./DEVELOPERS.md)** and **[DESKTOP.md](./DESKTOP.md)**.

---

## 3. First five minutes

1. Land on **Learn OKF** — step through dual graph, frontmatter, impact, packs.  
2. Click **Open Graph Engineer** (or pick a file in the sidebar).  
3. Try **Preview / Markdown / Split** in the header.  
4. Click **Run impact analysis** or open **Graph & Search**.  
5. **Open** → sample, GitHub, or (on desktop) **Open folder (native)** for your repo.

---

## 4. Opening a workspace

Click **Open** in the header.

| Option | When to use |
|--------|-------------|
| **Open folder (native)** | **Tauri desktop:** pick a real directory; saves write to disk. |
| **`okff <dir>` in a terminal** | **Tauri desktop:** skip the picker entirely — see §10.5. |
| **Open web workspace** | **Web only:** load the server’s `OKF_WORKSPACE` (default sample-okf on disk via `/api/fs`). |
| **Sample: okf-plugin / sample-okf** | Instant dual-graph demo (in-memory until you open a writable folder/workspace). |
| **GitHub** | Public repos, e.g. `SpillwaveSolutions/okf-plugin/sample-okf`. |
| **Choose folder / .md files** | Browser upload (in-memory bundle). |
| **Scaffold** | Empty OKF skeleton with a starter agent. |

### Saving to disk

- **Desktop:** after **Open folder (native)**, **Save** / ⌘S writes through the Tauri FS jail.  
- **Web:** after loading the `/api/fs` workspace, saves go to `OKF_WORKSPACE`.  
- Sample / GitHub / pure upload sessions keep changes in memory until you open a writable workspace.

Keyboard: **⌘S** / **Ctrl+S**.

---

## 5. Editor

1. Select a file in the **sidebar** (filter box narrows the list).  
2. Choose view mode:
   - **Preview** — rendered Markdown  
   - **Markdown** — raw source  
   - **Split** — both  
3. Use the toolbar for formatting helpers, or **Impact** / **Pack** for the current path.  
4. **Save** when dirty (button shows “Saved” when clean).

Frontmatter stays in the source. Preview focuses on the body after the closing `---`.

---

## 6. Explorer

**Explorer** shows:

- Bundle name and source  
- Validation summary (concept/edge counts, errors)  
- Type histogram  
- Focus graph  
- Directory cards — click a concept to open the editor  

---

## 7. Graph & Search

### Search

1. Type in the header search or the panel search field.  
2. Press **Enter** or **Search**.  
3. Click a hit to open that concept.

### Impact

1. Choose a **target concept**.  
2. **Compute impact**.  
3. Review inbound/outbound counts and **suggested update order**.  
4. Click a path to jump to the editor.

Use before large structural edits (renames, type changes, edge rewiring).

### Context pack

1. Set **hops** (default 2) and **max nodes** (default 20).  
2. **Build pack**.  
3. Read the progressive-disclosure Markdown (what you’d hand a long-running agent).

### Neighborhood graph

- Adjust **hops**.  
- Click a node to select that concept.  
- Typed edges show relationship labels; plain links are dashed.

### Validation

- Errors (e.g. broken links) and warnings (e.g. unverified high-impact types) list at the bottom.  
- Click paths to open the file.

---

## 8. Classify documents

1. Open **Classify**.  
2. **Upload markdown** and/or **paste** content → **Add pasted doc**.  
3. **Classify documents**.  
4. Review each suggestion: accept, fix type/path/title/tags.  
5. Set **Bundle name** → **Create OKF repo**.

The new bundle becomes the active workspace in memory. On **desktop**, use **Open folder (native)** (or save into an already-opened folder via edits + Save) when you want files on disk. On **web**, use a configured `OKF_WORKSPACE` if you need the FS API.

---

## 9. DeepAgents

1. Open **DeepAgents**.  
2. Edit agent **name**, **description**, pack **hops** / **max nodes**.  
3. On **Skill map**, enable skills and optionally mark as **Subagent**.  
4. Switch to **JSON export** or **Python** → **Copy** or **Download**.  
5. Drop exports into your LangChain DeepAgents harness / repo.

Skill mappings default to okf-graph-eng skills (init, author, impact, query, validate, maintain, visualize, …).

---

## 10. Plugins & MCP

1. Open **Plugins & MCP**.  
2. **Claude plugins** — enable okf-graph-eng, add other plugins by name/source.  
3. **MCP servers** — enable stdio (command + args) or remote (URL) servers.  
4. **Export config** — copy JSON for your host (Claude Code / MCP client).  

Settings persist in **browser localStorage** (per origin). The Tauri webview uses the same mechanism for that desktop profile.

---

## 10.5 Settings — the `okff` command line

The **Settings** view (last item in the nav) installs `okff`, a small script
that opens OKF Forge on a directory from any terminal:

```sh
okff .            # open the current directory
okff ~/my-okf     # open a specific one
okff --help
```

Click **Install okff** in Settings. It writes `/usr/local/bin/okff`, which is
already on the default macOS `PATH`, so the command works in a new shell with
no profile edit. If that directory is not yours to write to — the default on a
machine without Homebrew — macOS asks for your password once. **Remove** takes
it back off.

Each `okff` opens its **own window**, so you can keep two workspaces side by
side. The two windows share one preferences store, so a theme or zoom change in
one reaches the other only after that window reloads.

macOS only for now. The web build shows the command's usage but cannot install
it — a browser has no way to write to your `PATH`.

---

## 11. Configuration

### Environment (web server)

| Variable | Default | Meaning |
|----------|---------|---------|
| `OKF_WORKSPACE` | `public/sample-okf` | Root for `/api/fs` read/write in **web** mode |
| `MOTION_WORKSPACE` | (fallback) | Accepted as alias of `OKF_WORKSPACE` |

```bash
OKF_WORKSPACE=~/notes/my-okf npm run dev
```

Playwright e2e creates a scratch copy of sample-okf and sets `OKF_WORKSPACE` automatically.

**Tauri desktop** does not use `OKF_WORKSPACE` for the main folder open path — you pick the folder in the dialog. Env vars are mainly for web/dev testing.

### In-app preferences

| Setting | Where | Storage |
|---------|-------|---------|
| Plugins, MCPs, skill mappings, DeepAgent name/description/pack opts | Integrations + DeepAgents panels | `localStorage` |
| Editor view mode | Header toggle | Session (Zustand; resets on full reload) |
| Learn step | Learn panel | Session |

### Desktop security (summary)

See [§2.6](#26-desktop-security-important): jailed to the opened folder; no `..` escape; no sibling prefix tricks.

---

## 12. Typical workflows

### A. Learn dual graph on sample-okf

Learn → Open Graph Engineer → Graph & Search → Impact + Pack → DeepAgents export.

### B. Edit a local OKF repo (desktop)

```bash
npm run tauri:dev
```

Open → **Open folder (native)** → choose your repo → edit → Save.  
(Or install via `npm run tauri:build` and launch the app the same way.)

### C. Bring your own GitHub OKF

Open → GitHub → `owner/repo` or `owner/repo/sample-okf` → Explorer → fix validation warnings.  
On desktop, later **Open folder (native)** if you clone the repo and want local saves.

### D. Bootstrap from messy docs

Classify → upload → classify → create repo → Editor polish → **Open folder (native)** (desktop) or web workspace to persist.

### E. Agent harness packaging

DeepAgents skill map → JSON/Python download → Plugins & MCP export for Claude Code.

---

## 13. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Empty sidebar | Wait for load; or Open → Sample / workspace |
| Save does nothing | Need dirty content; disk save needs an open workspace root (native folder or web `/api/fs`) |
| GitHub load fails | Repo must be public; path must contain `.md` files; need network |
| Impact “not found” | Pick a path from the dropdown after a bundle is loaded |
| `/api/fs` 403 | Path outside `OKF_WORKSPACE` — expected jail (web) |
| Desktop open does nothing | Use `tauri:dev` or installed build; grant dialog permissions |
| Tauri build fails | Install OS prerequisites; see [§2.1](#21-what-you-need-once) and **DEVELOPERS.md** |

Desktop-specific issues: [§2.7](#27-desktop-troubleshooting).

---

## 14. Keyboard & a11y notes

- **⌘S / Ctrl+S** — save  
- **⌘+ / ⌘− / ⌘0** — zoom the interface in, out, and back to 100%. **Desktop
  only**: the Tauri webview has no built-in zoom, which is why this exists,
  while a browser already provides it and remembers it per site. Eight steps
  from 80% to 200%; the level appears in the status bar whenever it is not
  100%, and survives a restart.
- **Theme** — the sun/moon/monitor button in the header cycles
  **system → light → dark**. It starts on *system*, so the app matches your
  desktop, and it follows a change to your OS setting live while it stays on
  system. Your choice is remembered and applied before the window first
  paints, so there is no flash of the wrong theme on launch.
- **The file tree is keyboard-navigable.** Tab into it once, then:
  **↑ / ↓** move between visible rows · **→** opens a folder, or steps into an
  already-open one · **←** closes a folder, or climbs to its parent ·
  **Home / End** jump to the first and last visible row · **Enter** or
  **Space** opens the focused file · and typing a few letters jumps to the row
  whose name starts with them. Tab leaves the tree in one press rather than
  walking every file in the workspace.
- It carries `role="tree"` / `role="treeitem"` with depth announced through
  `aria-level`, so a screen reader reports the nesting the flat markup no
  longer shows.
- Open dialog is `role="dialog"` with aria-label  
- Focus-visible outlines on interactive controls  

---

## See also

- **[FEATURES.md](./FEATURES.md)** — exhaustive feature list  
- **[DEVELOPERS.md](./DEVELOPERS.md)** — build, test, architecture (including Tauri for contributors)  
- **[DESKTOP.md](./DESKTOP.md)** — dual-mode / binary cheatsheet  
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) — OS packages for desktop builds  
