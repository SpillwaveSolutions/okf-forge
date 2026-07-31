import { useMemo } from "react";
import { useOkfStore } from "@/lib/okf/store";
import { GraphCanvas } from "./GraphCanvas";
import { catalogTree } from "@/lib/okf/graph";

export function ExplorerPanel() {
  const concepts = useOkfStore((s) => s.concepts);
  const selectPath = useOkfStore((s) => s.selectPath);
  const setView = useOkfStore((s) => s.setView);
  const bundle = useOkfStore((s) => s.bundle);
  const validation = useOkfStore((s) => s.validation);
  const graphData = useOkfStore((s) => s.graphData);
  const selectedPath = useOkfStore((s) => s.selectedPath);

  const tree = useMemo(() => catalogTree(concepts), [concepts]);
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of Object.values(concepts)) {
      m.set(c.type, (m.get(c.type) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [concepts]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-fg">
              {bundle?.name ?? "Workspace"}
            </h1>
            <p className="text-sm text-fg-muted mt-1">
              {bundle?.sourceUrl ? (
                <a
                  href={bundle.sourceUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {bundle.sourceUrl}
                </a>
              ) : (
                <>Source: {bundle?.source ?? "—"}</>
              )}
            </p>
          </div>
          {validation && (
            <div className="flex flex-wrap gap-2">
              <span className="badge">
                {validation.concept_count} concepts
              </span>
              <span className="badge">{validation.edge_count} edges</span>
              <span
                className={`badge ${validation.error_count ? "badge-danger" : "badge-success"}`}
              >
                {validation.error_count
                  ? `${validation.error_count} errors`
                  : "valid"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {byType.map(([type, n]) => (
            <span key={type} className="badge">
              {type} · {n}
            </span>
          ))}
        </div>

        {graphData && (
          <div className="panel-card space-y-2">
            <h2 className="text-sm font-semibold text-fg">
              Focus: {graphData.root}
            </h2>
            <GraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              root={graphData.root}
              onSelect={(p) => {
                selectPath(p);
                setView("editor");
              }}
              height={300}
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(tree).map(([dir, list]) => (
            <div key={dir} className="panel-card">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle mb-2">
                {dir}
              </h3>
              <ul className="space-y-1">
                {list.map((c) => (
                  <li key={c.path}>
                    <button
                      type="button"
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-bg-subtle ${
                        selectedPath === c.path
                          ? "bg-primary-muted text-primary"
                          : "text-fg-muted"
                      }`}
                      onClick={() => {
                        selectPath(c.path);
                        setView("editor");
                      }}
                    >
                      <span className="block truncate font-medium">
                        {c.title}
                      </span>
                      <span className="block text-[10px] opacity-70 font-mono truncate">
                        {c.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
