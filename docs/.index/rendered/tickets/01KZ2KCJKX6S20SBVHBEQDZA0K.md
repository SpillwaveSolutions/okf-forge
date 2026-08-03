# View preferences: theme and zoom

`01KZ2KCJKX6S20SBVHBEQDZA0K` · epic/feature · **open**

Give the workbench a light/dark/system theme toggle and a desktop font-zoom that survives restarts, then backfill UI specs and wireframes for every view so screens can be judged against a contract instead of by eye.

## Children

- [[Ticket-01KZ2KCSAW39DDVYWER1DEDAQQ]] Design spec for view preferences — Write and publish the design spec covering the Tailwind v4 @theme inline indirection, the light palette, the anti-FOUC head script, the zoom mechanism, and the test tiers. (done)
- [[Ticket-01KZ2M32GWWQ4PP29HVE0AMPX7]] Pure preference logic in prefs.ts — Resolve, cycle, clamp, persist, and one DOM writer. (open)
- [[Ticket-01KZ2M32NY8ZWMW8GWRZ7G3WQD]] Two-layer palette in styles.css — A --okf-* variable layer for light and dark that @theme inline points at, so a data-theme attribute re-themes every existing utility class without touching a component. (open)
- [[Ticket-01KZ2M32TVGPVF4PYTJ1BJENH7]] Resolve the theme before first paint — An inlined head script in both the SSR shell and the desktop HTML entry. (open)
- [[Ticket-01KZ2M32ZY8G5RVEB2F0EK9G1E]] Theme control wired through the store — Store state and actions, the cycling header button whose accessible name states both current state and next action, and a prefers-color-scheme listener that re-resolves while the preference is system. (open)
- [[Ticket-01KZ2M334TJ1XNRKG7Y2ENHA5W]] Desktop font zoom — Cmd +, Cmd -, and Cmd 0 guarded by isTauriRuntime, the status-bar readout, and the thirteen text-[Npx] literals converted to rem so they scale with everything else. (open)
- [[Ticket-01KZ2M339YT6TMAQHJSTEGPADA]] Theme and zoom end-to-end coverage — Two Playwright rows including one that catches a missing inline on @theme, and three WebdriverIO rows including viewport containment at maximum zoom, which the web suite cannot check because it only runs at 100 percent. (open)
- [[Ticket-01KZ2M33EZ4KPYJ8G9SEQ4NFBG]] Editor spec inventory and rubric rows — The element inventory is a merge gate, so the new controls must appear in it. (open)

Progress: 1/8 done
