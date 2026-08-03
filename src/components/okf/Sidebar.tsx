import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  Network,
  Plug,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import type { AppView, Concept } from "@/lib/okf/types";
import { buildFileTree, type FileTreeNode } from "@/lib/okf/graph";
import { findByPrefix, flattenTree, resolveTreeKey, type VisibleRow } from "@/lib/okf/tree";

const NAV: { id: AppView; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "Learn OKF", icon: BookOpen },
  { id: "explorer", label: "Explorer", icon: FolderTree },
  { id: "editor", label: "Editor", icon: FileText },
  { id: "search", label: "Graph & Search", icon: Network },
  { id: "classify", label: "Classify", icon: Sparkles },
  { id: "deepagent", label: "DeepAgents", icon: Bot },
  { id: "integrations", label: "Plugins & MCP", icon: Plug },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

function typeBadge(type: string) {
  if (type === "AgentNode") return "badge-primary";
  if (type === "Workflow") return "badge-success";
  if (type === "Index") return "";
  return "";
}

function conceptMatches(c: Concept, filter: string) {
  if (!filter) return true;
  return (
    c.path.toLowerCase().includes(filter) ||
    c.title.toLowerCase().includes(filter) ||
    c.type.toLowerCase().includes(filter)
  );
}

/** Keep dirs that contain at least one matching file (deep). */
function filterTree(nodes: FileTreeNode[], filter: string): FileTreeNode[] {
  if (!filter) return nodes;
  const out: FileTreeNode[] = [];
  for (const n of nodes) {
    if (n.kind === "file") {
      if (conceptMatches(n.concept, filter)) out.push(n);
      continue;
    }
    const children = filterTree(n.children, filter);
    if (children.length) {
      out.push({ ...n, children });
    }
  }
  return out;
}

function collectDirPaths(nodes: FileTreeNode[], into: Set<string>) {
  for (const n of nodes) {
    if (n.kind === "dir") {
      into.add(n.path);
      collectDirPaths(n.children, into);
    }
  }
}

/**
 * One flat list of `role="treeitem"` rows rather than nested containers.
 *
 * The ARIA tree pattern allows either, and flat is what makes the keyboard
 * model tractable: arrow navigation is index arithmetic over `rows`, and
 * `aria-level` carries the nesting that the DOM no longer does. Nested
 * `role="group"` wrappers would mean walking the DOM to answer "what is the
 * next visible row", which is exactly the bug-prone part.
 */
