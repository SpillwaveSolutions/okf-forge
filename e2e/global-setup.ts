/**
 * Refuse to run the suite against a workspace inside the repository.
 *
 * `webServer.env` only reaches a dev server Playwright itself spawns, and
 * `reuseExistingServer` is on outside CI. So a dev server you started by hand —
 * which has no `OKF_WORKSPACE`, and therefore falls back to
 * `public/sample-okf` — gets silently reused, and `/api/fs/write` starts
 * writing into the tracked fixture. That is how nine `e2e-write-*.md` files
 * ended up committed before anyone noticed.
 *
 * One check, before any spec runs, rather than a guard per writing spec: this
 * catches the specs that do not exist yet as well as the two that do.
 */
import type { FullConfig } from "@playwright/test";
import { relative, isAbsolute } from "node:path";
import { resolveDevPortSync } from "../scripts/dev-port.mjs";

export default async function globalSetup(_config: FullConfig) {
  const res = await fetch(`http://127.0.0.1:${resolveDevPortSync()}/api/fs/workspace`);
  if (!res.ok) {
    throw new Error(`/api/fs/workspace answered ${res.status}; is this the OKF Forge dev server?`);
  }
  const { root } = (await res.json()) as { root?: string };
  if (!root) throw new Error("/api/fs/workspace returned no root");

  const rel = relative(process.cwd(), root);
  const inside = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  if (inside) {
    throw new Error(
      `The dev server is serving ${root}, which is inside the repository.\n` +
        `Writing specs would mutate a tracked fixture. This usually means a dev\n` +
        `server started by hand was reused: stop it and let Playwright start its\n` +
        `own, or run with OKF_WORKSPACE pointing outside the repo.`,
    );
  }
}
