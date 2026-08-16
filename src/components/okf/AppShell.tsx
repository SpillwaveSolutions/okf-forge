import { useEffect } from "react";
import { stepZoom } from "@/lib/okf/prefs";
import { useOkfStore } from "@/lib/okf/store";
import { isTauriRuntime } from "@/lib/platform/storage";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { EditorPane } from "./EditorPane";
import { ExplorerPanel } from "./ExplorerPanel";
import { SearchPanel } from "./SearchPanel";
import { LearnPanel } from "./LearnPanel";
import { ClassifyPanel } from "./ClassifyPanel";
import { DeepAgentPanel } from "./DeepAgentPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ConceptsPanel } from "./ConceptsPanel";
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
  const zoom = useOkfStore((s) => s.zoom);
  const setZoom = useOkfStore((s) => s.setZoom);
  const initPrefs = useOkfStore((s) => s.initPrefs);
  const syncSystemTheme = useOkfStore((s) => s.syncSystemTheme);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    initPrefs();
    // Only matters while the preference is `system`; syncSystemTheme itself
    // is the guard, so the listener can stay mounted unconditionally.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => syncSystemTheme(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [initPrefs, syncSystemTheme]);

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

  useEffect(() => {
    // Desktop only. WKWebView has no native zoom, which is the whole reason
    // this exists; in a browser Cmd +/- is the browser's own zoom, which
    // Chrome already persists per-origin. Hijacking it there would risk
    // stacking two zooms if a browser declined preventDefault.
    if (!isTauriRuntime()) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      // "=" is the unshifted key carrying "+" on a US layout, so both arrive
      // depending on whether shift is held.
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom(stepZoom(zoom, 1));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom(stepZoom(zoom, -1));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, setZoom]);

  return (
    <div className="app-shell">
      <Header />
      {/* Grid children must be direct: header | sidebar | main | status.
          Wrapping sidebar+main in app-body collapsed both into the 280px
          left column so nav/editor panels looked dead. */}
      <Sidebar />
      {/* data-view is how tests address a view: there is one route and all
          eight panels are conditional renders, so nothing else identifies
          which one is mounted. */}
      <main className="app-main" data-testid="app-main" data-view={view}>
        {view === "learn" && <LearnPanel />}
        {view === "explorer" && <ExplorerPanel />}
        {view === "concepts" && <ConceptsPanel />}
        {view === "editor" && <EditorPane />}
        {view === "search" && <SearchPanel />}
        {view === "classify" && <ClassifyPanel />}
        {view === "deepagent" && <DeepAgentPanel />}
        {view === "integrations" && <IntegrationsPanel />}
        {view === "settings" && <SettingsPanel />}
      </main>
      <footer className="status-bar" data-testid="app-status">
        <div className="flex items-center gap-3 min-w-0">
          <span>{statusMessage ?? "OKFForge"}</span>
          {validation && (
            <span className="text-fg-subtle">
              {validation.concept_count} concepts · {validation.edge_count} edges
              {validation.error_count > 0
                ? ` · ${validation.error_count} errors`
                : validation.warn_count > 0
                  ? ` · ${validation.warn_count} warnings`
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
          {/* Hidden at 100%: a permanent "100%" is noise. */}
          {zoom !== 1 && (
            <span className="text-fg-muted" data-testid="zoom-level">
              {Math.round(zoom * 100)}%
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
