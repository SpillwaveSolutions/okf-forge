# Adversarial Review: OKF Forge shell + open dialog (running app)

**Wireframe:** `wireframes/shell.md`, `wireframes/open-dialog.md`  
**Verdict:** PASS

Launched the Vite web server with the sample workspace. Walked shell + Open-dialog acceptance criteria in Chromium (1280×800 and 390×844).

## Criteria Results

- [x] Header, sidebar, main, and status bar visible on desktop — PASS
- [x] Exactly one main view; `main[data-view]` matches the active nav item — PASS
- [x] All eight nav items switch the main panel without a route change — PASS
- [x] Header subtitle is Graph engineering workbench on web — PASS
- [x] Save disabled when clean — PASS
- [x] Theme cycle accessible name states current and next — PASS (`Theme: system (light). Switch to light.`)
- [x] File tree is `role=tree` with keyboard-addressable `treeitem`s — PASS (28 items)
- [x] Status bar shows concept/edge counts and selected path — PASS (`22 concepts · 83 edges · healthy`)
- [x] Open dialog is `role=dialog` labelled Open OKF repository — PASS
- [x] Escape dismisses the Open dialog — PASS
- [x] At ~390px no horizontal overflow; Open + Save remain — PASS
- [x] No uncaught console errors on reviewed paths — PASS

## Notes

- Tree arrow/Home/End/type-ahead not individually key-walked this pass; structure and roving `treeitem`s are present.
- Sample workspace loaded automatically (`sample-okf`).
