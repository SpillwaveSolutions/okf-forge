import { afterEach, describe, expect, it } from "vitest";
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { installCli, readCliStatus, uninstallCli, UNKNOWN_STATUS } from "./cli";

/**
 * Same bug class as storage.test.ts, same reason for pinning: these three
 * command names exist in two files that no single test tier reads at once.
 * Rename `install_cli` on either side and nothing fails until someone clicks
 * the button in a packaged desktop build.
 *
 * The shim's *text* is not tested here — it is rendered in Rust, and
 * `cli::tests` owns it. Testing it twice would mean two definitions of the
 * shim, which is how the two copies drift.
 */

afterEach(() => {
  clearMocks();
  // clearMocks() resets the handler but leaves `window.__TAURI_INTERNALS__`
  // behind, and `isTauriRuntime()` sniffs for that key's mere presence. Without
  // deleting it, the "in a browser" case below still sees a desktop runtime and
  // fails on a missing `invoke` rather than proving anything.
  delete (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

describe("okff CLI IPC contract", () => {
  it("reads status through cli_status", async () => {
    const cmds: string[] = [];
    mockIPC((cmd) => {
      cmds.push(cmd);
      return { installed: true, managed: true, current: true, path: "/usr/local/bin/okff" };
    });

    await expect(readCliStatus()).resolves.toMatchObject({ installed: true, managed: true });
    expect(cmds).toEqual(["cli_status"]);
  });

  it("returns the unknown status in a browser rather than calling Tauri", async () => {
    // No mockIPC, so window.__TAURI_INTERNALS__ is absent — the web build must
    // fall through to a shape the UI can render, not reject.
    await expect(readCliStatus()).resolves.toEqual(UNKNOWN_STATUS);
  });

  it("resolves install to the installed path and surfaces refusals as errors", async () => {
    mockIPC((cmd) => {
      if (cmd === "install_cli") return "/usr/local/bin/okff";
      throw new Error(`unexpected command ${cmd}`);
    });
    await expect(installCli()).resolves.toBe("/usr/local/bin/okff");

    clearMocks();
    // "Cancelled" is what the Rust side returns for AppleScript error -128,
    // i.e. the user dismissing the password prompt. It must reach the UI as a
    // rejection so the card can show it, not resolve as success.
    mockIPC(() => {
      throw new Error("Cancelled");
    });
    await expect(installCli()).rejects.toThrow(/Cancelled/);
  });

  it("removes through uninstall_cli", async () => {
    const cmds: string[] = [];
    mockIPC((cmd) => {
      cmds.push(cmd);
      return null;
    });
    await uninstallCli();
    expect(cmds).toEqual(["uninstall_cli"]);
  });
});
