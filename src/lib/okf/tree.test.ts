import { describe, expect, it } from "vitest";
import { findByPrefix, flattenTree, resolveTreeKey, type VisibleRow } from "./tree";
import type { FileTreeNode } from "./graph";
import type { Concept } from "./types";

/**
 * The tree keyboard contract is the whole reason this module exists apart from
 * the component. `role="tree"` promises assistive tech that arrows, Home/End,
 * and typeahead all work; shipping the role without them is worse than the
 * invalid `role="listbox"` it replaces, because it advertises a contract the
 * widget does not honour. Every branch of that contract is pinned here.
 */

const concept = (path: string): Concept =>
  ({ path, title: path, type: "Reference" }) as unknown as Concept;

const file = (name: string, parent = ""): FileTreeNode =>
  ({
    kind: "file",
    name,
    path: parent ? `${parent}/${name}` : name,
    concept: concept(name),
  }) as unknown as FileTreeNode;

const dir = (name: string, children: FileTreeNode[]): FileTreeNode =>
  ({ kind: "dir", name, path: name, children }) as unknown as FileTreeNode;

//  agents/            <- dir, index 0
//    a.md             <- 1
//    b.md             <- 2
//  knowledge/         <- 3  (collapsed in most tests)
//    c.md
//  top.md             <- 4
const NODES: FileTreeNode[] = [
  dir("agents", [file("a.md", "agents"), file("b.md", "agents")]),
  dir("knowledge", [file("c.md", "knowledge")]),
  file("top.md"),
];

const rowsWith = (...open: string[]) => flattenTree(NODES, new Set(open));

describe("flattenTree", () => {
  it("emits only rows reachable without expanding anything else", () => {
    expect(rowsWith().map((r) => r.name)).toEqual(["agents", "knowledge", "top.md"]);
    expect(rowsWith("agents").map((r) => r.name)).toEqual([
      "agents",
      "a.md",
      "b.md",
      "knowledge",
      "top.md",
    ]);
  });

  it("records depth so rows can be indented and asserted on", () => {
    const rows = rowsWith("agents");
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 1, 0, 0]);
  });

  it("numbers each row within its own sibling group, not globally", () => {
    // aria-posinset/setsize are per parent. Getting this wrong makes a screen
    // reader announce "1 of 5" for the first child of a two-item folder.
    const rows = rowsWith("agents");
    const a = rows.find((r) => r.name === "a.md")!;
    expect([a.posInSet, a.setSize]).toEqual([1, 2]);
    const top = rows.find((r) => r.name === "top.md")!;
    expect([top.posInSet, top.setSize]).toEqual([3, 3]);
  });

  it("links each row to its parent so ArrowLeft can climb", () => {
    const rows = rowsWith("agents");
    expect(rows.find((r) => r.name === "a.md")!.parentKey).toBe("d:agents");
    expect(rows.find((r) => r.name === "agents")!.parentKey).toBeNull();
  });

  it("marks directories with their expanded state and files as never expandable", () => {
    const rows = rowsWith("agents");
    expect(rows.find((r) => r.name === "agents")!.expanded).toBe(true);
    expect(rows.find((r) => r.name === "knowledge")!.expanded).toBe(false);
    expect(rows.find((r) => r.name === "top.md")!.kind).toBe("file");
  });
});

describe("resolveTreeKey — vertical movement", () => {
  const rows = rowsWith("agents");

  it("moves down and up one visible row at a time", () => {
    expect(resolveTreeKey("ArrowDown", rows, 0)).toEqual({ type: "move", index: 1 });
    expect(resolveTreeKey("ArrowUp", rows, 2)).toEqual({ type: "move", index: 1 });
  });

  it("clamps at both ends rather than wrapping", () => {
    // Wrapping in a tree is disorienting: you press Down expecting the next
    // file and land at the top of the workspace.
    expect(resolveTreeKey("ArrowUp", rows, 0)).toBeNull();
    expect(resolveTreeKey("ArrowDown", rows, rows.length - 1)).toBeNull();
  });

  it("enters at the first row when nothing is focused yet", () => {
    expect(resolveTreeKey("ArrowDown", rows, -1)).toEqual({ type: "move", index: 0 });
  });

  it("jumps to the first and last visible rows", () => {
    expect(resolveTreeKey("Home", rows, 3)).toEqual({ type: "move", index: 0 });
    expect(resolveTreeKey("End", rows, 0)).toEqual({ type: "move", index: rows.length - 1 });
  });
});

describe("resolveTreeKey — horizontal movement", () => {
  it("expands a closed directory, then steps into it", () => {
    const closed = rowsWith();
    expect(resolveTreeKey("ArrowRight", closed, 0)).toEqual({ type: "expand", path: "agents" });

    const open = rowsWith("agents");
    expect(resolveTreeKey("ArrowRight", open, 0)).toEqual({ type: "move", index: 1 });
  });

  it("collapses an open directory, then climbs out of it", () => {
    const open = rowsWith("agents");
    expect(resolveTreeKey("ArrowLeft", open, 0)).toEqual({ type: "collapse", path: "agents" });
    // From a child, ArrowLeft goes to the parent rather than collapsing it.
    expect(resolveTreeKey("ArrowLeft", open, 1)).toEqual({ type: "move", index: 0 });
  });

  it("does nothing horizontal on a file with no parent", () => {
    const rows = rowsWith("agents");
    const topIndex = rows.findIndex((r) => r.name === "top.md");
    expect(resolveTreeKey("ArrowRight", rows, topIndex)).toBeNull();
    expect(resolveTreeKey("ArrowLeft", rows, topIndex)).toBeNull();
  });
});

describe("resolveTreeKey — activation", () => {
  const rows = rowsWith("agents");

  it("activates on Enter and Space", () => {
    expect(resolveTreeKey("Enter", rows, 1)).toEqual({ type: "activate", row: rows[1] });
    expect(resolveTreeKey(" ", rows, 1)).toEqual({ type: "activate", row: rows[1] });
  });

  it("ignores keys it does not own", () => {
    expect(resolveTreeKey("a", rows, 1)).toBeNull();
    expect(resolveTreeKey("Escape", rows, 1)).toBeNull();
  });
});

describe("findByPrefix", () => {
  const rows: VisibleRow[] = rowsWith("agents");

  it("finds the next matching row after the cursor, case-insensitively", () => {
    expect(findByPrefix(rows, "b", 0)).toBe(2);
    expect(findByPrefix(rows, "AG", -1)).toBe(0);
  });

  it("wraps around so the last row can reach the first", () => {
    // Typeahead wraps even though arrows do not: the user typed a name, so
    // they are asking for that item wherever it is.
    expect(findByPrefix(rows, "agents", rows.length - 1)).toBe(0);
  });

  it("returns -1 when nothing matches", () => {
    expect(findByPrefix(rows, "zzz", 0)).toBe(-1);
  });

  it("stays on the current row when it is the only match", () => {
    const i = rows.findIndex((r) => r.name === "top.md");
    expect(findByPrefix(rows, "top", i)).toBe(i);
  });
});
