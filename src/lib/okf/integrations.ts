/** Claude plugins, MCP servers, and LangChain DeepAgents export models. */

export interface ClaudePluginConfig {
  id: string;
  name: string;
  source: string;
  version?: string;
  enabled: boolean;
  description?: string;
  kind: "claude-plugin" | "marketplace";
}

export interface McpServerConfig {
  id: string;
  name: string;
  transport: "stdio" | "sse" | "http";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  notes?: string;
}

export interface DeepAgentSkillMapping {
  skillId: string;
  okfSkill: string;
  description: string;
  enabled: boolean;
  asSubagent: boolean;
  tools: string[];
}

export interface DeepAgentExport {
  framework: "langchain-deepagents";
  version: "0.1";
  name: string;
  description: string;
  skills: Array<{
    name: string;
    description: string;
    instructions: string;
    tools: string[];
  }>;
  subagents: Array<{
    name: string;
    description: string;
    skills: string[];
    system_prompt: string;
  }>;
  mcp_servers: Array<{
    name: string;
    transport: string;
    command?: string;
    args?: string[];
    url?: string;
  }>;
  okf: {
    bundle: string;
    progressive_disclosure: { hops: number; max_nodes: number };
    prefer_deterministic: boolean;
  };
}

export const DEFAULT_OKF_SKILLS: DeepAgentSkillMapping[] = [
  {
    skillId: "okf-init-graph",
    okfSkill: "okf-init-graph",
    description: "Scaffold graph-eng OKF bundles",
    enabled: true,
    asSubagent: false,
    tools: ["okf_validate", "filesystem"],
  },
  {
    skillId: "okf-author",
    okfSkill: "okf-author",
    description: "Create/update OKF concepts with provenance",
    enabled: true,
    asSubagent: false,
    tools: ["okf_validate", "filesystem"],
  },
  {
    skillId: "okf-impact",
    okfSkill: "okf-impact",
    description: "Blast-radius / impact analysis",
    enabled: true,
    asSubagent: true,
    tools: ["okf_impact", "okf_edges", "okf_backlinks"],
  },
  {
    skillId: "okf-query",
    okfSkill: "okf-query",
    description: "Multi-hop query & progressive disclosure packs",
    enabled: true,
    asSubagent: true,
    tools: ["okf_pack", "okf_subgraph", "okf_search"],
  },
  {
    skillId: "okf-validate",
    okfSkill: "okf-validate",
    description: "Conformance + graph quality checks",
    enabled: true,
    asSubagent: false,
    tools: ["okf_validate", "okf_orphans"],
  },
  {
    skillId: "okf-maintain",
    okfSkill: "okf-maintain",
    description: "Indexes, drift, orphans, migration",
    enabled: true,
    asSubagent: false,
    tools: ["okf_validate", "okf_orphans", "filesystem"],
  },
  {
    skillId: "okf-visualize",
    okfSkill: "okf-visualize",
    description: "Mermaid / JSON graph views",
    enabled: true,
    asSubagent: false,
    tools: ["okf_subgraph", "okf_edges"],
  },
];

export const DEFAULT_PLUGINS: ClaudePluginConfig[] = [
  {
    id: "okf-graph-eng",
    name: "okf-graph-eng",
    source: "SpillwaveSolutions/okf-plugin",
    version: "0.2.0",
    enabled: true,
    description:
      "Graph engineering for OKF — impact, agent graphs, progressive disclosure",
    kind: "claude-plugin",
  },
];

export const DEFAULT_MCPS: McpServerConfig[] = [
  {
    id: "filesystem",
    name: "filesystem",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    enabled: false,
    notes: "Local filesystem access for agents",
  },
  {
    id: "github",
    name: "github",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
    enabled: false,
    notes: "GitHub issues/PRs via MCP",
  },
  {
    id: "okf-graph",
    name: "okf-graph",
    transport: "stdio",
    command: "python3",
    args: ["scripts/okf-graph-mcp.py"],
    enabled: false,
    notes: "Optional future OKF MCP (roadmap) — configure when available",
  },
];

const STORAGE_KEY = "okf-workbench-integrations-v1";

export interface IntegrationsState {
  plugins: ClaudePluginConfig[];
  mcps: McpServerConfig[];
  skillMappings: DeepAgentSkillMapping[];
  deepagentName: string;
  deepagentDescription: string;
  packHops: number;
  packMaxNodes: number;
}

export function defaultIntegrations(): IntegrationsState {
  return {
    plugins: DEFAULT_PLUGINS.map((p) => ({ ...p })),
    mcps: DEFAULT_MCPS.map((m) => ({ ...m, env: m.env ? { ...m.env } : undefined })),
    skillMappings: DEFAULT_OKF_SKILLS.map((s) => ({ ...s, tools: [...s.tools] })),
    deepagentName: "okf-graph-engineer",
    deepagentDescription:
      "LangChain DeepAgent wired with okf-graph-eng skills for impact analysis, progressive disclosure, and OKF curation",
    packHops: 2,
    packMaxNodes: 20,
  };
}

