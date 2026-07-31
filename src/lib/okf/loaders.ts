import type { OkfBundle } from "./types";

export async function loadBundledSample(): Promise<OkfBundle> {
  const res = await fetch("/sample-okf-bundle.json");
  if (!res.ok) throw new Error("Failed to load sample OKF bundle");
  const data = (await res.json()) as {
    name: string;
    source: string;
    files: Record<string, string>;
  };
  return {
    id: "sample-okf",
    name: data.name || "sample-okf",
    source: "bundled",
    sourceUrl: "https://github.com/SpillwaveSolutions/okf-plugin/tree/main/sample-okf",
    files: data.files,
    loadedAt: new Date().toISOString(),
  };
}

export async function loadPluginMeta(): Promise<{
  plugin: Record<string, unknown>;
  skills: Record<string, string>;
  agent: string;
}> {
  const res = await fetch("/okf-plugin-meta.json");
  if (!res.ok) throw new Error("Failed to load plugin meta");
  return res.json();
}

/** Parse owner/repo[/path] or full GitHub URL into parts. */
export function parseGithubInput(input: string): {
  owner: string;
  repo: string;
  branch: string;
  subpath: string;
} | null {
  const raw = input.trim().replace(/\.git$/, "");
  if (!raw) return null;

  let owner = "";
  let repo = "";
  let branch = "main";
  let subpath = "";

  const urlMatch = raw.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+)(?:\/(.*))?)?/,
  );
  if (urlMatch) {
    owner = urlMatch[1]!;
    repo = urlMatch[2]!;
    if (urlMatch[3]) branch = urlMatch[3];
    if (urlMatch[4]) subpath = urlMatch[4].replace(/\/$/, "");
  } else {
    const parts = raw.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    owner = parts[0]!;
    repo = parts[1]!;
    if (parts.length > 2) subpath = parts.slice(2).join("/");
  }

  return { owner, repo, branch, subpath };
}

async function fetchGithubTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<Array<{ path: string; type: string }>> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub tree fetch failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as {
    tree?: Array<{ path: string; type: string }>;
  };
  return data.tree ?? [];
}

async function fetchRaw(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.text();
}

/**
 * Load markdown files from a public GitHub repo (or subfolder) as an OKF bundle.
 * Prefers paths that look like OKF (index.md + knowledge/agents) when present.
 */
export async function loadGithubBundle(
  input: string,
  preferredSubpath?: string,
): Promise<OkfBundle> {
  const parsed = parseGithubInput(input);
  if (!parsed) throw new Error("Enter owner/repo or a GitHub URL");

  let { owner, repo, branch, subpath } = parsed;
  if (preferredSubpath) subpath = preferredSubpath.replace(/\/$/, "");

  const tree = await fetchGithubTree(owner, repo, branch);
  const mdFiles = tree.filter(
    (t) => t.type === "blob" && t.path.endsWith(".md") && !t.path.includes("node_modules"),
  );

  // Auto-detect sample-okf or .okf if no subpath given
  if (!subpath) {
    const hasSample = mdFiles.some((f) => f.path.startsWith("sample-okf/"));
    const hasOkf = mdFiles.some((f) => f.path.startsWith(".okf/"));
    if (hasSample && !mdFiles.some((f) => f.path === "index.md"))
      subpath = "sample-okf";
    else if (hasOkf) subpath = ".okf";
  }

  const prefix = subpath ? subpath + "/" : "";
  const selected = mdFiles.filter((f) =>
    subpath ? f.path.startsWith(prefix) : true,
  );

  // Cap for browser safety
  const limited = selected.slice(0, 200);
  if (!limited.length)
    throw new Error("No markdown files found in that path");

  const files: Record<string, string> = {};
  // Fetch in small batches
  const batchSize = 8;
  for (let i = 0; i < limited.length; i += batchSize) {
    const batch = limited.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (f) => {
        const content = await fetchRaw(owner, repo, branch, f.path);
        const rel = subpath ? f.path.slice(prefix.length) : f.path;
        if (rel) files[rel] = content;
      }),
    );
  }

  return {
    id: `gh-${owner}-${repo}-${Date.now()}`,
    name: subpath ? `${repo}/${subpath}` : repo,
    source: "github",
    sourceUrl: `https://github.com/${owner}/${repo}/tree/${branch}${subpath ? "/" + subpath : ""}`,
    files,
    loadedAt: new Date().toISOString(),
  };
}

