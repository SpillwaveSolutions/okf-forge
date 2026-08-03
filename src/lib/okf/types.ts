export type OkfRel =
  | "depends_on"
  | "routes_to"
  | "implements"
  | "documents"
  | "uses"
  | "owns"
  | "supersedes"
  | "related_to"
  | "tracks"
  | "maps_to"
  | "links_to"
  | string;

export type Criticality = "critical" | "high" | "medium" | "low";

export interface TypedEdge {
  target: string;
  rel: OkfRel;
  source: "markdown" | "frontmatter";
}

export interface Concept {
  path: string;
  title: string;
  type: string;
  status: string;
  verified: boolean;
  tags: string[];
  meta: Record<string, unknown>;
  body: string;
  raw: string;
  outbound: string[];
  edges: TypedEdge[];
}

export interface BundleFile {
  path: string;
  content: string;
}

export interface OkfBundle {
  id: string;
  name: string;
  source: "bundled" | "github" | "upload" | "classified" | "local";
  sourceUrl?: string;
  files: Record<string, string>;
  loadedAt: string;
}

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  verified: boolean;
  status: string;
  criticality: Criticality;
  depth?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  rel: string;
  source?: string;
}

export interface ImpactResult {
  target: GraphNode;
  inbound: GraphNode[];
  outbound: GraphNode[];
  direct_edges: {
    inbound: Array<{ from: string; rel: string; source: string }>;
    outbound: Array<{ to: string; rel: string; source: string }>;
  };
  suggested_order: string[];
  stats: {
    inbound_count: number;
    outbound_count: number;
    total_concepts: number;
    typed_edge_count: number;
  };
}

export interface PackResult {
  root: string;
  hops: number;
  max_nodes: number;
  mode: "outbound" | "undirected";
  nodes: GraphNode[];
  edges: GraphEdge[];
  read_order: string[];
  markdown: string;
  excluded: string[];
}

export interface ValidateIssue {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
  path?: string;
}

export interface ValidateResult {
  concept_count: number;
  edge_count: number;
  issues: ValidateIssue[];
  error_count: number;
  warn_count: number;
}

export interface SearchHit {
  path: string;
  title: string;
  type: string;
  score: number;
  snippet: string;
  tags: string[];
}

export const KNOWLEDGE_TYPES = [
  "Dataset",
  "Table",
  "Metric",
  "Playbook",
  "Runbook",
  "API",
  "Reference",
] as const;

export const HARNESS_TYPES = [
  "AgentNode",
  "Workflow",
  "Harness",
  "DecisionRecord",
  "SharedState",
  "ToolCapability",
  "TicketLink",
] as const;

export const HIGH_IMPACT_TYPES = new Set(["AgentNode", "Workflow", "Harness", "SharedState"]);

export const MEDIUM_IMPACT_TYPES = new Set(["Dataset", "Table", "Metric", "API", "ToolCapability"]);

export const KNOWN_RELS = new Set([
  "depends_on",
  "routes_to",
  "implements",
  "documents",
  "uses",
  "owns",
  "supersedes",
  "related_to",
  "tracks",
  "maps_to",
]);

export type AppView =
  | "learn"
  | "explorer"
  | "editor"
  | "search"
  | "classify"
  | "deepagent"
  | "integrations"
  | "settings";
