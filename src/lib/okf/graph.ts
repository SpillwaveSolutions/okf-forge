import {
  extractFrontmatterLinks,
  extractMarkdownLinks,
  mergeEdges,
  parseFrontmatter,
} from "./frontmatter";
import {
  HIGH_IMPACT_TYPES,
  MEDIUM_IMPACT_TYPES,
  type Concept,
  type Criticality,
  type GraphEdge,
  type GraphNode,
  type ImpactResult,
  type OkfBundle,
  type PackResult,
  type SearchHit,
  type ValidateIssue,
  type ValidateResult,
} from "./types";

export function loadConcepts(
  files: Record<string, string>,
): Record<string, Concept> {
  const fileSet = new Set(Object.keys(files));
  const concepts: Record<string, Concept> = {};

  for (const path of Object.keys(files).sort()) {
    if (!path.endsWith(".md") || path.split("/").pop()?.startsWith("."))
      continue;
    const raw = files[path] ?? "";
    const { meta, body } = parseFrontmatter(raw);
    const mdEdges = extractMarkdownLinks(raw, path, fileSet);
    const fmEdges = extractFrontmatterLinks(meta, path, fileSet);
    const edges = mergeEdges(mdEdges, fmEdges);
    const tags = Array.isArray(meta.tags)
      ? (meta.tags as unknown[]).map(String)
      : [];
    concepts[path] = {
      path,
      title: String(
        meta.title || path.split("/").pop()?.replace(/\.md$/, "") || path,
      ),
      type: String(
        meta.type || (path.endsWith("index.md") ? "Index" : "Unknown"),
      ),
      status: String(meta.status || ""),
      verified: Boolean(meta.verified),
      tags,
      meta,
      body,
      raw,
      outbound: edges.map((e) => e.target),
      edges,
    };
  }

  for (const c of Object.values(concepts)) {
    c.outbound = c.outbound.filter((t) => t in concepts);
  }
  return concepts;
}

export function buildInbound(
  concepts: Record<string, Concept>,
): Record<string, string[]> {
  const inbound: Record<string, string[]> = {};
  for (const [rel, c] of Object.entries(concepts)) {
    for (const tgt of c.outbound) {
      if (!(tgt in concepts)) continue;
      (inbound[tgt] ??= []).push(rel);
    }
  }
  return inbound;
}

export function resolveConcept(
  concepts: Record<string, Concept>,
  query: string,
): string | null {
  const q = query.trim().replace(/^\/+/, "");
  if (q in concepts) return q;
  const qLower = q.toLowerCase();
  for (const [rel, c] of Object.entries(concepts)) {
    const stem = rel.split("/").pop()?.replace(/\.md$/, "") ?? "";
    if (stem.toLowerCase() === qLower || c.title.toLowerCase() === qLower)
      return rel;
    if (rel.endsWith(q) || rel.endsWith(q + ".md")) return rel;
  }
  return null;
}

function bfsClosure(
  start: string,
  edges: Record<string, string[]>,
  hops: number | null = null,
): Array<{ id: string; depth: number }> {
  const seen = new Set([start]);
  const q: Array<[string, number]> = [[start, 0]];
  const out: Array<{ id: string; depth: number }> = [];
  while (q.length) {
    const [node, depth] = q.shift()!;
    if (node !== start) out.push({ id: node, depth });
    if (hops !== null && depth >= hops) continue;
    for (const nxt of edges[node] ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        q.push([nxt, depth + 1]);
      }
    }
  }
  return out;
}

export function criticalityOf(c: Concept): Criticality {
  let criticality: Criticality = "low";
  if (HIGH_IMPACT_TYPES.has(c.type)) criticality = "high";
  else if (MEDIUM_IMPACT_TYPES.has(c.type)) criticality = "medium";
  if (!c.verified && criticality !== "low") {
    criticality = criticality === "high" ? "critical" : criticality;
  }
  return criticality;
}

function enrichNodes(
  concepts: Record<string, Concept>,
  items: Array<{ id: string; depth: number }>,
): GraphNode[] {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const result: GraphNode[] = [];
  for (const item of items) {
    const c = concepts[item.id];
    if (!c) continue;
    result.push({
      id: item.id,
      depth: item.depth,
      title: c.title,
      type: c.type,
      status: c.status,
      verified: c.verified,
      criticality: criticalityOf(c),
    });
  }
  result.sort(
    (a, b) =>
      (order[a.criticality] ?? 9) - (order[b.criticality] ?? 9) ||
      (a.depth ?? 0) - (b.depth ?? 0) ||
      a.title.localeCompare(b.title),
  );
  return result;
}

