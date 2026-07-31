import { useMemo } from "react";
import {
  Bot,
  BookOpen,
  FileText,
  FolderTree,
  Network,
  Plug,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import type { AppView, Concept } from "@/lib/okf/types";
import { catalogTree } from "@/lib/okf/graph";

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

  const tree = useMemo(() => catalogTree(concepts), [concepts]);

  const filter = fileFilter.trim().toLowerCase();
  const match = (c: Concept) => {
    if (!filter) return true;
    return (
      c.path.toLowerCase().includes(filter) ||
      c.title.toLowerCase().includes(filter) ||
      c.type.toLowerCase().includes(filter)
    );
  };

  return (
    <aside className="app-sidebar">
      <nav className="nav-rail" aria-label="Primary">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
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
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
            {bundle?.name ?? "Documents"}
          </h3>
          {validation && (
            <span
              className={`badge ${validation.error_count ? "badge-danger" : "badge-success"}`}
              title={`${validation.error_count} errors, ${validation.warn_count} warnings`}
            >
              {validation.error_count
                ? `${validation.error_count} err`
                : "valid"}
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

      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {Object.keys(concepts).length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-fg-muted">
            No markdown in workspace. Open a repo or scaffold one.
          </p>
        )}

        {Object.entries(tree).map(([dir, list]) => {
          const filtered = list.filter(match);
          if (!filtered.length) return null;
          return (
            <div key={dir} className="mb-3">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">
                {dir}
              </div>
              <div role="listbox" aria-label={`${dir} concepts`}>
                {filtered.map((c) => (
                  <button
                    key={c.path}
                    type="button"
                    role="option"
                    aria-selected={selectedPath === c.path}
                    className={`file-tree-item ${selectedPath === c.path ? "active" : ""}`}
                    onClick={() => selectPath(c.path)}
                  >
                    <FileText className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate flex-1">
                      {c.path.split("/").pop()}
                    </span>
                    {c.type && c.type !== "Unknown" && c.type !== "Index" && (
                      <span className={`badge ${typeBadge(c.type)}`}>
                        {c.type.replace("Node", "")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-3 py-2 text-[10px] text-fg-subtle flex items-center gap-1.5">
        <Settings2 className="size-3" />
        {Object.keys(concepts).length} concepts
        {bundle?.source ? ` · ${bundle.source}` : ""}
      </div>
    </aside>
  );
}
