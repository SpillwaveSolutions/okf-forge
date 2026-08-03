import { useEffect, useMemo, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import type { AppView, Concept } from "@/lib/okf/types";
import { buildFileTree, type FileTreeNode } from "@/lib/okf/graph";

const NAV: { id: AppView; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "Learn OKF", icon: BookOpen },
  { id: "explorer", label: "Explorer", icon: FolderTree },
  { id: "editor", label: "Editor", icon: FileText },
  { id: "search", label: "Graph & Search", icon: Network },
  { id: "classify", label: "Classify", icon: Sparkles },
  { id: "deepagent", label: "DeepAgents", icon: Bot },
  { id: "integrations", label: "Plugins & MCP", icon: Plug },
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

function TreeBranch({
  nodes,
  depth,
  expanded,
  toggle,
  selectedPath,
  onOpen,
}: {
  nodes: FileTreeNode[];
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  selectedPath: string | null;
  onOpen: (path: string) => void;
}) {
  return (
    <div className={depth > 0 ? "file-tree-children" : undefined}>
      {nodes.map((n) => {
        if (n.kind === "dir") {
          const isOpen = expanded.has(n.path);
          return (
            <div key={`d:${n.path}`}>
              <button
                type="button"
                className="file-tree-dir"
                style={{ paddingLeft: `${0.4 + depth * 0.15}rem` }}
                onClick={() => toggle(n.path)}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown className="size-3 shrink-0 opacity-70" />
                ) : (
                  <ChevronRight className="size-3 shrink-0 opacity-70" />
                )}
                {isOpen ? (
                  <FolderOpen className="size-3.5 shrink-0 opacity-70" />
                ) : (
                  <Folder className="size-3.5 shrink-0 opacity-70" />
                )}
                <span className="truncate flex-1 normal-case tracking-normal font-medium">
                  {n.name}
                </span>
              </button>
              {isOpen && (
                <TreeBranch
                  nodes={n.children}
                  depth={depth + 1}
                  expanded={expanded}
                  toggle={toggle}
                  selectedPath={selectedPath}
                  onOpen={onOpen}
                />
              )}
            </div>
          );
        }

        const c = n.concept;
        return (
          <button
            key={n.path}
            type="button"
            role="option"
            aria-selected={selectedPath === n.path}
            className={`file-tree-item ${selectedPath === n.path ? "active" : ""}`}
            style={{ paddingLeft: `${0.55 + depth * 0.35}rem` }}
            title={n.path}
            onClick={() => onOpen(n.path)}
            onDoubleClick={() => onOpen(n.path)}
          >
            <FileText className="size-3.5 shrink-0 opacity-60" />
            <span className="truncate flex-1">{n.name}</span>
            {c.type && c.type !== "Unknown" && c.type !== "Index" && (
              <span className={`badge ${typeBadge(c.type)}`}>{c.type.replace("Node", "")}</span>
            )}
          </button>
        );
      })}
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

  // Expand top-level dirs on bundle load; expand matches while filtering
  useEffect(() => {
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

  const onOpen = (path: string) => {
    selectPath(path);
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
        role="listbox"
        aria-label="Workspace files"
        // Rows below the fold are correct here, not a layout bug — opts this
        // subtree out of the viewport-escape check in e2e/layout.spec.ts.
        data-scroll
      >
        {Object.keys(concepts).length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-fg-muted">
            No markdown in workspace. Open a repo or scaffold one.
          </p>
        )}

        <TreeBranch
          nodes={filtered}
          depth={0}
          expanded={expanded}
          toggle={toggle}
          selectedPath={selectedPath}
          onOpen={onOpen}
        />
      </div>

      <div className="border-t border-border px-3 py-2 text-[0.625rem] text-fg-subtle flex items-center gap-1.5">
        <Settings2 className="size-3" />
        {Object.keys(concepts).length} concepts
        {bundle?.source ? ` · ${bundle.source}` : ""}
      </div>
    </aside>
  );
}
