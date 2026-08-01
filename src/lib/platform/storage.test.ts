import { afterEach, describe, expect, it } from "vitest";
import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { TauriStorage, getStorage, setStorageForTests } from "./storage";

/**
 * The desktop storage provider had no coverage in any tier, and the bug class
 * it protects against is silent: the frontend sends
 * `invoke("list_markdown_files", { path })` and Rust declares
 * `fn list_markdown_files(path: String)`. Rename either side and nothing fails
 * anywhere — the browser tests never reach this code and the Rust tests never
 * reach the frontend. The app just breaks on desktop.
 *
 * So these tests pin the command names and argument shapes against
 * src-tauri/src/lib.rs rather than asserting on return values alone.
 */

afterEach(() => {
  clearMocks();
  // getStorage() caches at module scope; without this the runtime-detection
  // test below leaks a provider into every later test in the file.
  setStorageForTests(null);
});

describe("TauriStorage IPC contract", () => {
  it("resolves the workspace root before listing, and passes it as `path`", async () => {
    const calls: Array<{ cmd: string; args: unknown }> = [];
    mockIPC((cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === "get_workspace") return "/ws";
      if (cmd === "list_markdown_files") return ["index.md", "agents/a.md"];
      throw new Error(`unexpected command ${cmd}`);
    });

    const files = await new TauriStorage().listMarkdownFiles();

    expect(files).toEqual(["index.md", "agents/a.md"]);
    expect(calls.map((c) => c.cmd)).toEqual(["get_workspace", "list_markdown_files"]);
    expect(calls[1]?.args).toMatchObject({ path: "/ws" });
  });

  it("caches the root, so a second call does not re-resolve it", async () => {
    const cmds: string[] = [];
    mockIPC((cmd) => {
      cmds.push(cmd);
      if (cmd === "get_workspace") return "/ws";
      if (cmd === "list_markdown_files") return [];
      throw new Error(`unexpected command ${cmd}`);
    });

    const s = new TauriStorage();
    await s.listMarkdownFiles();
    await s.listMarkdownFiles();

    expect(cmds.filter((c) => c === "get_workspace")).toHaveLength(1);
  });

  it("write and read round-trip with the argument shape Rust expects", async () => {
    const disk = new Map<string, string>();
    mockIPC((cmd, args) => {
      const a = args as { path: string; content?: string };
      if (cmd === "write_file") {
        disk.set(a.path, a.content ?? "");
        return null;
      }
      if (cmd === "read_file") return disk.get(a.path) ?? "";
      throw new Error(`unexpected command ${cmd}`);
    });

    const s = new TauriStorage();
    await s.writeFile("knowledge/a.md", "# a");

    expect(await s.readFile("knowledge/a.md")).toBe("# a");
    expect(disk.get("knowledge/a.md")).toBe("# a");
  });

  it("surfaces a missing workspace as a null root, not a crash", async () => {
    // Mirrors the Err arm of workspace_root() when set_workspace was never
    // called: the Rust side rejects rather than returning empty.
    mockIPC(() => {
      throw new Error("No workspace opened. Open a folder first.");
    });

    const s = new TauriStorage();
    await expect(s.getWorkspaceRoot()).resolves.toBeNull();
    await expect(s.listMarkdownFiles()).rejects.toThrow(/No workspace opened/);
  });

  it("getStorage picks the native provider when the Tauri bridge is present", () => {
    // mockIPC installs window.__TAURI_INTERNALS__, which is exactly what
    // isTauriRuntime() sniffs for.
    mockIPC(() => "/ws");
    expect(getStorage().isNative()).toBe(true);
  });
});
