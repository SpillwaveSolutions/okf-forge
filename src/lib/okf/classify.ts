import { serializeFrontmatter } from "./frontmatter";
import { HARNESS_TYPES, KNOWLEDGE_TYPES, type OkfBundle } from "./types";

export interface SourceDoc {
  id: string;
  name: string;
  content: string;
}

export interface ClassificationSuggestion {
  id: string;
  sourceName: string;
  path: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  confidence: number;
  reasons: string[];
  body: string;
  links: Array<{ target: string; rel: string }>;
  accepted: boolean;
}

const TYPE_HINTS: Array<{
  type: string;
  dir: string;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    type: "AgentNode",
    dir: "agents",
    patterns: [
      /\bagent\b/i,
      /\bsubagent\b/i,
      /\broutes_to\b/i,
      /\bspecialist\b/i,
      /\bdeepagent\b/i,
    ],
    weight: 3,
  },
  {
    type: "Workflow",
    dir: "workflows",
    patterns: [/\bworkflow\b/i, /\bpipeline\b/i, /\bplaybook steps\b/i, /\bprocess\b/i],
    weight: 2.5,
  },
  {
    type: "Runbook",
    dir: "knowledge",
    patterns: [/\brunbook\b/i, /\bon[- ]call\b/i, /\bincident\b/i, /\bops\b/i],
    weight: 2.5,
  },
  {
    type: "Playbook",
    dir: "knowledge",
    patterns: [/\bplaybook\b/i, /\bhow to\b/i, /\bguide\b/i, /\btutorial\b/i],
    weight: 2,
  },
  {
    type: "API",
    dir: "knowledge",
    patterns: [/\bapi\b/i, /\bendpoint\b/i, /\bopenapi\b/i, /\bREST\b/, /\bgraphql\b/i],
    weight: 2.5,
  },
  {
    type: "Dataset",
    dir: "knowledge",
    patterns: [/\bdataset\b/i, /\btable schema\b/i, /\bwarehouse\b/i, /\bETL\b/],
    weight: 2,
  },
  {
    type: "Table",
    dir: "knowledge",
    patterns: [/\btable\b/i, /\bcolumn\b/i, /\bprimary key\b/i, /\bschema\b/i],
    weight: 2,
  },
  {
    type: "Metric",
    dir: "knowledge",
    patterns: [/\bmetric\b/i, /\bKPI\b/, /\bSLA\b/, /\bmeasure\b/i],
    weight: 2,
  },
  {
    type: "DecisionRecord",
    dir: "decisions",
    patterns: [/\bADR\b/, /\bdecision\b/i, /\bwe decided\b/i, /\brationale\b/i],
    weight: 2.5,
  },
  {
    type: "SharedState",
    dir: "shared",
    patterns: [/\bshared state\b/i, /\bsession\b/i, /\bcontext store\b/i, /\bmemory\b/i],
    weight: 2,
  },
  {
    type: "ToolCapability",
    dir: "knowledge",
    patterns: [/\btool\b/i, /\bMCP\b/, /\bCLI\b/, /\bcapability\b/i, /\bscript\b/i],
    weight: 2,
  },
  {
    type: "TicketLink",
    dir: "tickets",
    patterns: [/\bticket\b/i, /\bissue #\d+/i, /\bULID\b/, /\bworklog\b/i],
    weight: 2,
  },
  {
    type: "Reference",
    dir: "knowledge",
    patterns: [/\breference\b/i, /\bglossary\b/i, /\bconvention\b/i, /\bspec\b/i],
    weight: 1.5,
  },
];

function slugify(name: string): string {
  return (
    name
      .replace(/\.md$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "concept"
  );
}

function titleFromName(name: string, content: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1?.[1]) return h1[1].trim();
  return name
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function firstParagraph(content: string): string {
  const withoutFm = content.replace(/^---[\s\S]*?---\n?/, "");
  const lines = withoutFm
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("```"));
  return (lines[0] ?? "Imported document.").slice(0, 220);
}

