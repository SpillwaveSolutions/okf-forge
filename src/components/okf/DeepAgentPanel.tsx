import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";

export function DeepAgentPanel() {
  const integrations = useOkfStore((s) => s.integrations);
  const updateSkillMapping = useOkfStore((s) => s.updateSkillMapping);
  const setIntegrations = useOkfStore((s) => s.setIntegrations);
  const exportDeepAgentJson = useOkfStore((s) => s.exportDeepAgentJson);
  const exportDeepAgentPython = useOkfStore((s) => s.exportDeepAgentPython);
  const pluginSkills = useOkfStore((s) => s.pluginSkills);
  const showToast = useOkfStore((s) => s.showToast);
  const [tab, setTab] = useState<"map" | "json" | "python">("map");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Copy failed — select and copy manually");
    }
  };

  const download = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-fg">
            LangChain DeepAgents
          </h1>
          <p className="text-sm text-fg-muted mt-1">
            Install{" "}
            <code className="text-primary">okf-graph-eng</code> skills as
            DeepAgent skills and specialist subagents. Export JSON config or
            Python scaffolding for your harness.
          </p>
        </div>

        <div className="panel-card grid sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Agent name</label>
            <input
              className="field-input"
              value={integrations.deepagentName}
              onChange={(e) =>
                setIntegrations({ deepagentName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="field-label">Pack hops / max nodes</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="field-input"
                value={integrations.packHops}
                onChange={(e) =>
                  setIntegrations({ packHops: Number(e.target.value) || 2 })
                }
              />
              <input
                type="number"
                className="field-input"
                value={integrations.packMaxNodes}
                onChange={(e) =>
                  setIntegrations({
                    packMaxNodes: Number(e.target.value) || 20,
                  })
                }
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Description</label>
            <textarea
              className="field-textarea min-h-[72px]"
              value={integrations.deepagentDescription}
              onChange={(e) =>
                setIntegrations({ deepagentDescription: e.target.value })
              }
            />
          </div>
        </div>

        <div className="view-toggle w-fit">
          {(
            [
              ["map", "Skill map"],
              ["json", "JSON export"],
              ["python", "Python"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`view-toggle-btn ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "map" && (
          <div className="space-y-2">
            {integrations.skillMappings.map((s) => (
              <div key={s.skillId} className="panel-card">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-fg">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) =>
                        updateSkillMapping(s.skillId, {
                          enabled: e.target.checked,
                        })
                      }
                    />
                    {s.skillId}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <input
                      type="checkbox"
                      checked={s.asSubagent}
                      onChange={(e) =>
                        updateSkillMapping(s.skillId, {
                          asSubagent: e.target.checked,
                        })
                      }
                    />
                    Subagent
                  </label>
                  {pluginSkills[s.okfSkill] && (
                    <span className="badge badge-success">SKILL.md loaded</span>
                  )}
                </div>
                <p className="text-xs text-fg-muted mt-1">{s.description}</p>
                <p className="text-[11px] text-fg-subtle mt-1 font-mono">
                  tools: {s.tools.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "json" && (
          <div className="panel-card space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void copy(exportDeepAgentJson())}
              >
                <Copy className="size-3.5" />
                Copy
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  download("okf-deepagent.json", exportDeepAgentJson())
                }
              >
                <Download className="size-3.5" />
                Download
              </button>
            </div>
            <pre className="text-[11px] font-mono overflow-auto max-h-[480px] p-3 rounded-md bg-bg border border-border text-fg-muted">
              {exportDeepAgentJson()}
            </pre>
          </div>
        )}

        {tab === "python" && (
          <div className="panel-card space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void copy(exportDeepAgentPython())}
              >
                <Copy className="size-3.5" />
                Copy
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  download("okf_deepagent.py", exportDeepAgentPython())
                }
              >
                <Download className="size-3.5" />
                Download
              </button>
            </div>
            <pre className="text-[11px] font-mono overflow-auto max-h-[480px] p-3 rounded-md bg-bg border border-border text-fg-muted whitespace-pre-wrap">
              {exportDeepAgentPython()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
