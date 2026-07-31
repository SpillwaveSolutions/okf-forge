import {
  BookOpen,
  FolderOpen,
  GitBranch,
  Search,
  Sparkles,
} from "lucide-react";
import { useOkfStore, type EditorViewMode } from "@/lib/okf/store";

const MODES: { id: EditorViewMode; label: string }[] = [
  { id: "wysiwyg", label: "Preview" },
  { id: "markdown", label: "Markdown" },
  { id: "split", label: "Split" },
];

export function Header() {
  const fileFilter = useOkfStore((s) => s.fileFilter);
  const setFileFilter = useOkfStore((s) => s.setFileFilter);
  const searchQuery = useOkfStore((s) => s.searchQuery);
  const setSearchQuery = useOkfStore((s) => s.setSearchQuery);
  const runSearch = useOkfStore((s) => s.runSearch);
  const editorMode = useOkfStore((s) => s.editorMode);
  const setEditorMode = useOkfStore((s) => s.setEditorMode);
  const setOpenDialog = useOkfStore((s) => s.setOpenDialog);
  const setView = useOkfStore((s) => s.setView);
  const dirty = useOkfStore((s) => s.dirty);
  const saveEditor = useOkfStore((s) => s.saveEditor);
  const bundle = useOkfStore((s) => s.bundle);
  const loading = useOkfStore((s) => s.loading);
  const isDesktop = useOkfStore((s) => s.isDesktop);

  return (
    <header className="app-header">
      <div className="flex items-center gap-2 shrink-0">
        <div className="logo-mark" aria-hidden>
          <GitBranch className="size-3.5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-fg">
            OKFForge
          </div>
          <div className="text-[10px] text-fg-subtle hidden sm:block">
            {isDesktop ? "Desktop workbench" : "Graph engineering workbench"}
          </div>
        </div>
      </div>

      <div className="search-field hide-mobile">
        <Search className="size-3.5 text-fg-subtle shrink-0" />
        <input
          type="search"
          placeholder="Search concepts, types, tags…"
          value={searchQuery || fileFilter}
          onChange={(e) => {
            setFileFilter(e.target.value);
            setSearchQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          aria-label="Search notes and graph"
        />
      </div>

      <div
        className="view-toggle hide-mobile"
        role="group"
        aria-label="Editor view mode"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`view-toggle-btn ${editorMode === m.id ? "active" : ""}`}
            onClick={() => {
              setEditorMode(m.id);
              setView("editor");
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <button
          type="button"
          className="btn btn-ghost hide-mobile"
          onClick={() => setView("learn")}
          title="Learn OKF"
        >
          <BookOpen className="size-3.5" />
          <span className="hidden lg:inline">Learn</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpenDialog(true)}
          disabled={loading}
          data-testid="header-open"
          aria-label="Open repository"
        >
          <FolderOpen className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Open</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary hide-mobile"
          onClick={() => setView("classify")}
        >
          <Sparkles className="size-3.5" />
          <span className="hidden lg:inline">Classify</span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => saveEditor()}
          disabled={!dirty}
          title="Save (⌘S)"
          data-testid="header-save"
          aria-label={dirty ? "Save" : "Saved"}
        >
          {dirty ? "Save" : "Saved"}
        </button>
      </div>

      {bundle && (
        <div className="sr-only" aria-live="polite">
          Workspace {bundle.name}
        </div>
      )}
    </header>
  );
}
