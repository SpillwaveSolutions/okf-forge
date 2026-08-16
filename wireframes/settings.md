# Screen: Settings

## Goal
Install or remove the okff CLI so a folder can be opened in a new desktop window from the terminal. Theme and zoom stay in the header -- this page only documents them.

## Layout

```
+--------------------------------------------------------------+
| Settings                                                     |
| Theme and zoom live in the header.                           |
+--------------------------------------------------------------+
| Command line                                                 |
| okff . / okff ~/my-okf / okff --help                         |
| status (not installed / installed / foreign / web-only)      |
| [Install okff]  [Remove]                                     |
| error (if any)                                               |
+--------------------------------------------------------------+
```

## Key Elements

| Element | Type | Behavior / Notes |
|---------|------|------------------|
| Title | h1 | Settings |
| Usage | pre/code | Three example invocations |
| Web note | hint | data-testid=cli-web-note -- web cannot install |
| State | hint | data-testid=cli-state -- path, managed vs foreign, stale |
| Install | primary | data-testid=cli-install. Label: Install okff / Reinstall / Replace it. Disabled when managed and current. |
| Remove | danger | data-testid=cli-uninstall only if managed install exists |
| Error | alert | role=alert data-testid=cli-error |

## States
- **Web**: Usage plus web note. No install buttons.
- **Desktop not installed**: Install okff enabled.
- **Desktop managed current**: Install disabled; Remove shown.
- **Desktop managed stale**: Reinstall enabled.
- **Foreign file at path**: Warning plus Replace it. No Remove.
- **Busy**: Buttons disabled during install/uninstall.

## Acceptance Criteria
- [ ] Heading Settings and the usage block are visible on web and desktop.
- [ ] Web build shows the cannot-install note and no install button.
- [ ] Desktop shows install state at data-testid=cli-state.
- [ ] Install button labels match state (Install / Reinstall / Replace it).
- [ ] Remove appears only for a managed install.
- [ ] Failures surface in role=alert and a toast still fires on success.
- [ ] Theme/zoom are not duplicated as controls here.

## Notes
- Source: src/components/okf/SettingsPanel.tsx. macOS-only CLI for now.
