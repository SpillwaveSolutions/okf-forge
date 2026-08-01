import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Standalone on purpose — do not merge this into vite.config.ts.
 *
 * That config's serve-only plugins run on every dev server, and vitest starts
 * one per run: pgliteBootstrapPlugin boots PGLite and applies migrations in
 * configureServer (throwing on failure), and authPopupPlugin / okfFsApiPlugin
 * mount middleware. You would be standing up a database to test a string
 * function. (Nitro is not the problem — it is correctly gated on
 * `command === "build"`.)
 *
 * `include` is explicit because vitest's default would swallow both other
 * tiers. The three runners partition cleanly:
 *
 *   tests/*.test.ts         node:test    pure functions, node APIs
 *   src/ ** /*.test.ts(x)   vitest       component/integration, needs a DOM
 *   e2e/*.spec.ts           playwright   real browser
 *
 * Co-locating under src/ is deliberate: tsconfig's `include: ["src"]` means
 * `npm run typecheck` covers these tests, which it does not do for tests/.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