function toNode(c: Concept, depth?: number): GraphNode {
  return {
    id: c.path,
    title: c.title,
    type: c.type,
    status: c.status,
    verified: c.verified,
    criticality: criticalityOf(c),
    depth,
  };
}

export function impact(
  concepts: Record<string, Concept>,
  conceptQuery: string,
): ImpactResult | { error: string } {
  const inboundMap = buildInbound(concepts);
  const outboundMap: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(concepts)) outboundMap[k] = v.outbound;

  const target = resolveConcept(concepts, conceptQuery);
  if (!target || !concepts[target])
    return { error: `concept not found: ${conceptQuery}` };

  const c = concepts[target]!;
  const inbound = enrichNodes(concepts, bfsClosure(target, inboundMap));
  const outbound = enrichNodes(concepts, bfsClosure(target, outboundMap));

  const direct_out = c.edges
    .filter((e) => e.target in concepts)
    .map((e) => ({ to: e.target, rel: e.rel, source: e.source }));
  const direct_in: Array<{ from: string; rel: string; source: string }> = [];
  for (const [rel, concept] of Object.entries(concepts)) {
    for (const e of concept.edges) {
      if (e.target === target)
        direct_in.push({ from: rel, rel: e.rel, source: e.source });
    }
  }

  return {
    target: toNode(c),
    inbound,
    outbound,
    direct_edges: { inbound: direct_in, outbound: direct_out },
    suggested_order: inbound.map((x) => x.id),
    stats: {
      inbound_count: inbound.length,
      outbound_count: outbound.length,
      total_concepts: Object.keys(concepts).length,
      typed_edge_count: c.edges.filter((e) => e.rel !== "links_to").length,
    },
  };
}

export function pack(
  concepts: Record<string, Concept>,
  conceptQuery: string,
  hops = 2,
  maxNodes = 20,
  undirected = false,
): PackResult | { error: string } {
  const target = resolveConcept(concepts, conceptQuery);
  if (!target || !concepts[target])
    return { error: `concept not found: ${conceptQuery}` };

  const outboundMap: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(concepts))
    outboundMap[k] = v.outbound.filter((o) => o in concepts);

  let graph: Record<string, string[]>;
  if (undirected) {
    const g: Record<string, string[]> = {};
    for (const [k, outs] of Object.entries(outboundMap)) {
      for (const o of outs) {
        (g[k] ??= []).push(o);
        (g[o] ??= []).push(k);
      }
    }
    graph = Object.fromEntries(
      Object.entries(g).map(([k, v]) => [k, [...new Set(v)].sort()]),
    );
  } else {
    graph = outboundMap;
  }

  const neighborhood = [
    target,
    ...bfsClosure(target, graph, hops)
      .map((x) => x.id)
      .filter((id) => id in concepts),
  ];

  const scoreNums = (nid: string): number[] => {
    const c = concepts[nid];
    if (!c) return [9, 9, 9];
    return [
      nid === target ? 0 : 1,
      c.verified ? 0 : 1,
      HIGH_IMPACT_TYPES.has(c.type) ? 0 : 1,
    ];
  };

  const ranked = [...new Set(neighborhood)]
    .filter((n) => n in concepts)
    .sort((a, b) => {
      const sa = scoreNums(a);
      const sb = scoreNums(b);
      for (let i = 0; i < 3; i++) {
        if (sa[i]! !== sb[i]!) return sa[i]! - sb[i]!;
      }
      return (concepts[a]?.title ?? a).localeCompare(concepts[b]?.title ?? b);
    });

  const included = ranked.slice(0, Math.max(1, maxNodes));
  const excluded = ranked.filter((n) => !included.includes(n));
  const nodeSet = new Set(included);
  const edges: GraphEdge[] = [];
  for (const n of included) {
    for (const e of concepts[n]!.edges) {
      if (nodeSet.has(e.target))
        edges.push({ from: n, to: e.target, rel: e.rel, source: e.source });
    }
  }

  const read_order = [...included].sort((a, b) => {
    const ca = concepts[a]!;
    const cb = concepts[b]!;
    return (
      (a === target ? 0 : 1) - (b === target ? 0 : 1) ||
      (HIGH_IMPACT_TYPES.has(ca.type) ? 0 : 1) -
        (HIGH_IMPACT_TYPES.has(cb.type) ? 0 : 1) ||
      (ca.type === "SharedState" ? 0 : 1) -
        (cb.type === "SharedState" ? 0 : 1) ||
      ca.title.localeCompare(cb.title)
    );
  });

  const lines = [
    `# Context pack: ${concepts[target]!.title}`,
    ``,
    `Root: \`${target}\` · hops=${hops} · mode=${undirected ? "undirected" : "outbound"} · nodes=${included.length}`,
    ``,
  ];
  for (const n of read_order) {
    const c = concepts[n]!;
    lines.push(`## ${c.title}`);
    lines.push(``);
    lines.push(`- path: \`${n}\``);
    lines.push(`- type: \`${c.type}\``);
    lines.push(`- verified: ${c.verified}`);
    if (c.tags.length) lines.push(`- tags: ${c.tags.join(", ")}`);
    lines.push(``);
    const excerpt = c.body.trim().split("\n").slice(0, 12).join("\n");
    if (excerpt) {
      lines.push(excerpt);
      lines.push(``);
    }
  }

  return {
    root: target,
    hops,
    max_nodes: maxNodes,
    mode: undirected ? "undirected" : "outbound",
    nodes: included.map((id) => toNode(concepts[id]!)),
    edges,
    read_order,
    markdown: lines.join("\n"),
    excluded,
  };
}

