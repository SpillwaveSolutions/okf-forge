/**
 * The Settings view's CLI card, against a real Tauri window.
 *
 * This is the only tier where `invoke("cli_status")` reaches actual Rust. The
 * vitest suite pins the command names against a mock and the cargo suite pins
 * the shim text, but neither proves the two halves are wired to each other —
 * a command missing from `generate_handler!` fails at runtime and nowhere else.
 *
 * Deliberately read-only. `install_cli` writes to /usr/local/bin and may raise
 * an OS password prompt, which would hang the run with a modal no WebDriver
 * session can dismiss. Installing is verified by hand before release; see the
 * Known gaps section of docs/designs/ui-settings.md.
 */
import { browser, $, $$, expect } from "@wdio/globals";

describe("desktop CLI card", () => {
  before(async () => {
    await $("[data-testid='app-header']").waitForExist({ timeout: 60_000 });
    await $("[data-testid='nav-settings']").click();
    await $("[data-testid='cli-state']").waitForDisplayed({ timeout: 30_000 });
  });

  it("shows nine nav items with Settings last", async () => {
    const labels = await $$(".nav-item").map((el) => el.getText());
    expect(labels).toHaveLength(9);
    expect(labels[labels.length - 1]).toBe("Settings");
  });

  it("answers cli_status from Rust rather than the web fallback", async () => {
    // The browser fallback returns UNKNOWN_STATUS without invoking anything.
    // A real answer proves cli_status is in generate_handler! and reachable.
    const status = await browser.execute(() =>
      (
        window as unknown as { __TAURI_INTERNALS__: { invoke: (c: string) => Promise<unknown> } }
      ).__TAURI_INTERNALS__.invoke("cli_status"),
    );
    expect(status).toMatchObject({ path: "/usr/local/bin/okff" });
    expect(typeof (status as { installed: boolean }).installed).toBe("boolean");
  });

  it("offers an install control and no web-only note", async () => {
    await expect($("[data-testid='cli-install']")).toBeDisplayed();
    await expect($("[data-testid='cli-web-note']")).not.toBeExisting();
  });
});
