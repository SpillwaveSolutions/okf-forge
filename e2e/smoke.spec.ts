import { test, expect } from "@playwright/test";
import { gotoApp } from "./helpers";

test.describe("OKFForge web smoke", () => {
  test("loads learn view with sample concepts", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto("/");
    await expect(page.getByText("OKFForge").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Learn OKF" })).toBeVisible();
    await expect(page.getByText("Learn OKF by using it")).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator(".app-sidebar").getByText("sample-okf", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    expect(errors, `console/page errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("navigates to graph search via impact", async ({ page }) => {
    await gotoApp(page);

    await page.getByRole("button", { name: "Graph & Search" }).click();
    await expect(
      page.getByRole("heading", { name: "Graph & search" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Impact analysis")).toBeVisible();

    await page.getByRole("button", { name: "Editor" }).click();
    await expect(page.locator(".app-main")).toBeVisible();
  });

  test("open dialog exposes workspace + sample", async ({ page }) => {
    await gotoApp(page);
    const openBtn = page.getByTestId("header-open");
    await expect(openBtn).toBeEnabled({ timeout: 15_000 });
    await openBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId("open-workspace")).toBeVisible();
    await expect(
      page.getByText("Sample: okf-plugin / sample-okf"),
    ).toBeVisible();
  });
});