export function subgraph(
  concepts: Record<string, Concept>,
  conceptQuery: string,
  hops = 2,
):
  | { root: string; hops: number; nodes: GraphNode[]; edges: GraphEdge[] }
  | { error: string } {
  const target = resolveConcept(concepts, conceptQuery);
  if (!target || !concepts[target])
    return { error: `concept not found: ${conceptQuery}` };

  const inboundMap = buildInbound(concepts);
  const undirected: Record<string, string[]> = {};
  for (const [k, c] of Object.entries(concepts)) {
    for (const o of c.outbound) {
      (undirected[k] ??= []).push(o);
      (undirected[o] ??= []).push(k);
    }
  }
  for (const [k, ins] of Object.entries(inboundMap)) {
    for (const i of ins) {
      (undirected[k] ??= []).push(i);
      (undirected[i] ??= []).push(k);
    }
  }
  const graph = Object.fromEntries(
    Object.entries(undirected).map(([k, v]) => [k, [...new Set(v)].sort()]),
  );

  const nodes = [
    target,
    ...bfsClosure(target, graph, hops).map((x) => x.id),
  ].filter((n, i, a) => a.indexOf(n) === i && n in concepts);
  const nodeSet = new Set(nodes);
  const edges: GraphEdge[] = [];
  for (const n of nodes) {
    for (const e of concepts[n]!.edges) {
      if (nodeSet.has(e.target))
        edges.push({ from: n, to: e.target, rel: e.rel, source: e.source });
    }
  }
  return {
    root: target,
    hops,
    nodes: nodes.map((id) => toNode(concepts[id]!)),
    edges,
  };
}