export async function loadFilesFromUpload(
  fileList: FileList | File[],
): Promise<OkfBundle> {
  const files: Record<string, string> = {};
  const list = Array.from(fileList);
  for (const file of list) {
    if (!file.name.endsWith(".md") && file.type !== "text/markdown") continue;
    // webkitRelativePath for directory upload
    const rel =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name;
    const path = rel.replace(/^[^/]+\//, ""); // strip top folder name often
    const content = await file.text();
    files[path.includes("/") ? path : file.name] = content;
  }
  if (!Object.keys(files).length)
    throw new Error("No markdown files in upload");

  return {
    id: `upload-${Date.now()}`,
    name: "uploaded-bundle",
    source: "upload",
    files,
    loadedAt: new Date().toISOString(),
  };
}

export function emptyScaffoldBundle(name = "my-okf"): OkfBundle {
  const now = new Date().toISOString();
  const index = (title: string, desc: string, body: string) =>
    `---\ntitle: ${title}\ndescription: ${desc}\ntimestamp: ${now}\n---\n\n${body}\n`;

  const agent = `---
type: AgentNode
title: Research Agent
description: Example agent node for routing and progressive disclosure.
resource: agents/research-agent.md
tags: [agent, example]
timestamp: ${now}
status: active
verified: false
links:
  - target: /workflows/research-flow.md
    rel: implements
---

# Research Agent

## Overview

Example AgentNode. Replace with your harness roles.

## Responsibilities

- Explore knowledge nodes
- Request context packs before long runs
`;

  const workflow = `---
type: Workflow
title: Research Flow
description: Example workflow linking agents and knowledge.
tags: [workflow, example]
timestamp: ${now}
status: active
verified: false
links:
  - target: /agents/research-agent.md
    rel: uses
---

# Research Flow

1. Load progressive disclosure pack
2. Run agent
3. Author findings as knowledge concepts
`;

  return {
    id: `scaffold-${Date.now()}`,
    name,
    source: "local",
    files: {
      "index.md": `---
okf_version: "0.2"
title: ${name}
description: Graph-engineering OKF bundle scaffolded in OKF Workbench.
timestamp: ${now}
tags: [okf, scaffold]
---

# ${name}

Dual knowledge + agent/harness graph.

## Catalogs

- [Agents](/agents/index.md)
- [Workflows](/workflows/index.md)
- [Knowledge](/knowledge/index.md)
- [Decisions](/decisions/index.md)
- [Shared state](/shared/index.md)
- [Tickets](/tickets/index.md)
`,
      "log.md": index("Change log", "Structural changes", `# Log\n\n- ${now.slice(0, 10)} — Scaffolded bundle\n`),
      "agents/index.md": index("Agents", "AgentNode catalog", `# Agents\n\n- [Research Agent](/agents/research-agent.md)\n`),
      "agents/research-agent.md": agent,
      "workflows/index.md": index("Workflows", "Workflow catalog", `# Workflows\n\n- [Research Flow](/workflows/research-flow.md)\n`),
      "workflows/research-flow.md": workflow,
      "knowledge/index.md": index("Knowledge", "Knowledge catalog", `# Knowledge\n\n_Add concepts with the Author panel or Classify tool._\n`),
      "decisions/index.md": index("Decisions", "Decision records", `# Decisions\n\n`),
      "shared/index.md": index("Shared state", "Shared state catalog", `# Shared state\n\n`),
      "tickets/index.md": index("Tickets", "TicketLink catalog", `# Tickets\n\n`),
    },
    loadedAt: now,
  };
}
