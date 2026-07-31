/**
 * Dual-mode storage: Tauri desktop (native FS + dialog) vs web (HTTP /api/fs).
 * Both share the same jail rules (fsCore / fs_core.rs).
 */

export interface StorageProvider {
  /** Desktop: folder picker. Web: returns fixed OKF_WORKSPACE root. */
  openFolder(): Promise<string | null>;
  /** Absolute or workspace-relative path → markdown file paths (absolute on desktop). */
  listMarkdownFiles(path?: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  /** Current workspace root if known. */
  getWorkspaceRoot(): Promise<string | null>;
  isNative(): boolean;
}

async function failed(res: Response, what: string): Promise<never> {
  let detail = `${res.status} ${res.statusText}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) detail = body.error;
  } catch {
    /* ignore */
  }
  throw new Error(`${what}: ${detail}`);
}

export class HttpStorage implements StorageProvider {
  isNative() {
    return false;
  }

  async openFolder(): Promise<string | null> {
    const res = await fetch("/api/fs/workspace");
    if (!res.ok) return failed(res, "Failed to open workspace");
    const data = (await res.json()) as { root?: string };
    return data.root ?? null;
  }

  async getWorkspaceRoot(): Promise<string | null> {
    return this.openFolder();
  }

  async listMarkdownFiles(path?: string): Promise<string[]> {
    const q = path ? `?path=${encodeURIComponent(path)}` : "";
    const res = await fetch(`/api/fs/list${q}`);
    if (!res.ok) return failed(res, "Failed to list files");
    const data = (await res.json()) as { files?: string[] };
    return data.files ?? [];
  }

  async readFile(path: string): Promise<string> {
    const res = await fetch(
      `/api/fs/read?path=${encodeURIComponent(path)}`,
    );
    if (!res.ok) return failed(res, `Failed to read ${path}`);
    const data = (await res.json()) as { content?: string };
    return data.content ?? "";
  }

  async writeFile(path: string, content: string): Promise<void> {
    const res = await fetch("/api/fs/write", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    if (!res.ok) return failed(res, `Failed to write ${path}`);
  }
}

export class TauriStorage implements StorageProvider {
  isNative() {
    return true;
  }

  private root: string | null = null;

  async openFolder(): Promise<string | null> {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open OKF repository folder",
    });
    if (typeof selected !== "string") return null;
    const root = await invoke<string>("set_workspace", { path: selected });
    this.root = root;
    return root;
  }

  async getWorkspaceRoot(): Promise<string | null> {
    if (this.root) return this.root;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      this.root = await invoke<string>("get_workspace");
      return this.root;
    } catch {
      return null;
    }
  }

  async listMarkdownFiles(path?: string): Promise<string[]> {
    const { invoke } = await import("@tauri-apps/api/core");
    const root = this.root ?? (await this.getWorkspaceRoot());
    if (!root) throw new Error("No workspace opened");
    return invoke<string[]>("list_markdown_files", {
      path: path ?? root,
    });
  }

  async readFile(path: string): Promise<string> {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("read_file", { path });
  }

  async writeFile(path: string, content: string): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, content });
  }
}

let cached: StorageProvider | null = null;

export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "__TAURI_INTERNALS__" in window ||
    "__TAURI__" in window ||
    Boolean(
      (window as unknown as { isTauri?: boolean }).isTauri,
    )
  );
}

export function getStorage(): StorageProvider {
  if (cached) return cached;
  cached = isTauriRuntime() ? new TauriStorage() : new HttpStorage();
  return cached;
}

/** Test hook to force provider. */
export function setStorageForTests(provider: StorageProvider | null) {
  cached = provider;
}
