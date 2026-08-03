/**
 * Keyboard and ARIA model for the sidebar file tree.
 *
 * Pure on purpose, and separate from Sidebar.tsx for the same reason graph.ts
 * is separate from the panels: this is the branchy part. `role="tree"` is a
 * promise to assistive tech that arrows, Home/End, and typeahead behave a
 * specific way — shipping the role without honouring it is worse than the
 * invalid `role="listbox"` it replaces, because it advertises a contract the
 * widget does not keep. Branchy promises need tests, and tests need this out
 * of the component.
 *
 * Follows the WAI-ARIA tree view pattern.
 */
import type { FileTreeNode } from "./graph";
import type { Concept } from "./types";

/** One row the user can actually see and focus right now. */
export interface VisibleRow {
  /** Unique across kinds — a dir and a file can share a path segment. */
  key: string;
  path: string;
  name: string;
  kind: "dir" | "file";
  /** 0-based; drives indentation and `aria-level` (which is 1-based). */
  depth: number;
  /** Always false for files, which are never expandable. */
  expanded: boolean;
  /** `aria-setsize` / `aria-posinset`, scoped to the sibling group. */
  setSize: number;
  posInSet: number;
  parentKey: string | null;
  concept?: Concept;
}

export const rowKey = (n: { kind: string; path: string }) =>
  n.kind === "dir" ? `d:${n.path}` : n.path;

/**
 * Depth-first walk of everything currently reachable — a collapsed directory
 * contributes its own row and none of its children. This ordering *is* the
 * arrow-key order, which is why navigation reduces to array indexing.
 */
export function flattenTree(
  nodes: FileTreeNode[],
  expanded: ReadonlySet<string>,
  depth = 0,
  parentKey: string | null = null,
): VisibleRow[] {
  const out: VisibleRow[] = [];
  nodes.forEach((n, i) => {
    const isDir = n.kind === "dir";
    const isOpen = isDir && expanded.has(n.path);
    const key = rowKey(n);
    out.push({
      key,
      path: n.path,
      name: n.name,
      kind: isDir ? "dir" : "file",
      depth,
      expanded: isOpen,
      // Per sibling group, not global: a screen reader announcing "1 of 5" for
      // the first child of a two-item folder is actively misleading.
      setSize: nodes.length,
      posInSet: i + 1,
      parentKey,
      concept: isDir ? undefined : n.concept,
    });
    if (isOpen) out.push(...flattenTree(n.children, expanded, depth + 1, key));
  });
  return out;
}

export type TreeAction =
  | { type: "move"; index: number }
  | { type: "expand"; path: string }
  | { type: "collapse"; path: string }
  | { type: "activate"; row: VisibleRow }
  | null;

/**
 * Map a key press onto an action, or null when the tree does not own that key.
 * Returning null rather than a no-op action is what lets the caller skip
 * `preventDefault`, so Tab and browser shortcuts keep working.
 */
export function resolveTreeKey(key: string, rows: VisibleRow[], activeIndex: number): TreeAction {
  if (!rows.length) return null;
  const last = rows.length - 1;
  const row = rows[activeIndex];

  switch (key) {
    case "ArrowDown":
      // -1 means nothing is focused yet, so the first press enters the tree.
      if (activeIndex < 0) return { type: "move", index: 0 };
      // Clamp rather than wrap: pressing Down for the next file and landing
      // back at the top of the workspace is disorienting.
      return activeIndex < last ? { type: "move", index: activeIndex + 1 } : null;

    case "ArrowUp":
      if (activeIndex <= 0) return null;
      return { type: "move", index: activeIndex - 1 };

    case "ArrowRight":
      if (!row || row.kind !== "dir") return null;
      if (!row.expanded) return { type: "expand", path: row.path };
      // Already open: the next row is by construction its first child.
      return activeIndex < last ? { type: "move", index: activeIndex + 1 } : null;

    case "ArrowLeft": {
      if (!row) return null;
      if (row.kind === "dir" && row.expanded) return { type: "collapse", path: row.path };
      if (!row.parentKey) return null;
      const parent = rows.findIndex((r) => r.key === row.parentKey);
      return parent >= 0 ? { type: "move", index: parent } : null;
    }

    case "Home":
      return { type: "move", index: 0 };

    case "End":
      return { type: "move", index: last };

    case "Enter":
    case " ":
      return row ? { type: "activate", row } : null;

    default:
      return null;
  }
}

/**
 * Next row whose name starts with `prefix`, searching forward from
 * `fromIndex` and wrapping.
 *
 * Wrapping here even though arrows do not: the user typed a name, so they are
 * asking for that item wherever it sits, not for the next one downward.
 * Starts *at* `fromIndex` so repeating a prefix re-confirms the current row
 * rather than skipping past it.
 */
export function findByPrefix(rows: VisibleRow[], prefix: string, fromIndex: number): number {
  if (!prefix) return -1;
  const p = prefix.toLowerCase();
  const start = Math.max(fromIndex, 0);
  for (let i = 0; i < rows.length; i++) {
    const idx = (start + i) % rows.length;
    if (rows[idx].name.toLowerCase().startsWith(p)) return idx;
  }
  return -1;
}
