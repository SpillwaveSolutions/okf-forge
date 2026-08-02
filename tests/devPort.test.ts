/**
 * Port resolution (scripts/dev-port.mjs). Run: npm test
 *
 * These tests touch the real `.dev-port` because the module resolves it at
 * import time, so each one saves and restores the file.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { resolveDevPort, peekDevPort, BASE_PORT } from "../scripts/dev-port.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT_FILE = join(ROOT, ".dev-port");

let saved: string | null = null;

before(() => {
  saved = existsSync(PORT_FILE) ? readFileSync(PORT_FILE, "utf8") : null;
});

after(() => {
  if (saved === null) rmSync(PORT_FILE, { force: true });
  else writeFileSync(PORT_FILE, saved);
  delete process.env.OKF_DEV_PORT;
});

function hold(port: number): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    // The resolver probes this port with an HTTP request that never gets an
    // answer, and net.Server.close() waits on live connections — so these have
    // to be destroyed by hand or close() never calls back and the test hangs
    // instead of failing. (closeAllConnections() is http.Server-only.)
    const sockets = new Set<import("node:net").Socket>();
    srv.on("connection", (s) => {
      sockets.add(s);
      s.on("close", () => sockets.delete(s));
    });
    srv.once("error", reject);
    srv.listen(port, "0.0.0.0", () =>
      resolve(
        () =>
          new Promise<void>((r) => {
            for (const s of sockets) s.destroy();
            srv.close(() => r());
          }),
      ),
    );
  });
}

describe("dev port resolution", () => {
  it("an explicit OKF_DEV_PORT always wins and is never persisted", async () => {
    rmSync(PORT_FILE, { force: true });
    process.env.OKF_DEV_PORT = "9321";

    assert.equal(await resolveDevPort(), 9321);
    assert.equal(peekDevPort(), 9321);
    // An override is for one run; it must not become the remembered port.
    assert.equal(existsSync(PORT_FILE), false);

    delete process.env.OKF_DEV_PORT;
  });

  it("remembers a previously chosen port when it is free", async () => {
    delete process.env.OKF_DEV_PORT;
    const free = BASE_PORT + 41;
    writeFileSync(PORT_FILE, `${free}\n`);

    assert.equal(await resolveDevPort(), free);
  });

  it("moves off a remembered port once another process takes it", async () => {
    delete process.env.OKF_DEV_PORT;
    const taken = BASE_PORT + 42;
    writeFileSync(PORT_FILE, `${taken}\n`);

    // Stand in for a sibling project's dev server holding the port. It answers
    // nothing, so it cannot be mistaken for ours.
    const release = await hold(taken);
    try {
      const got = await resolveDevPort();
      assert.notEqual(got, taken);
      assert.ok(got >= BASE_PORT, `expected >= ${BASE_PORT}, got ${got}`);
      // The new choice is persisted, so the next run is stable.
      assert.equal(readFileSync(PORT_FILE, "utf8").trim(), String(got));
    } finally {
      await release();
    }
  });

  it("peek falls back to the base port with nothing remembered", () => {
    delete process.env.OKF_DEV_PORT;
    rmSync(PORT_FILE, { force: true });
    assert.equal(peekDevPort(), BASE_PORT);
  });
});
