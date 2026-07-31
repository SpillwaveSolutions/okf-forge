import { test, expect } from "@playwright/test";

/**
 * Proves the web filesystem jail (/api/fs) works — the same contract the
 * Tauri commands implement in Rust. Playwright can drive real read/write
 * without a desktop shell.
 */
test.describe("/api/fs workspace", () => {
  test("workspace root is advertised", async ({ request }) => {
    const res = await request.get("/api/fs/workspace");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.root).toBeTruthy();
  });

  test("lists markdown under OKF_WORKSPACE", async ({ request }) => {
    const res = await request.get("/api/fs/list");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.files)).toBeTruthy();
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.files.some((f: string) => f.endsWith(".md"))).toBeTruthy();
  });

  test("read + write round-trip", async ({ request }) => {
    const path = `e2e-write-${Date.now()}.md`;
    const content = `---\ntitle: E2E\ntype: Reference\n---\n\n# E2E write\n`;
    const write = await request.post("/api/fs/write", {
      data: { path, content },
    });
    expect(write.ok()).toBeTruthy();

    const read = await request.get(
      `/api/fs/read?path=${encodeURIComponent(path)}`,
    );
    expect(read.ok()).toBeTruthy();
    const body = await read.json();
    expect(body.content).toContain("# E2E write");
  });

  test("denies path escape", async ({ request }) => {
    const res = await request.get(
      `/api/fs/read?path=${encodeURIComponent("../../etc/passwd")}`,
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