export function validateBundle(
  concepts: Record<string, Concept>,
  files: Record<string, string>,
): ValidateResult {
  const issues: ValidateIssue[] = [];
  const paths = Object.keys(files);

  if (!("index.md" in files)) {
    issues.push({
      severity: "error",
      code: "missing_root_index",
      message: "Root index.md is missing",
    });
  } else {
    const { meta } = parseFrontmatter(files["index.md"]!);
    if (!meta.okf_version) {
      issues.push({
        severity: "warn",
        code: "missing_okf_version",
        message: 'Root index.md should declare okf_version: "0.2"',
        path: "index.md",
      });
    }
  }

  if (!("log.md" in files)) {
    issues.push({
      severity: "warn",
      code: "missing_log",
      message: "log.md is missing (recommended for change history)",
    });
  }

  let edgeCount = 0;
  const inbound = buildInbound(concepts);

  for (const [path, c] of Object.entries(concepts)) {
    edgeCount += c.edges.length;
    if (
      !path.endsWith("index.md") &&
      path !== "log.md" &&
      (!c.meta.type || c.type === "Unknown")
    ) {
      issues.push({
        severity: "warn",
        code: "missing_type",
        message: "Concept missing frontmatter type",
        path,
      });
    }
    if (!c.meta.title && !path.endsWith("index.md") && path !== "log.md") {
      issues.push({
        severity: "warn",
        code: "missing_title",
        message: "Concept missing title",
        path,
      });
    }
    for (const e of c.edges) {
      if (!(e.target in concepts) && !paths.includes(e.target)) {
        issues.push({
          severity: "error",
          code: "broken_link",
          message: `Broken link to ${e.target}`,
          path,
        });
      }
    }
    if (
      HIGH_IMPACT_TYPES.has(c.type) &&
      !c.verified &&
      !path.endsWith("index.md")
    ) {
      issues.push({
        severity: "warn",
        code: "unverified_high_impact",
        message: `High-impact ${c.type} is not verified`,
        path,
      });
    }
    const ins = inbound[path] ?? [];
    if (
      !path.endsWith("index.md") &&
      path !== "log.md" &&
      ins.length === 0 &&
      c.outbound.length === 0
    ) {
      issues.push({
        severity: "info",
        code: "orphan",
        message: "Orphan concept (no inbound or outbound edges)",
        path,
      });
    }
  }

  return {
    concept_count: Object.keys(concepts).length,
    edge_count: edgeCount,
    issues,
    error_count: issues.filter((i) => i.severity === "error").length,
    warn_count: issues.filter((i) => i.severity === "warn").length,
  };
}

export function listEdges(
  concepts: Record<string, Concept>,
  opts?: { from?: string; rel?: string },
): GraphEdge[] {
  const out: GraphEdge[] = [];
  for (const [rel, c] of Object.entries(concepts)) {
    if (opts?.from && rel !== opts.from && !rel.endsWith(opts.from)) continue;
    for (const e of c.edges) {
      if (opts?.rel && e.rel !== opts.rel) continue;
      out.push({ from: rel, to: e.target, rel: e.rel, source: e.source });
    }
  }
  return out;
}

export function searchConcepts(
  concepts: Record<string, Concept>,
  query: string,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const c of Object.values(concepts)) {
    const hay = [
      c.path,
      c.title,
      c.type,
      c.tags.join(" "),
      c.body,
      String(c.meta.description ?? ""),
    ]
      .join("\n")
      .toLowerCase();

    let score = 0;
    for (const t of terms) {
      if (c.title.toLowerCase().includes(t)) score += 8;
      if (c.path.toLowerCase().includes(t)) score += 5;
      if (c.type.toLowerCase() === t) score += 6;
      if (c.tags.some((tag) => tag.toLowerCase().includes(t))) score += 4;
      if (hay.includes(t)) score += 1;
    }
    if (score === 0) continue;

    const idx = hay.indexOf(terms[0]!);
    const start = Math.max(0, idx - 40);
    const snippet = (c.body || c.title)
      .replace(/\s+/g, " ")
      .slice(start, start + 140)
      .trim();

    hits.push({
      path: c.path,
      title: c.title,
      type: c.type,
      score,
      snippet: snippet || String(c.meta.description ?? ""),
      tags: c.tags,
    });
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, 50);
}

export function catalogTree(concepts: Record<string, Concept>) {
  const dirs: Record<string, Concept[]> = {};
  for (const c of Object.values(concepts)) {
    const parts = c.path.split("/");
    const dir = parts.length > 1 ? parts[0]! : "(root)";
    (dirs[dir] ??= []).push(c);
  }
  for (const list of Object.values(dirs)) {
    list.sort((a, b) => a.path.localeCompare(b.path));
  }
  return dirs;
}

export function buildFromBundle(bundle: OkfBundle) {
  const concepts = loadConcepts(bundle.files);
  const inbound = buildInbound(concepts);
  const validation = validateBundle(concepts, bundle.files);
  return { concepts, inbound, validation };
}

export function toMermaid(
  nodes: GraphNode[],
  edges: GraphEdge[],
  title = "OKF graph",
): string {
  const id = (p: string) =>
    "n_" + p.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
  const lines = [`flowchart LR`, `  %% ${title}`];
  for (const n of nodes) {
    const label = `${n.title}\\n(${n.type})`;
    lines.push(`  ${id(n.id)}["${label.replace(/"/g, "'")}"]`);
  }
  for (const e of edges) {
    const style = e.rel === "links_to" ? "-->" : `-.->|${e.rel}|`;
    lines.push(`  ${id(e.from)} ${style} ${id(e.to)}`);
  }
  return lines.join("\n");
}
