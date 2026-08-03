# GraphCanvas hardcodes the dark palette in SVG attributes

`01KZ2M8DF9ZY5WMB968Y54WT8R` · task/bug · **done**

Nine fill/stroke values in GraphCanvas.tsx are literal dark-theme hex codes, so the graph would render near-white text and edges on a white background in light mode.

## Hierarchy

- epic: [[Ticket-01KZ2KCJKX6S20SBVHBEQDZA0K]] View preferences: theme and zoom — Give the workbench a light/dark/system theme toggle and a desktop font-zoom that survives restarts, then backfill UI specs and wireframes for every view so screens can be judged against a contract instead of by eye.
