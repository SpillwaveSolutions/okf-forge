# Developers guide

Setup, build, test, and architecture for **OKFForge**.  
Back to **[README.md](./README.md)** · Features: **[FEATURES.md](./FEATURES.md)** · Users: **[USER_GUIDE.md](./USER_GUIDE.md)**

**Tauri build & local deploy** → [§7](#7-build--deploy-the-tauri-app-locally)

---

## 1. Stack

| Layer | Tech |
|-------|------|
| UI | React 19, TypeScript, Tailwind v4, Lucide |
| Web framework | Vite 8, TanStack Start / Router (SSR → Vercel via Nitro) |
| State | Zustand |
| Desktop | Tauri 2 (Rust), plugins: dialog, fs, log |
| Tests | Node test runner (FS jail), Playwright e2e, Rust `fs_core` unit tests |
| Sample data | Bundled okf-plugin sample-okf + skill meta |

---

## 2. Prerequisites

### Web

- **Node.js 22+**
- npm (lockfile present)
- Playwright Chromium for e2e:  
  `npx playwright install chromium`

### Desktop (Tauri)

- **Rust** 1.77+ via [rustup](https://rustup.rs/)
- **Node 22+** and `npm install` at repo root
- [Tauri 2 system dependencies](https://v2.tauri.app/start/prerequisites/)

| OS | Typical requirements |
|----|----------------------|
| **macOS** | Xcode Command Line Tools (`xcode-select --install`) |
| **Windows** | [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload), [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) |
| **Linux** | `pkg-config`, WebKitGTK, GTK 3, glib, etc. (names vary — use Tauri’s distro list) |

Verify:

```bash
node -v          # v22+
rustc --version  # 1.77+
cargo --version
# optional: cargo tauri info  (via npm run tauri -- info)
```

CI/containers without GTK/WebKit can still run **web** builds, unit tests, e2e, and **`npm run build:tauri`** (SPA only). Full `cargo test` / `tauri build` needs the native toolchain on a real desktop OS.

---

## 3. Install

```bash
git clone <this-repo>
cd okfforge   # or workspace root
npm install
```

Optional: Playwright browsers for e2e.

```bash
npx playwright install chromium
```

Rust is only required for desktop compile; it is not pulled by `npm install`.

---

## 4. Development

### Web (primary)

```bash
npm run dev
# listens on 0.0.0.0:8080 — required for live preview contracts
```

Optional real-disk workspace for `/api/fs`:

```bash
OKF_WORKSPACE=/absolute/path/to/okf-repo npm run dev
```

Default workspace if unset: `public/sample-okf`.

### Desktop (hot reload)

```bash
npm run tauri:dev
```

- Runs `beforeDevCommand`: `npm run dev` (Vite on **8080**)
- Opens a native window at `devUrl`: `http://127.0.0.1:8080`
- HMR works through the webview for frontend edits
- Rust changes require restarting `tauri:dev`

Do not change the web **host/port** without updating `src-tauri/tauri.conf.json` (`devUrl` / `beforeDevCommand`) and any preview contracts.

---

## 5. Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server `0.0.0.0:8080` |
| `npm run build` | Production **web** (TanStack Start + Nitro Vercel) + db migrate hook |
| `npm run build:tauri` | Client-only SPA → `dist/` for Tauri webview |
| `npm run preview` | Preview production-ish server on 8080 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | FS jail unit tests (`tests/**/*.test.ts`) |
| `npm run test:e2e` | Playwright (UI + `/api/fs`) |
| `npm run test:rust` | `cargo test` in `src-tauri` (needs system libs) |
| `npm run verify` | typecheck + unit + e2e |
| `npm run tauri` | Pass-through to `@tauri-apps/cli` |
| `npm run tauri:dev` | Desktop dev (Vite + webview) |
| `npm run tauri:build` | Release binary + OS installers |
| `npm run smoke` | Headless screenshot smoke |

---

## 6. Production web build (Vercel)

```bash
npm run build
```

Output: `.vercel/output/` (Nitro `preset: "vercel"`).  
Static assets include `public/` sample data (`sample-okf-bundle.json`, plugin meta).

Ensure:

- Client asset URLs resolve (no blank page / wrong MIME for JS modules)  
- `npm run typecheck` is clean  

This path is **not** what Tauri packages. Desktop uses the SPA pipeline in [§7](#7-build--deploy-the-tauri-app-locally).

---

## 7. Build & deploy the Tauri app locally

End-to-end: compile a **standalone desktop app**, install it on **this machine**, and run it without a terminal.

### 7.1 Mental model

```text
npm run tauri:build
        │
        ├─ beforeBuildCommand → npm run build:tauri
        │       vite.tauri.config.ts
        │       tauri.html + src/tauri-main.tsx → dist/
        │       (copies public/ sample data into dist/)
        │
        └─ cargo / tauri-cli packages dist/ into a native binary
                + installers under src-tauri/target/release/bundle/
```

| Piece | Role |
|-------|------|
| `vite.tauri.config.ts` | SPA build (no TanStack SSR / Nitro) |
| `scripts/build-tauri.mjs` | Runs Vite, renames `tauri.html` → `dist/index.html` |
| `src-tauri/tauri.conf.json` | `frontendDist: "../dist"`, `beforeBuildCommand`, bundle targets |
| `src-tauri/src/*` | Rust commands (workspace jail, dialog) |

Web production (`npm run build` → Vercel) and desktop production (`build:tauri` → `dist/`) are **intentionally separate**.

### 7.2 One-command release build

On a machine with full Tauri prerequisites:

```bash
cd /path/to/repo
npm install
npm run typecheck          # recommended gate
npm run tauri:build
```

First run downloads/compiles Rust crates and can take several minutes. Later builds are faster.

Equivalent CLI forms:

```bash
npx tauri build
# or
npm run tauri -- build
```

Debug desktop binary (faster compile, not for sharing):

```bash
npm run tauri -- build --debug
# → src-tauri/target/debug/…
```

Frontend-only check (no Rust — useful in constrained CI):

```bash
npm run build:tauri
ls dist/index.html dist/assets dist/sample-okf-bundle.json
```

### 7.3 Where artifacts land

After a successful release build:

```text
src-tauri/target/release/
  okfforge              # Linux / macOS binary name (crate/product)
  okfforge.exe          # Windows
  bundle/
    macos/                # .app (when building on macOS)
    dmg/                  # .dmg
    msi/                  # Windows installer
    nsis/                 # optional NSIS, if enabled by toolchain
    deb/                  # Debian package
    appimage/             # Linux AppImage
    rpm/                  # if produced on RPM-based hosts
```

Exact subfolders depend on **host OS** (`bundle.targets: "all"` builds what that platform can produce). Cross-compiling installers for another OS generally requires that OS or a specialized CI matrix — build on macOS for `.dmg`, on Windows for `.msi`, on Linux for AppImage/deb.

Config source of truth:

- Product name: **OKFForge** (`productName`)
- Identifier: `com.okf.forge`
- Version: `src-tauri/tauri.conf.json` → `version` (keep in sync with releases)

### 7.4 Local deploy — install and run on this machine

#### Option A — Run the raw release binary (fastest smoke test)

**macOS / Linux:**

```bash
./src-tauri/target/release/okfforge
# if the binary name differs, use:
ls src-tauri/target/release/
```

**Windows (PowerShell):**

```powershell
.\src-tauri\target\release\okfforge.exe
```

No installer needed. Good for verifying the build before packaging.

#### Option B — Install a platform package (recommended for daily use)

**macOS**

1. Open the `.dmg` under `src-tauri/target/release/bundle/dmg/`.
2. Drag **OKFForge** into Applications.
3. First launch: if Gatekeeper blocks an unsigned build, right-click → **Open**, or  
   `xattr -cr "/Applications/OKFForge.app"` (dev only; prefer proper signing for distribution).

**Windows**

1. Run the `.msi` under `bundle/msi/` (or NSIS installer if present).
2. Or copy `okfforge.exe` for a portable run — requires **WebView2**.  
   `tauri.conf.json` sets `webviewInstallMode.downloadBootstrapper` so missing runtimes can be fetched.
3. Start from Start Menu or the installed path.

**Linux**

AppImage:

```bash
chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage
```

Debian:

```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb
# fix deps if needed:
sudo apt-get install -f
okfforge   # or launch from the desktop entry
```

#### Option C — “Local deploy” script pattern

Example install-to-home without a system package manager (Linux/macOS):

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run tauri:build
BIN="$ROOT/src-tauri/target/release/okfforge"
install -m 755 "$BIN" "$HOME/.local/bin/okfforge"
echo "Installed → $HOME/.local/bin/okfforge"
echo "Ensure ~/.local/bin is on PATH, then run: okfforge"
```

Put something like that in `scripts/install-local-desktop.sh` if you want it checked in later; the commands above are enough to run by hand.

### 7.5 Verify the local desktop install

1. Launch the binary or installed app.  
2. Header subtitle should read **Desktop workbench**.  
3. **Open → Open folder (native)** → pick a folder of Markdown (e.g. clone of sample-okf).  
4. Edit a file → **Save** → confirm the file changed on disk (`cat` / editor).  
5. Optional: load GitHub sample while online to confirm network CSP allows `api.github.com` / `raw.githubusercontent.com`.

### 7.6 Signing, notarization, and distribution (optional)

Default local builds are **unsigned** (fine for your own machine).

| Goal | Notes |
|------|--------|
| Share with teammates (unsigned) | Zip the AppImage / portable exe / `.app`; warn about OS security prompts |
| macOS distribution outside notarized channel | Apple Developer ID + notarization (Tauri docs) |
| Windows SmartScreen | Authenticode certificate; MSI preferred over raw exe |
| Auto-update | Not configured in this repo yet; add `tauri-plugin-updater` when needed |

For pure **local** deploy you can skip signing.

### 7.7 Configuration knobs (`tauri.conf.json`)

| Key | Current | Why it matters |
|-----|---------|----------------|
| `build.devUrl` | `http://127.0.0.1:8080` | Must match Vite in `tauri:dev` |
| `build.beforeDevCommand` | `npm run dev` | Starts frontend for desktop dev |
| `build.beforeBuildCommand` | `npm run build:tauri` | Produces `dist/` for packaging |
| `build.frontendDist` | `../dist` | Files embedded in the binary |
| `bundle.targets` | `all` | Platform installers |
| `bundle.icon` | `icons/*` | App icon set |
| `app.windows[0]` | 1280×800, min 900×600 | Default window |
| `app.security.csp` | includes GitHub hosts | Allows loading public OKF repos |
| `identifier` | `com.okf.forge` | Bundle ID / uniqueness |

Capabilities: `src-tauri/capabilities/default.json` (`core`, `fs`, `dialog`).

### 7.8 Build troubleshooting

| Problem | Fix |
|---------|-----|
| `pkg-config` / `glib-sys` / WebKit errors | Install Tauri OS packages; cannot fully link in stripped containers |
| `beforeBuildCommand` failed | Run `npm run build:tauri` alone; fix Vite/TS errors |
| Empty `dist/` or missing `index.html` | `build-tauri.mjs` must rename `tauri.html` → `index.html` |
| Blank window in **dev** | Port 8080 in use or Vite crash — check terminal |
| Blank window in **release** | Asset `base` / missing `dist` assets — rebuild with `build:tauri` then `tauri build` |
| Windows won’t start | Install WebView2 Runtime |
| macOS “damaged” app | Unsigned local build — Gatekeeper; `xattr -cr` for local testing only |
| Stale UI after code change | Clean: `rm -rf dist src-tauri/target/release` then rebuild |

### 7.9 What not to confuse

| Command | Output | Use for |
|---------|--------|---------|
| `npm run build` | `.vercel/output` SSR web | Deploy website |
| `npm run build:tauri` | `dist/` SPA | Desktop frontend only |
| `npm run tauri:build` | Binary + installers | **Local desktop app** |
| `npm run tauri:dev` | Live window + HMR | Daily desktop development |

---

## 8. Testing

### Unit (TypeScript FS jail)

```bash
npm test
```

Covers `src/lib/platform/fsCore.ts`: containment, read/write, list, escape denial.

### E2E (Playwright) — web surface

```bash
npm run test:e2e
```

- Boots (or reuses) web server on `:8080`  
- Seeds scratch `OKF_WORKSPACE` from `public/sample-okf`  
- Specs: `e2e/smoke.spec.ts`, `e2e/fs-api.spec.ts`, `e2e/persistence.spec.ts`  
- Config: `playwright.config.ts`  

Primary surface for **browser-agent / Vercel-oriented** automation. Desktop FS is covered by Rust unit tests + manual native open/save.

### Rust FS core

```bash
npm run test:rust
# or: cd src-tauri && cargo test
```

`fs_core.rs` mirrors TypeScript jail rules (sibling prefix rejection, etc.).

### Smoke

```bash
npm run smoke
# → screenshots under screenshots/ (or /workspace/screenshots in sandbox)
```

### Suggested pre-release checklist

```bash
npm run typecheck
npm test
npm run test:e2e          # if web still ships
npm run build:tauri       # SPA sanity
npm run tauri:build       # full desktop
# then §7.5 verify on the host OS
```

---

## 9. Project layout

```
src/
  components/okf/     # App shell, panels, graph canvas, dialogs
  lib/okf/            # Graph, classify, loaders, integrations, store, markdown
  lib/platform/       # storage (Tauri|HTTP), fsCore, Vite /api/fs plugin
  routes/             # TanStack Start web entry
  tauri-main.tsx      # Desktop SPA entry
  styles.css          # Design tokens + shell
src-tauri/
  src/lib.rs          # Commands: set_workspace, read/write, list
  src/fs_core.rs      # Jail
  tauri.conf.json     # devUrl, beforeBuildCommand, bundle
  capabilities/
  icons/
public/
  sample-okf/
  sample-okf-bundle.json
  okf-plugin-meta.json
dist/                 # generated by build:tauri (gitignored ideally)
e2e/
tests/
scripts/
  build-tauri.mjs
  browser-smoke.mjs
vite.config.ts
vite.tauri.config.ts
tauri.html
```

---

## 10. Architecture notes

### Dual runtime

```
UI (React/Zustand)
    ↓
getStorage()
    ├── TauriStorage  → invoke → fs_core.rs
    └── HttpStorage   → /api/fs → fsCore.ts
```

Both jails reject path escape with the same semantics.

### Graph pipeline

1. Load files → `OkfBundle`  
2. `loadConcepts` / frontmatter + Markdown edges  
3. `impact` | `pack` | `subgraph` | `validate` | `search`  
4. UI panels subscribe via Zustand  

### Web vs desktop entries

| Entry | Framework | Use |
|-------|-----------|-----|
| `src/routes/index.tsx` | TanStack Start | Web / Vercel SSR |
| `src/tauri-main.tsx` | Plain React root | Tauri production webview |

Shared UI: `AppShell` and all OKF panels.

### Vite plugins (web)

- `okfFsApiPlugin` — `/api/fs/*` in dev  
- Auth popup / PGLite helpers from the app-builder template (if present)  
- `nitro({ preset: "vercel" })` **only on `command === "build"`** so dev stays single-port  

---

## 11. Configuration reference

| Item | Location |
|------|----------|
| Dev host/port | `vite.config.ts` → `0.0.0.0:8080` |
| Tauri devUrl / build hooks | `src-tauri/tauri.conf.json` |
| Workspace env (web) | `OKF_WORKSPACE` / `MOTION_WORKSPACE` |
| Integrations persistence | `localStorage` key via `integrations.ts` |
| CSP (desktop) | `tauri.conf.json` `app.security.csp` |
| Capabilities | `src-tauri/capabilities/default.json` |

---

## 12. Adding features (conventions)

1. **Graph logic** lives in `src/lib/okf/*` (pure, testable).  
2. **UI** in `src/components/okf/*`; wire state through `store.ts`.  
3. **FS behavior** change → update **both** `fsCore.ts` and `fs_core.rs` (+ tests).  
4. Prefer e2e coverage for user-visible flows (`data-testid` on critical controls).  
5. Keep production **`npm run build`** green; desktop needs **`build:tauri`** SPA still loading sample JSON from `public/`.  
6. Do not bind a second dev port in web mode (breaks preview).  
7. After desktop packaging changes, run a full **`npm run tauri:build`** on a real host and smoke-test [§7.5](#75-verify-the-local-desktop-install).  

---

## 13. Troubleshooting (dev)

| Issue | Fix |
|-------|-----|
| Port 8080 in use | Free the port or stop the other Vite |
| Playwright browser missing | `npx playwright install chromium` |
| `cargo` / glib-sys fail | Install Tauri Linux deps; not available in all containers |
| Blank Tauri window | See [§7.8](#78-build-troubleshooting) |
| `/api/fs` 404 | Only registered in **dev** (`apply: "serve"`); use desktop for prod disk I/O |

---

## 14. Related docs

- **[README.md](./README.md)** — overview + quick start  
- **[FEATURES.md](./FEATURES.md)** — product capabilities  
- **[USER_GUIDE.md](./USER_GUIDE.md)** — end-user workflows (includes Tauri usage)  
- **[DESKTOP.md](./DESKTOP.md)** — short dual-mode / binary cheatsheet  
- [Tauri v2](https://v2.tauri.app/) — framework docs  
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) — OS packages  
- [okf-plugin](https://github.com/SpillwaveSolutions/okf-plugin) — skills and sample-okf source  
