/**
 * Unit tests for the TypeScript FS jail (mirrors src-tauri/src/fs_core.rs).
 * Run: npm test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  collectFiles,
  FsError,
  isInsideWorkspace,
  readWorkspaceFile,
  resolveInWorkspace,
  writeWorkspaceFile,
} from "../src/lib/platform/fsCore.ts";

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "okf-fs-"));
  return realpathSync(dir);
}

describe("fsCore jail", () => {
  it("isInsideWorkspace rejects sibling prefix collision", () => {
    const root = "/tmp/ws";
    assert.equal(isInsideWorkspace(root, "/tmp/ws/a.md"), true);
    assert.equal(isInsideWorkspace(root, "/tmp/ws-evil/a.md"), false);
  });

  it("reads and writes inside workspace", () => {
    const root = scratch();
    try {
      mkdirSync(join(root, "knowledge"), { recursive: true });
      writeFileSync(join(root, "knowledge/a.md"), "# A\n");
      const text = readWorkspaceFile(root, "knowledge/a.md");
      assert.match(text, /# A/);
      writeWorkspaceFile(root, "knowledge/b.md", "# B\n");
      assert.match(readWorkspaceFile(root, "knowledge/b.md"), /# B/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("lists markdown files", () => {
    const root = scratch();
    try {
      mkdirSync(join(root, "agents"), { recursive: true });
      writeFileSync(join(root, "agents/x.md"), "x");
      writeFileSync(join(root, "skip.txt"), "no");
      const files = collectFiles(root, ["md"]);
      assert.equal(files.length, 1);
      assert.ok(files[0]!.endsWith("agents/x.md") || files[0]!.endsWith("agents\\x.md"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("denies escape via ..", () => {
    const root = scratch();
    const outside = scratch();
    try {
      writeFileSync(join(outside, "secret.md"), "nope");
      assert.throws(
        () => resolveInWorkspace(root, join("..", outside.split("/").pop()!, "secret.md")),
        (e: unknown) => e instanceof FsError && e.code === "denied",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
