import { useOkfStore } from "@/lib/okf/store";
import { GraphCanvas } from "./GraphCanvas";
import { MarkdownPreview } from "./MarkdownPreview";

export function SearchPanel() {
  const searchQuery = useOkfStore((s) => s.searchQuery);
  const setSearchQuery = useOkfStore((s) => s.setSearchQuery);
  const runSearch = useOkfStore((s) => s.runSearch);
  const searchHits = useOkfStore((s) => s.searchHits);
  const impactTarget = useOkfStore((s) => s.impactTarget);
  const impactResult = useOkfStore((s) => s.impactResult);
  const packResult = useOkfStore((s) => s.packResult);
  const packHops = useOkfStore((s) => s.packHops);
  const packMaxNodes = useOkfStore((s) => s.packMaxNodes);
  const setPackOpts = useOkfStore((s) => s.setPackOpts);
  const runImpact = useOkfStore((s) => s.runImpact);
  const runPack = useOkfStore((s) => s.runPack);
  const graphData = useOkfStore((s) => s.graphData);
  const graphHops = useOkfStore((s) => s.graphHops);
  const setGraphHops = useOkfStore((s) => s.setGraphHops);
  const selectPath = useOkfStore((s) => s.selectPath);
  const concepts = useOkfStore((s) => s.concepts);
  const validation = useOkfStore((s) => s.validation);
  const setView = useOkfStore((s) => s.setView);

  const conceptList = Object.values(concepts).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-fg">Graph & search</h1>
          <p className="text-sm text-fg-muted mt-1">
            Full-text search over concepts plus okf-graph ops: impact, pack, neighborhood,
            validation.
          </p>
        </div>

        <div className="panel-card space-y-3">
          <label className="field-label">Search</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="field-input flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="impact analysis, AgentNode, routes_to…"
              aria-label="Graph search query"
            />
            <button type="button" className="btn btn-primary" onClick={runSearch}>
              Search
            </button>
          </div>
          {searchHits.length > 0 && (
            <ul className="divide-y divide-border">
              {searchHits.map((h) => (
                <li key={h.path}>
                  <button
                    type="button"
                    className="w-full text-left py-2.5 hover:bg-bg-subtle px-2 rounded-md"
                    onClick={() => {
                      selectPath(h.path);
                      setView("editor");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">{h.title}</span>
                      <span className="badge">{h.type}</span>
                      <span className="text-[10px] text-fg-subtle ml-auto">score {h.score}</span>
                    </div>
                    <p className="text-xs text-fg-muted mt-0.5 font-mono">{h.path}</p>
                    {h.snippet && (
                      <p className="text-xs text-fg-subtle mt-1 line-clamp-2">{h.snippet}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="panel-card space-y-3">
            <h2 className="text-sm font-semibold text-fg">Impact analysis</h2>
            <label className="field-label">Target concept</label>
            <select
              className="field-input"
              value={impactTarget}
              onChange={(e) => runImpact(e.target.value)}
              aria-label="Impact target"
            >
              {conceptList.map((c) => (
                <option key={c.path} value={c.path}>
                  {c.title} ({c.path})
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-secondary" onClick={() => runImpact()}>
              Compute impact
            </button>
            {impactResult && (
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-primary">
                    inbound {impactResult.stats.inbound_count}
                  </span>
                  <span className="badge">outbound {impactResult.stats.outbound_count}</span>
                  <span className="badge">typed {impactResult.stats.typed_edge_count}</span>
                </div>
                <div>
                  <div className="field-label">Suggested update order</div>
                  <ol className="list-decimal pl-4 text-fg-muted space-y-0.5">
                    {impactResult.suggested_order.slice(0, 12).map((id) => (
                      <li key={id}>
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => selectPath(id)}
                        >
                          {id}
                        </button>
                        {impactResult.inbound.find((n) => n.id === id) && (
                          <span className="ml-1 badge">
                            {impactResult.inbound.find((n) => n.id === id)!.criticality}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="panel-card space-y-3">
            <h2 className="text-sm font-semibold text-fg">Progressive disclosure pack</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="field-label">Hops</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="field-input"
                  value={packHops}
                  onChange={(e) => setPackOpts(Number(e.target.value) || 2, packMaxNodes)}
                />
              </div>
              <div>
                <label className="field-label">Max nodes</label>
                <input
                  type="number"
                  min={3}
                  max={50}
                  className="field-input"
                  value={packMaxNodes}
                  onChange={(e) => setPackOpts(packHops, Number(e.target.value) || 20)}
                />
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => runPack()}>
              Build pack
            </button>
            {packResult && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-primary">{packResult.nodes.length} nodes</span>
                  <span className="badge">{packResult.mode}</span>
                  {packResult.excluded.length > 0 && (
                    <span className="badge badge-warn">{packResult.excluded.length} trimmed</span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-bg p-3">
                  <MarkdownPreview source={packResult.markdown} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel-card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">Neighborhood graph</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-fg-muted">Hops</label>
              <input
                type="number"
                min={1}
                max={4}
                className="field-input w-20"
                value={graphHops}
                onChange={(e) => setGraphHops(Number(e.target.value) || 2)}
              />
            </div>
          </div>
          {graphData ? (
            <GraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              root={graphData.root}
              onSelect={(p) => {
                selectPath(p);
              }}
              height={360}
            />
          ) : (
            <p className="text-sm text-fg-muted">Select a concept to visualize.</p>
          )}
        </div>

        {validation && (
          <div className="panel-card space-y-2">
            <h2 className="text-sm font-semibold text-fg">Validation</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge">{validation.concept_count} concepts</span>
              <span className="badge">{validation.edge_count} edges</span>
              <span
                className={`badge ${validation.error_count ? "badge-danger" : "badge-success"}`}
              >
                {validation.error_count} errors
              </span>
              <span className="badge badge-warn">{validation.warn_count} warnings</span>
            </div>
            <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
              {validation.issues.slice(0, 40).map((iss, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={`badge ${
                      iss.severity === "error"
                        ? "badge-danger"
                        : iss.severity === "warn"
                          ? "badge-warn"
                          : ""
                    }`}
                  >
                    {iss.severity}
                  </span>
                  <span className="text-fg-muted">
                    {iss.message}
                    {iss.path ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => selectPath(iss.path!)}
                        >
                          {iss.path}
                        </button>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
