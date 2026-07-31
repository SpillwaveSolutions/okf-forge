# OKFForge — Desktop (Tauri) + Web testing

Dual-mode app:

| Mode | How | Filesystem |
|------|-----|------------|
| **Web / Vercel** | `npm run dev` · `npm run build` | In-memory sample + GitHub/upload; optional real FS via `/api/fs` + `OKF_WORKSPACE` |
| **Desktop (Tauri)** | `npm run tauri:dev` · `npm run tauri:build` | Native folder picker + jailed FS (`src-tauri`) |

Web mode is the **Playwright / browser-agent** surface (and this sandbox’s live preview). Desktop mode produces standalone installers under `src-tauri/target/release/bundle/`.

**Full build & local deploy guide:** [DEVELOPERS.md §7](./DEVELOPERS.md#7-build--deploy-the-tauri-app-locally)  
**End-user Tauri usage:** [USER_GUIDE.md §2](./USER_GUIDE.md#2-running-as-a-tauri-app)

## Prerequisites

### Web only
- Node 22+
- Playwright browsers: `npx playwright install chromium`

### Desktop build
- Rust (rustc 1.77+)
- System deps for Tauri 2 — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
  - **Linux**: `pkg-config`, `libwebkit2gtk`, `libgtk-3-dev`, `libglib2.0-dev`, …
  - **Windows**: WebView2 + VC++ redistributable for portable `.exe`
  - **macOS**: Xcode CLT

> This container may lack GTK/WebKit packages, so `cargo test` / full `tauri build` can fail here even though the Rust sources and SPA frontend build cleanly. Run desktop builds on a machine with Tauri deps installed.

## Commands

```bash
# Web (live preview / Vercel / Playwright)
npm run dev              # 0.0.0.0:8080
npm run build            # Vercel/Nitro production
npm run typecheck
npm test                 # FS jail unit tests (TypeScript)
npm run test:e2e         # Playwright — UI + /api/fs
npm run verify           # typecheck + unit + e2e
npm run smoke            # headless screenshot

# Desktop
npm run tauri:dev        # Tauri shell → vite on :8080
npm run build:tauri      # SPA frontend → dist/ (no SSR)
npm run tauri:build      # native binary + installers
npm run test:rust        # fs_core.rs (needs system libs)
```

## Local deploy (cheat sheet)

```bash
npm install
npm run tauri:build

# Smoke-run without installer:
./src-tauri/target/release/okfforge          # macOS/Linux
# .\src-tauri\target\release\okfforge.exe   # Windows

# Or install from:
#   bundle/dmg  bundle/msi  bundle/appimage  bundle/deb
```

Step-by-step install per OS, signing notes, and troubleshooting: **[DEVELOPERS.md §7](./DEVELOPERS.md#7-build--deploy-the-tauri-app-locally)**.

## Standalone binaries

After `npm run tauri:build` on a properly equipped host:

```
src-tauri/target/release/bundle/
  msi/  deb/  appimage/  dmg/  …
src-tauri/target/release/okfforge       # raw binary
src-tauri/target/release/okfforge.exe
```

Portable Windows: ship the `.exe` with WebView2 available (`webviewInstallMode: downloadBootstrapper` in `tauri.conf.json`). Bundle extra DLLs in a zip if needed.

## Web FS for testing (`/api/fs`)

Dev server mounts a real filesystem API (same jail rules as Rust):

| Endpoint | Purpose |
|----------|---------|
| `GET /api/fs/workspace` | Root path (`OKF_WORKSPACE` or `public/sample-okf`) |
| `GET /api/fs/list` | Markdown files |
| `GET /api/fs/read?path=` | Read file |
| `POST /api/fs/write` | `{ path, content }` write |

```bash
OKF_WORKSPACE=/path/to/okf-repo npm run dev
```

Playwright seeds a scratch copy of `sample-okf` automatically.

Ideal for **Playwright** and external **browser agent CLIs** (including Vercel-oriented runners): drive the same UI and real disk ops without a desktop shell.

## Architecture

```
src/lib/platform/fsCore.ts     ← TypeScript jail (web server)
src-tauri/src/fs_core.rs       ← Rust jail (desktop)
src/lib/platform/storage.ts    ← TauriStorage | HttpStorage
src/tauri-main.tsx             ← SPA entry for desktop bundle
src/routes/*                   ← TanStack Start (web / Vercel SSR)
vite.tauri.config.ts           ← SPA build → dist/
e2e/*                          ← Playwright suite
```

**Open → Open folder (native)** on desktop, or **Open web workspace** in the browser, exercises the shared contract.
