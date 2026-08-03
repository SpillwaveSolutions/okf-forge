import { useMemo } from "react";
import type { GraphEdge, GraphNode } from "@/lib/okf/types";

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root?: string;
  onSelect?: (path: string) => void;
  height?: number;
}

/** Force-free radial layout around root for subgraph visualization. */
export function GraphCanvas({ nodes, edges, root, onSelect, height = 320 }: Props) {
  const layout = useMemo(() => {
    if (!nodes.length) return [] as Array<GraphNode & { x: number; y: number }>;
    const w = 640;
    const h = height;
    const cx = w / 2;
    const cy = h / 2;
    const rootId = root && nodes.some((n) => n.id === root) ? root : nodes[0]!.id;
    const others = nodes.filter((n) => n.id !== rootId);
    const r = Math.min(w, h) * 0.36;
    const placed: Array<GraphNode & { x: number; y: number }> = [
      { ...nodes.find((n) => n.id === rootId)!, x: cx, y: cy },
    ];
    others.forEach((n, i) => {
      const angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const ring = n.depth && n.depth > 1 ? r * 1.15 : r;
      placed.push({
        ...n,
        x: cx + Math.cos(angle) * ring,
        y: cy + Math.sin(angle) * ring,
      });
    });
    return placed;
  }, [nodes, root, height]);

  const byId = useMemo(() => {
    const m = new Map(layout.map((n) => [n.id, n]));
    return m;
  }, [layout]);

  if (!nodes.length) {
    return (
      <div
        className="flex items-center justify-center text-fg-muted text-sm border border-border rounded-lg bg-bg-elevated"
        style={{ height }}
      >
        No graph nodes — select a concept
      </div>
    );
  }

  const w = 640;
  const h = height;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="OKF concept graph"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            {/* Themed via the `style` prop, not a `fill=` attribute: var() is
                not reliably honoured in SVG presentation attributes, but a CSS
                declaration always resolves it — and CSS wins over the attribute
                anyway. Same reason for every fill/stroke below. */}
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: "var(--okf-border-strong)" }} />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const typed = e.rel !== "links_to";
          return (
            <g key={`${e.from}-${e.to}-${i}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                style={{ stroke: typed ? "var(--okf-primary)" : "var(--okf-border)" }}
                strokeWidth={typed ? 1.5 : 1}
                strokeDasharray={typed ? undefined : "4 3"}
                markerEnd="url(#arrow)"
              />
              {typed && (
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 4}
                  style={{ fill: "var(--okf-fg-subtle)" }}
                  fontSize="9"
                  textAnchor="middle"
                >
                  {e.rel}
                </text>
              )}
            </g>
          );
        })}
        {layout.map((n) => {
          const isRoot = n.id === root || n.id === layout[0]?.id;
          const r = isRoot ? 22 : 16;
          const fill =
            n.type === "AgentNode"
              ? "var(--okf-primary)"
              : n.type === "Workflow"
                ? "var(--okf-accent)"
                : n.criticality === "critical"
                  ? "var(--okf-danger)"
                  : "var(--okf-bg-subtle)";
          return (
            <g
              key={n.id}
              className="cursor-pointer"
              onClick={() => onSelect?.(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") onSelect?.(n.id);
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                style={{
                  fill,
                  stroke: isRoot ? "var(--okf-primary)" : "var(--okf-border)",
                }}
                strokeWidth={isRoot ? 2 : 1}
              />
              <text
                x={n.x}
                y={n.y + r + 12}
                style={{ fill: "var(--okf-fg)" }}
                fontSize="10"
                textAnchor="middle"
              >
                {n.title.length > 22 ? n.title.slice(0, 20) + "…" : n.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
