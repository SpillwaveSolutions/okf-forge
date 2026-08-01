import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("workspace open + save", () => {
  test("opens web workspace and persists an edit via /api/fs", async ({
    page,
    request,
  }) => {
    await gotoApp(page);

    const openBtn = page.getByTestId("header-open");
    await expect(openBtn).toBeEnabled({ timeout: 15_000 });
    await openBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("open-workspace").click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });

    // Workspace load lands on explorer with concepts
    await expect(page.locator('[role="option"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // API-level write proves the same jail Playwright uses for agent testing
    const marker = `e2e-${Date.now()}`;
    const path = `knowledge/${marker}.md`;
    const content = `---\ntype: Reference\ntitle: ${marker}\n---\n\n# ${marker}\n`;
    const write = await request.post("/api/fs/write", {
      data: { path, content },
    });
    expect(write.ok()).toBeTruthy();
    const read = await request.get(
      `/api/fs/read?path=${encodeURIComponent(path)}`,
    );
    expect(read.ok()).toBeTruthy();
    const body = await read.json();
    expect(body.content).toContain(marker);
  });
});