function TreeRow({
  row,
  active,
  selected,
  onActivate,
  onFocusRow,
  registerRef,
}: {
  row: VisibleRow;
  active: boolean;
  selected: boolean;
  onActivate: (row: VisibleRow) => void;
  onFocusRow: (key: string) => void;
  registerRef: (key: string, el: HTMLDivElement | null) => void;
}) {
  const isDir = row.kind === "dir";
  const c = row.concept;
  return (
    <div
      ref={(el) => registerRef(row.key, el)}
      role="treeitem"
      aria-level={row.depth + 1}
      aria-setsize={row.setSize}
      aria-posinset={row.posInSet}
      aria-expanded={isDir ? row.expanded : undefined}
      aria-selected={isDir ? undefined : selected}
      // Roving tabindex: exactly one row is tabbable, so Tab moves past the
      // whole tree instead of through every file in the workspace.
      tabIndex={active ? 0 : -1}
      data-depth={row.depth}
      data-kind={row.kind}
      className={isDir ? "file-tree-dir" : `file-tree-item ${selected ? "active" : ""}`}
      style={{
        paddingLeft: isDir ? `${0.4 + row.depth * 0.15}rem` : `${0.55 + row.depth * 0.35}rem`,
      }}
      title={row.path}
      onClick={() => onActivate(row)}
      // The tab stop must follow real focus, not only focus this component
      // moved itself. A click, a screen-reader jump, or a programmatic focus
      // all land here without going through the key handler; without this the
      // keyboard state and the DOM diverge and the next key acts on whichever
      // row was last focused *by keyboard*.
      onFocus={() => onFocusRow(row.key)}
    >
      {isDir ? (
        <>
          {row.expanded ? (
            <ChevronDown className="size-3 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="size-3 shrink-0 opacity-70" />
          )}
          {row.expanded ? (
            <FolderOpen className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <Folder className="size-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate flex-1 normal-case tracking-normal font-medium">
            {row.name}
          </span>
        </>
      ) : (
        <>
          <FileText className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate flex-1">{row.name}</span>
          {c?.type && c.type !== "Unknown" && c.type !== "Index" && (
            <span className={`badge ${typeBadge(c.type)}`}>{c.type.replace("Node", "")}</span>
          )}
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  const view = useOkfStore((s) => s.view);
  const setView = useOkfStore((s) => s.setView);
  const concepts = useOkfStore((s) => s.concepts);
  const selectedPath = useOkfStore((s) => s.selectedPath);
  const selectPath = useOkfStore((s) => s.selectPath);
  const fileFilter = useOkfStore((s) => s.fileFilter);
  const setFileFilter = useOkfStore((s) => s.setFileFilter);
  const bundle = useOkfStore((s) => s.bundle);
  const validation = useOkfStore((s) => s.validation);

  const tree = useMemo(() => buildFileTree(concepts), [concepts]);
  const filter = fileFilter.trim().toLowerCase();
  const filtered = useMemo(() => filterTree(tree, filter), [tree, filter]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // What the expansion set was last seeded for. Without this the effect reruns
  // on `tree` identity, and `recompute` builds a fresh concepts map on every
  // save — so saving a file silently collapsed the whole tree. Seeding is a
  // response to "a different bundle" or "a different filter", never to the
  // same bundle being reparsed.
  const seededFor = useRef<string | null>(null);

  // Expand top-level dirs on bundle load; expand matches while filtering.
  useEffect(() => {
    const signature = `${bundle?.id ?? ""}|${filter}`;
    if (seededFor.current === signature) return;
    seededFor.current = signature;

    const next = new Set<string>();
    if (filter) {
      collectDirPaths(filtered, next);
    } else {
      for (const n of tree) {
        if (n.kind === "dir") next.add(n.path);
      }
    }
    setExpanded(next);
  }, [bundle?.id, filter, tree, filtered]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const rows = useMemo(() => flattenTree(filtered, expanded), [filtered, expanded]);

  // Which row owns the tab stop. Kept as a key rather than an index so it
  // survives expanding, collapsing, and filtering, all of which reindex.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const typeahead = useRef({ buffer: "", at: 0 });

  const registerRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(key, el);
    else rowRefs.current.delete(key);
  }, []);

  const activeIndex = rows.findIndex((r) => r.key === activeKey);

  // The tab stop must always exist. If the active row was filtered away or
  // collapsed out of view, hand it to the selected file, else the first row —
  // otherwise the tree becomes unreachable by keyboard entirely.
  useEffect(() => {
    if (!rows.length) return;
    if (rows.some((r) => r.key === activeKey)) return;
    setActiveKey(rows.find((r) => r.path === selectedPath)?.key ?? rows[0].key);
  }, [rows, activeKey, selectedPath]);

  const focusRow = (key: string) => {
    setActiveKey(key);
    rowRefs.current.get(key)?.focus();
  };

  const activate = (row: VisibleRow) => {
    setActiveKey(row.key);
    if (row.kind === "dir") toggle(row.path);
    else selectPath(row.path);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const action = resolveTreeKey(e.key, rows, activeIndex);
    if (action) {
      e.preventDefault();
      if (action.type === "move") focusRow(rows[action.index].key);
      else if (action.type === "expand" || action.type === "collapse") toggle(action.path);
      else activate(action.row);
      return;
    }

    // Typeahead: single printable characters only, so Ctrl/Cmd shortcuts and
    // every named key fall through to the browser untouched.
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    const now = Date.now();
    // A pause restarts the buffer, so "ab" finds "abc" but a later "c" does
    // not silently extend it into "abc" minutes afterwards.
    const buffer = now - typeahead.current.at > 800 ? e.key : typeahead.current.buffer + e.key;
    typeahead.current = { buffer, at: now };
    const hit = findByPrefix(rows, buffer, activeIndex);
    if (hit >= 0) {
      e.preventDefault();
      focusRow(rows[hit].key);
    }
  };

  return (
    <aside className="app-sidebar" data-testid="app-sidebar">
      <nav className="nav-rail" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`nav-${item.id}`}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              <Icon className="size-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-fg-subtle">
            {bundle?.name ?? "Documents"}
          </h3>
          {validation && (
            <span
              className={`badge ${validation.error_count ? "badge-danger" : "badge-success"}`}
              title={`${validation.error_count} errors, ${validation.warn_count} warnings`}
            >
              {validation.error_count ? `${validation.error_count} err` : "valid"}
            </span>
          )}
        </div>
        <div className="search-field max-w-none">
          <Search className="size-3 text-fg-subtle shrink-0" />
          <input
            type="search"
            placeholder="Filter files…"
            value={fileFilter}
            onChange={(e) => setFileFilter(e.target.value)}
            aria-label="Filter files"
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin"
        role="tree"
        aria-label="Workspace files"
        onKeyDown={onKeyDown}
        // Rows below the fold are correct here, not a layout bug — opts this
        // subtree out of the viewport-escape checks in e2e/.
        data-scroll
      >
        {Object.keys(concepts).length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-fg-muted">
            No markdown in workspace. Open a repo or scaffold one.
          </p>
        )}

        {rows.map((row) => (
          <TreeRow
            key={row.key}
            row={row}
            active={row.key === activeKey}
            selected={row.path === selectedPath}
            onActivate={activate}
            onFocusRow={setActiveKey}
            registerRef={registerRef}
          />
        ))}
      </div>

      <div className="border-t border-border px-3 py-2 text-[0.625rem] text-fg-subtle flex items-center gap-1.5">
        <Settings2 className="size-3" />
        {Object.keys(concepts).length} concepts
        {bundle?.source ? ` · ${bundle.source}` : ""}
      </div>
    </aside>
  );
}