export function loadIntegrations(): IntegrationsState {
  if (typeof localStorage === "undefined") return defaultIntegrations();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultIntegrations();
    const parsed = JSON.parse(raw) as Partial<IntegrationsState>;
    const base = defaultIntegrations();
    return {
      ...base,
      ...parsed,
      plugins: parsed.plugins?.length ? parsed.plugins : base.plugins,
      mcps: parsed.mcps?.length ? parsed.mcps : base.mcps,
      skillMappings: parsed.skillMappings?.length
        ? parsed.skillMappings
        : base.skillMappings,
    };
  } catch {
    return defaultIntegrations();
  }
}

export function saveIntegrations(state: IntegrationsState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function buildDeepAgentExport(
  state: IntegrationsState,
  bundleName: string,
  skillBodies?: Record<string, string>,
): DeepAgentExport {
  const enabledSkills = state.skillMappings.filter((s) => s.enabled);
  const skills = enabledSkills.map((s) => ({
    name: s.skillId,
    description: s.description,
    instructions:
      skillBodies?.[s.okfSkill]?.slice(0, 4000) ||
      `Load and follow the ${s.okfSkill} skill from okf-graph-eng. Prefer deterministic okf-graph tools before free-form reasoning.`,
    tools: s.tools,
  }));

  const subagents = enabledSkills
    .filter((s) => s.asSubagent)
    .map((s) => ({
      name: s.skillId.replace(/^okf-/, "okf_"),
      description: s.description,
      skills: [s.skillId],
      system_prompt: `You are a specialist subagent for ${s.okfSkill}. Use progressive disclosure (hops=${state.packHops}, max_nodes=${state.packMaxNodes}). Prefer deterministic graph tools. Cite concept paths.`,
    }));

  // Always include graph-engineer orchestrator subagent when any skill enabled
  if (enabledSkills.length) {
    subagents.unshift({
      name: "graph_engineer",
      description:
        "Orchestrator for OKF dual-graph reasoning, impact, and curation",
      skills: enabledSkills.map((s) => s.skillId),
      system_prompt:
        "You are Graph Engineer. Treat the OKF repo as knowledge + agent/harness graph. Run impact before structural edits. Pack minimal context for long runs. Validate after writes.",
    });
  }

  return {
    framework: "langchain-deepagents",
    version: "0.1",
    name: state.deepagentName,
    description: state.deepagentDescription,
    skills,
    subagents,
    mcp_servers: state.mcps
      .filter((m) => m.enabled)
      .map((m) => ({
        name: m.name,
        transport: m.transport,
        command: m.command,
        args: m.args,
        url: m.url,
      })),
    okf: {
      bundle: bundleName,
      progressive_disclosure: {
        hops: state.packHops,
        max_nodes: state.packMaxNodes,
      },
      prefer_deterministic: true,
    },
  };
}

export function buildClaudeSettingsSnippet(state: IntegrationsState): string {
  const plugins = state.plugins
    .filter((p) => p.enabled)
    .map((p) => ({ name: p.name, source: p.source, version: p.version }));
  const mcpServers: Record<string, unknown> = {};
  for (const m of state.mcps.filter((x) => x.enabled)) {
    if (m.transport === "stdio") {
      mcpServers[m.name] = {
        command: m.command,
        args: m.args ?? [],
        env: m.env ?? {},
      };
    } else {
      mcpServers[m.name] = { url: m.url, transport: m.transport };
    }
  }
  return JSON.stringify(
    {
      plugins,
      mcpServers,
      note: "Illustrative export — merge into Claude Code / host config as appropriate",
    },
    null,
    2,
  );
}

export function buildPythonDeepAgentSnippet(exp: DeepAgentExport): string {
  return `"""LangChain DeepAgents + okf-graph-eng skills (generated by OKF Workbench)."""
# pip install langchain deepagents  # adjust to your environment

from deepagents import create_deep_agent  # illustrative API surface

OKF_SKILLS = ${JSON.stringify(
    exp.skills.map((s) => ({
      name: s.name,
      description: s.description,
      tools: s.tools,
    })),
    null,
    2,
  )}

SUBAGENTS = ${JSON.stringify(
    exp.subagents.map((s) => ({
      name: s.name,
      description: s.description,
      skills: s.skills,
    })),
    null,
    2,
  )}

MCP_SERVERS = ${JSON.stringify(exp.mcp_servers, null, 2)}

def build_agent(model, tools):
    """Wire OKF skills as DeepAgent skills/subagents.

    Map each skill's instructions to your host's skill loader
    (e.g. read SKILL.md from SpillwaveSolutions/okf-plugin).
    """
    return create_deep_agent(
        model=model,
        tools=tools,
        # skills=OKF_SKILLS,           # host-specific
        # subagents=SUBAGENTS,         # host-specific
        system_prompt=(
            "You are ${exp.name}. ${exp.description} "
            "Prefer deterministic OKF graph ops (impact, pack, validate) "
            "before free-form reasoning. Progressive disclosure: "
            "hops=${exp.okf.progressive_disclosure.hops}, "
            "max_nodes=${exp.okf.progressive_disclosure.max_nodes}."
        ),
    )
`;
}
