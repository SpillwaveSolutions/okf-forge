/**
 * The `okff` shell launcher, from the frontend's side.
 *
 * Deliberately not part of `StorageProvider`: that interface is the dual-runtime
 * filesystem, and there is no web counterpart to installing a shell command.
 * A fourth method returning "not supported" on one of two implementations is a
 * worse shape than a separate module that simply isn't called in the browser.
 *
 * Tauri imports stay dynamic for the same reason they are dynamic in
 * storage.ts — the web bundle must never pull `@tauri-apps/api` in.
 */
import { isTauriRuntime } from "./storage";

export interface CliStatus {
  /** Something exists at `path`. */
  installed: boolean;
  /** That something is ours — it carries the managed-by marker. */
  managed: boolean;
  /** It matches what this build would write right now. */
  current: boolean;
  path: string;
}

/** What the UI shows before any answer arrives, and in the browser forever. */
export const UNKNOWN_STATUS: CliStatus = {
  installed: false,
  managed: false,
  current: false,
  path: "/usr/local/bin/okff",
};

async function core() {
  return import("@tauri-apps/api/core");
}

export function cliSupported(): boolean {
  return isTauriRuntime();
}

export async function readCliStatus(): Promise<CliStatus> {
  if (!cliSupported()) return UNKNOWN_STATUS;
  const { invoke } = await core();
  return invoke<CliStatus>("cli_status");
}

/** Resolves to the installed path; rejects with a message fit to show a user. */
export async function installCli(): Promise<string> {
  const { invoke } = await core();
  return invoke<string>("install_cli");
}

export async function uninstallCli(): Promise<void> {
  const { invoke } = await core();
  await invoke("uninstall_cli");
}
