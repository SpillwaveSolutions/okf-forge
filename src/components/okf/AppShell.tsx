import { useEffect } from "react";
import { useOkfStore } from "@/lib/okf/store";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { EditorPane } from "./EditorPane";
import { ExplorerPanel } from "./ExplorerPanel";
import { SearchPanel } from "./SearchPanel";
import { LearnPanel } from "./LearnPanel";
import { ClassifyPanel } from "./ClassifyPanel";
import { DeepAgentPanel } from "./DeepAgentPanel";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { OpenBundleDialog } from "./OpenBundleDialog";

export function AppShell() {
  const init = useOkfStore((s) => s.init);
  const view = useOkfStore((s) => s.view);
  const toast = useOkfStore((s) => s.toast);
  const clearToast = useOkfStore((s) => s.clearToast);
  const saveEditor = useOkfStore((s) => s.saveEditor);
  const statusMessage = useOkfStore((s) => s.statusMessage);
  const validation = useOkfStore((s) => s.validation);
  const selectedPath = useOkfStore((s) => s.selectedPath);
  const dirty = useOkfStore((s) => s.dirty);
  const loading = useOkfStore((s) => s.loading);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEditor();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveEditor]);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {view === "learn" && <LearnPanel />}
          {view === "explorer" && <ExplorerPanel />}
          {view === "editor" && <EditorPane />}
          {view === "search" && <SearchPanel />}
          {view === "classify" && <ClassifyPanel />}
          {view === "deepagent" && <DeepAgentPanel />}
          {view === "integrations" && <IntegrationsPanel />}
        </main>
      </div>
      <footer className="status-bar">
        <div className="flex items-center gap-3 min-w-0">
          <span>{statusMessage ?? "OKFForge"}</span>
          {validation && (
            <span className="text-fg-subtle">
              {validation.conceptCount} concepts · {validation.edgeCount} edges
              {validation.errors > 0
                ? ` · ${validation.errors} errors`
                : validation.warnings > 0
                  ? ` · ${validation.warnings} warnings`
                  : " · healthy"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedPath && (
            <span className="truncate max-w-[40vw] text-fg-muted">
              {selectedPath}
              {dirty ? " *" : ""}
            </span>
          )}
          {loading && <span className="text-primary">Loading…</span>}
        </div>
      </footer>
      <OpenBundleDialog />
      {toast && (
        <div className="toast" role="status" onClick={() => clearToast()}>
          {toast}
        </div>
      )}
    </div>
  );
}
