/**
 * Upload path normalization (file-tree builder is covered via UI + graph unit use).
 * Run: npm test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeUploadPath } from "../src/lib/okf/loaders.ts";

describe("normalizeUploadPath", () => {
  it("strips top folder and keeps nested structure", () => {
    assert.equal(normalizeUploadPath("LinkedIn/notes/posts/a.md"), "notes/posts/a.md");
  });

  it("skips node_modules", () => {
    assert.equal(normalizeUploadPath("repo/node_modules/pkg/readme.md"), null);
  });

  it("rejects non-md", () => {
    assert.equal(normalizeUploadPath("repo/src/app.ts"), null);
  });

  it("handles single-segment md under folder root", () => {
    assert.equal(normalizeUploadPath("MyNotes/readme.md"), "readme.md");
  });
});
