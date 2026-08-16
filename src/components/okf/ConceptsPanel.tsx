import { useMemo, useState } from "react";
import { useOkfStore } from "@/lib/okf/store";

export function ConceptsPanel() {
  const concepts = useOkfStore((s) => s.concepts);
  const selectPath = useOkfStore((s) => s.selectPath);
  const setView = useOkfStore((s) => s.setView);
  const selectedPath = useOkfStore((s) => s.selectedPath);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const list = useMemo(() => Object.values(concepts), [concepts]);
  const types = useMemo(() => {
    const s = new Set(list.map((c) => c.type).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [list]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((c) => (typeFilter === "all" ? true : c.type === typeFilter))
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.path.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [list, query, typeFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-fg">Concepts</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {rows.length} {query || typeFilter !== "all" ? "matching" : "in this workspace"}
          </p>
        </div>

        <div className="panel-card space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search concepts"
            placeholder="Search title, path, type, or tag…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
          />
          <div role="group" aria-label="Concept type" className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={typeFilter === "all"}
              className={`badge ${typeFilter === "all" ? "badge-primary" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={typeFilter === t}
                className={`badge ${typeFilter === t ? "badge-primary" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-card overflow-x-auto">
          {rows.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-fg-muted">No concepts match.</p>
          ) : (
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Verified</th>
                  <th className="px-2 py-2 font-semibold">Path</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.path}
                    className={`cursor-pointer border-t border-border hover:bg-bg-subtle ${
                      selectedPath === c.path ? "bg-primary-muted" : ""
                    }`}
                    onClick={() => {
                      selectPath(c.path);
                      setView("editor");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectPath(c.path);
                        setView("editor");
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-2 py-2 font-medium text-fg">{c.title}</td>
                    <td className="px-2 py-2 text-fg-muted">{c.type}</td>
                    <td className="px-2 py-2 text-fg-muted">{c.status || "—"}</td>
                    <td className="px-2 py-2 text-fg-muted">{c.verified ? "yes" : "no"}</td>
                    <td className="px-2 py-2 font-mono text-[0.7rem] text-fg-subtle">{c.path}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
