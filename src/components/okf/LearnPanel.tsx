import { ArrowRight, BookOpen, CheckCircle2, Network, Sparkles, Bot } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";

const STEPS = [
  {
    title: "What is OKF?",
    body: "OKF (Open Knowledge Format) is Git-native Markdown + YAML. Each concept file is a node; absolute Markdown links are edges. You get a portable knowledge graph without a proprietary database.",
  },
  {
    title: "Dual graph",
    body: "okf-graph-eng treats the same repo as (1) a knowledge graph — datasets, APIs, runbooks — and (2) an agent/harness graph — AgentNode, Workflow, SharedState, DecisionRecord.",
  },
  {
    title: "Frontmatter & types",
    body: "Every concept needs type, title, description, timestamp. Knowledge types: Dataset, Table, Metric, Playbook, Runbook, API, Reference. Harness: AgentNode, Workflow, Harness, DecisionRecord, SharedState, ToolCapability, TicketLink.",
  },
  {
    title: "Typed edges",
    body: "Prefer absolute links like [Graph Engineer](/agents/graph-engineer.md). Optional frontmatter links: rel routes_to, depends_on, uses, implements, tracks…",
  },
  {
    title: "Impact analysis",
    body: "Before structural edits, run impact on a concept. You get inbound/outbound blast radius, criticality by type + verified flag, and a suggested update order.",
  },
  {
    title: "Progressive disclosure",
    body: "Pack a 2-hop subgraph (default max ~20 nodes) so long-running agents get minimal context instead of the whole tree. This is the core of okf-query.",
  },
  {
    title: "Skills in okf-plugin",
    body: "okf-init-graph, okf-author, okf-impact, okf-query, okf-validate, okf-maintain, okf-visualize — portable SKILL.md files for Claude Code and Grok Build.",
  },
  {
    title: "DeepAgents + MCP",
    body: "Map those skills into LangChain DeepAgents (skills + subagents), enable Claude plugins, and configure MCP servers from the Integrations tab. Export JSON or Python scaffolding.",
  },
];

export function LearnPanel() {
  const step = useOkfStore((s) => s.learnStep);
  const setLearnStep = useOkfStore((s) => s.setLearnStep);
  const setView = useOkfStore((s) => s.setView);
  const selectPath = useOkfStore((s) => s.selectPath);
  const runImpact = useOkfStore((s) => s.runImpact);
  const runPack = useOkfStore((s) => s.runPack);
  const concepts = useOkfStore((s) => s.concepts);
  const validation = useOkfStore((s) => s.validation);
  const pluginInfo = useOkfStore((s) => s.pluginInfo);

  const current = STEPS[step] ?? STEPS[0]!;
  const sampleAgent = "agents/graph-engineer.md";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            Learning path
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-fg">
            Learn OKF by using it
          </h1>
          <p className="mt-2 text-sm text-fg-muted max-w-2xl">
            A Motion-style writing surface, upgraded for{" "}
            <a
              href="https://github.com/SpillwaveSolutions/okf-plugin"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              okf-graph-eng
            </a>
            : edit Markdown, search the graph, classify docs into a searchable repo, and wire skills
            into DeepAgents.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              icon: BookOpen,
              label: "Concepts",
              value: String(Object.keys(concepts).length),
            },
            {
              icon: CheckCircle2,
              label: "Validation",
              value: validation
                ? validation.error_count
                  ? `${validation.error_count} errors`
                  : "Healthy"
                : "—",
            },
            {
              icon: Network,
              label: "Plugin",
              value: String(pluginInfo?.name ?? "okf-graph-eng"),
            },
          ].map((s) => (
            <div key={s.label} className="panel-card">
              <div className="flex items-center gap-2 text-fg-muted text-xs mb-1">
                <s.icon className="size-3.5" />
                {s.label}
              </div>
              <div className="text-lg font-semibold text-fg truncate">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="panel-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">
              Step {step + 1} of {STEPS.length}: {current.title}
            </h2>
            <span className="badge">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">{current.body}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step === 0}
              onClick={() => setLearnStep(Math.max(0, step - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setLearnStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step >= STEPS.length - 1}
            >
              Next
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            className="panel-card text-left hover:border-primary/40 transition-colors"
            onClick={() => {
              selectPath(sampleAgent);
              setView("editor");
            }}
          >
            <FileCue icon={BookOpen} title="Open Graph Engineer" />
            <p className="text-xs text-fg-muted mt-2">
              Inspect a real AgentNode from sample-okf with typed edges.
            </p>
          </button>
          <button
            type="button"
            className="panel-card text-left hover:border-primary/40 transition-colors"
            onClick={() => {
              runImpact(sampleAgent);
              setView("search");
            }}
          >
            <FileCue icon={Network} title="Run impact analysis" />
            <p className="text-xs text-fg-muted mt-2">
              See blast radius for the specialist agent before edits.
            </p>
          </button>
          <button
            type="button"
            className="panel-card text-left hover:border-primary/40 transition-colors"
            onClick={() => {
              runPack(sampleAgent);
              setView("search");
            }}
          >
            <FileCue icon={Sparkles} title="Build a context pack" />
            <p className="text-xs text-fg-muted mt-2">
              Progressive disclosure: 2-hop pack for agent runs.
            </p>
          </button>
          <button
            type="button"
            className="panel-card text-left hover:border-primary/40 transition-colors"
            onClick={() => setView("deepagent")}
          >
            <FileCue icon={Bot} title="Wire DeepAgents" />
            <p className="text-xs text-fg-muted mt-2">
              Install okf skills as LangChain DeepAgent skills/subagents.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function FileCue({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-fg">
      <Icon className="size-4 text-primary" />
      {title}
    </div>
  );
}
