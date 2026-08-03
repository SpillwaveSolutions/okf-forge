import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "OKFForge — Graph engineering workbench",
      },
      {
        name: "description",
        content:
          "OKFForge: Motion-inspired Markdown IDE for Open Knowledge Format — edit, search, impact, classify, DeepAgents, and MCP config.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

/**
 * Runs before first paint, which is the entire point.
 *
 * Web mode is server-rendered: the HTML arrives and paints before any module
 * loads, so without this a user whose preference is light sees a dark frame
 * flash first. It is inlined and duplicated verbatim in tauri.html rather than
 * shared — importing a module would cost a network round trip, which is
 * precisely the delay that causes the flash it exists to prevent.
 *
 * Keep it in sync with the copy in tauri.html and with loadPrefs() in
 * src/lib/okf/prefs.ts, which owns the storage key and the value ranges.
 */
const THEME_BOOTSTRAP = `
try {
  var p = JSON.parse(localStorage.getItem("okf-workbench-prefs-v1") || "{}");
  var t = p.theme === "light" || p.theme === "dark" ? p.theme
    : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", t);
  if (typeof p.zoom === "number" && p.zoom >= 0.8 && p.zoom <= 2) {
    document.documentElement.style.setProperty("--okf-zoom", String(p.zoom));
  }
} catch (e) {}
`;

function RootComponent() {
  // No className="dark" here: it matched no selector in the codebase and was
  // already dead. The data-theme attribute the script above sets is the real
  // switch.
  // suppressHydrationWarning is required, not cosmetic: THEME_BOOTSTRAP stamps
  // data-theme onto this element before React hydrates, so the DOM legitimately
  // differs from the server markup and React logs a mismatch error. Suppressing
  // it here is exactly the sanctioned use — the attribute is deliberately
  // client-only, and the alternative (rendering the theme server-side) is
  // impossible when the source of truth is localStorage.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="bg-bg text-fg antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