export function classifyDocuments(docs: SourceDoc[]): ClassificationSuggestion[] {
  return docs.map((doc) => {
    const scores = new Map<string, { score: number; reasons: string[] }>();
    for (const hint of TYPE_HINTS) {
      let score = 0;
      const reasons: string[] = [];
      for (const p of hint.patterns) {
        if (p.test(doc.content) || p.test(doc.name)) {
          score += hint.weight;
          reasons.push(`Matched ${p.source}`);
        }
      }
      if (score > 0) {
        const prev = scores.get(hint.type);
        if (!prev || score > prev.score) scores.set(hint.type, { score, reasons });
      }
    }

    let bestType = "Reference";
    let bestDir = "knowledge";
    let bestScore = 0.5;
    let reasons = ["Defaulted to Reference"];
    for (const hint of TYPE_HINTS) {
      const s = scores.get(hint.type);
      if (s && s.score > bestScore) {
        bestScore = s.score;
        bestType = hint.type;
        bestDir = hint.dir;
        reasons = s.reasons.slice(0, 4);
      }
    }

    const confidence = Math.min(0.95, 0.35 + bestScore / 12);
    const title = titleFromName(doc.name, doc.content);
    const slug = slugify(doc.name);
    const path = `${bestDir}/${slug}.md`;
    const tags = extractTags(doc.content, bestType);
    const body =
      doc.content.replace(/^---[\s\S]*?---\n?/, "").trim() ||
      `# ${title}\n\n${firstParagraph(doc.content)}\n`;

    return {
      id: doc.id,
      sourceName: doc.name,
      path,
      type: bestType,
      title,
      description: firstParagraph(doc.content),
      tags,
      confidence,
      reasons,
      body,
      links: [],
      accepted: true,
    };
  });
}

function extractTags(content: string, type: string): string[] {
  const tags = new Set<string>([type.toLowerCase()]);
  const candidates = [
    "okf",
    "agent",
    "workflow",
    "api",
    "mcp",
    "claude",
    "langchain",
    "deepagent",
    "security",
    "ops",
    "data",
  ];
  const lower = content.toLowerCase();
  for (const c of candidates) {
    if (lower.includes(c)) tags.add(c);
  }
  return [...tags].slice(0, 6);
}

export function suggestionsToBundle(
  name: string,
  suggestions: ClassificationSuggestion[],
): OkfBundle {
  const accepted = suggestions.filter((s) => s.accepted);
  const files: Record<string, string> = {};
  const now = new Date().toISOString();

  const byDir: Record<string, ClassificationSuggestion[]> = {};
  for (const s of accepted) {
    const dir = s.path.split("/")[0] ?? "knowledge";
    (byDir[dir] ??= []).push(s);
  }

  for (const s of accepted) {
    const meta: Record<string, unknown> = {
      type: s.type,
      title: s.title,
      description: s.description,
      timestamp: now,
      status: "draft",
      verified: false,
      generated: true,
      tags: s.tags,
      sources: [s.sourceName],
    };
    if (s.links.length) meta.links = s.links;
    files[s.path] = serializeFrontmatter(
      meta,
      s.body.startsWith("#") ? s.body : `# ${s.title}\n\n${s.body}\n`,
    );
  }

  for (const [dir, items] of Object.entries(byDir)) {
    const lines = items.map((i) => `- [${i.title}](/${i.path}) — ${i.description.slice(0, 80)}`);
    files[`${dir}/index.md`] = serializeFrontmatter(
      {
        title: `${dir[0]!.toUpperCase()}${dir.slice(1)} catalog`,
        description: `Auto-generated catalog for ${dir}`,
        timestamp: now,
      },
      `# ${dir[0]!.toUpperCase()}${dir.slice(1)}\n\n${lines.join("\n")}\n`,
    );
  }

  files["index.md"] = serializeFrontmatter(
    {
      okf_version: "0.2",
      title: name,
      description: `OKF bundle classified from ${accepted.length} documents`,
      timestamp: now,
      tags: ["okf", "classified", "generated"],
    },
    `# ${name}\n\nAuto-classified OKF searchable repository.\n\n## Catalogs\n\n${Object.keys(byDir)
      .map((d) => `- [${d}](/${d}/index.md)`)
      .join("\n")}\n`,
  );

  files["log.md"] = serializeFrontmatter(
    {
      title: "Change log",
      timestamp: now,
    },
    `# Log\n\n- ${now.slice(0, 10)} — Classified ${accepted.length} documents into OKF concepts\n`,
  );

  return {
    id: `classified-${Date.now()}`,
    name,
    source: "classified",
    files,
    loadedAt: now,
  };
}

export const ALL_OKF_TYPES = [...KNOWLEDGE_TYPES, ...HARNESS_TYPES, "Index", "Unknown"] as const;
