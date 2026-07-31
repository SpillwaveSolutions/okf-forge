/**
 * Workspace filesystem core — browser-mode counterpart to src-tauri/src/fs_core.rs.
 * Pure helpers used by the Vite /api/fs middleware and unit/contract tests.
 * Not imported by the browser bundle.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";

export type FsErrorCode = "denied" | "not-found" | "not-a-directory";

export class FsError extends Error {
  code: FsErrorCode;
  constructor(code: FsErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "FsError";
  }
}

export const MARKDOWN_EXTENSIONS = ["md"] as const;

/** Component-aware containment (not string prefix). */
export function isInsideWorkspace(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  if (rel === "") return true;
  return !rel.startsWith("..") && !isAbsolute(rel);
}

function realOrThrow(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    throw new FsError("not-found", `No such file or directory: ${path}`);
  }
}

export function resolveInWorkspace(root: string, requested: string): string {
  const rootReal = realOrThrow(root);
  const absolute = isAbsolute(requested)
    ? requested
    : join(rootReal, requested);

  let resolved: string;
  if (existsSync(absolute)) {
    resolved = realOrThrow(absolute);
  } else {
    const parent = dirname(resolve(absolute));
    const parentReal = realOrThrow(parent);
    resolved = join(parentReal, basename(absolute));
  }

  if (!isInsideWorkspace(rootReal, resolved)) {
    throw new FsError(
      "denied",
      "Access denied: path is outside the opened workspace",
    );
  }
  return resolved;
}

function assertDirectory(path: string): string {
  const real = realOrThrow(path);
  if (!statSync(real).isDirectory()) {
    throw new FsError("not-a-directory", `Not a directory: ${path}`);
  }
  return real;
}

export function collectFiles(
  root: string,
  extensions: readonly string[],
): string[] {
  const rootReal = assertDirectory(root);
  const out: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".")) continue;
        walk(full);
      } else if (entry.isFile()) {
        const dot = entry.name.lastIndexOf(".");
        if (dot <= 0) continue;
        const ext = entry.name.slice(dot + 1).toLowerCase();
        if (extensions.includes(ext)) out.push(full);
      }
    }
  };

  walk(rootReal);
  out.sort();
  return out;
}

export function readWorkspaceFile(root: string, requested: string): string {
  const path = resolveInWorkspace(root, requested);
  if (!existsSync(path)) {
    throw new FsError("not-found", `No such file: ${requested}`);
  }
  return readFileSync(path, "utf8");
}

export function writeWorkspaceFile(
  root: string,
  requested: string,
  content: string,
): void {
  const path = resolveInWorkspace(root, requested);
  const rootReal = realOrThrow(root);
  const parent = dirname(path);
  if (!isInsideWorkspace(rootReal, parent)) {
    throw new FsError(
      "denied",
      "Access denied: path is outside the opened workspace",
    );
  }
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  writeFileSync(path, content, "utf8");
}

/** Relative path from workspace root using posix separators. */
export function toRelative(root: string, absPath: string): string {
  return relative(root, absPath).split("\\").join("/");
}
