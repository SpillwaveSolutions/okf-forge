# Screen: Open OKF repository (dialog)

## Goal
Load a workspace from native folder (desktop), web /api/fs, bundled sample, GitHub, browser file pick, or an empty scaffold.

## Layout

```
[ dimmed backdrop ]
  +------------------------------------------------+
  | Open OKF repository                         [x]|
  | Desktop: native folder  also sample, GitHub    |
  +------------------------------------------------+
  | (error banner if any)                          |
  | [ Open folder (native) / Open web workspace ]  |
  | [ Reload OKF_WORKSPACE ]          (web only)   |
  | [ Sample: okf-plugin / sample-okf ]            |
  | GitHub [ owner/repo/path          ] [Load]     |
  | [Choose folder] [Choose .md files]             |
  | Scaffold name [my-okf] [Create scaffold]       |
  +------------------------------------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Overlay | dialog | role=dialog aria-modal=true aria-label=Open OKF repository. Backdrop click closes. |
| Close | icon | aria-label Close |
| Subtitle | text | Desktop vs web copy |
| Error | banner | Store error if last load failed |
| Native / web workspace | card | data-testid=open-workspace. Tauri: OS picker plus jail. Web: OKF_WORKSPACE via /api/fs. |
| Reload OKF_WORKSPACE | button | Web only. data-testid=load-web-workspace. |
| Sample | card | Bundled dual graph, in-memory |
| GitHub | input + button | Default SpillwaveSolutions/okf-plugin/sample-okf. Load disabled if empty or loading. |
| Browser pick | hidden file inputs | Folder (webkitdirectory) or multi .md to in-memory |
| Scaffold | name + primary | Creates empty OKF plus starter agent |

## States
- **Closed**: Component returns null.
- **Open / idle**: All sources enabled.
- **Loading**: Source actions disabled.
- **Error**: Banner above sources; dialog stays open.

## Acceptance Criteria
- [ ] Dialog has role=dialog, aria-modal, and label Open OKF repository.
- [ ] Backdrop click and Close dismiss it.
- [ ] Desktop primary action is Open folder (native); web is Open web workspace.
- [ ] Sample, GitHub, file pick, and scaffold are all present.
- [ ] Reload OKF_WORKSPACE appears only on web.
- [ ] Actions disable while loading is true.
- [ ] A failed load shows the error string inside the dialog.

## Notes
- Source: src/components/okf/OpenBundleDialog.tsx.
- Disk writes only after a workspace root is set (native folder or web /api/fs).
