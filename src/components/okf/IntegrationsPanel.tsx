import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";

export function IntegrationsPanel() {
  const integrations = useOkfStore((s) => s.integrations);
  const updatePlugin = useOkfStore((s) => s.updatePlugin);
  const addPlugin = useOkfStore((s) => s.addPlugin);
  const removePlugin = useOkfStore((s) => s.removePlugin);
  const updateMcp = useOkfStore((s) => s.updateMcp);
  const addMcp = useOkfStore((s) => s.addMcp);
  const removeMcp = useOkfStore((s) => s.removeMcp);
  const exportClaudeSettings = useOkfStore((s) => s.exportClaudeSettings);
  const showToast = useOkfStore((s) => s.showToast);
  const [tab, setTab] = useState<"plugins" | "mcp" | "export">("plugins");

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-fg">Plugins & MCP</h1>
          <p className="text-sm text-fg-muted mt-1">
            Configure Claude Code plugins (including okf-graph-eng) and MCP servers. Settings
            persist in this browser.
          </p>
        </div>

        <div className="view-toggle w-fit">
          {(
            [
              ["plugins", "Claude plugins"],
              ["mcp", "MCP servers"],
              ["export", "Export config"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`view-toggle-btn ${tab === id ? "active" : ""}`}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "plugins" && (
          <div className="space-y-3">
            {integrations.plugins.map((p) => (
              <div key={p.id} className="panel-card space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => updatePlugin(p.id, { enabled: e.target.checked })}
                    aria-label={`Enable ${p.name}`}
                  />
                  <input
                    className="field-input flex-1"
                    value={p.name}
                    onChange={(e) => updatePlugin(p.id, { name: e.target.value })}
                    aria-label="Plugin name"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removePlugin(p.id)}
                    aria-label={`Remove ${p.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {/* Real <label for> pairs rather than aria-label: the caption has
                    to be visible, and once it is, duplicating it in an attribute
                    is two places to keep in sync. The id is derived from the
                    record id so it stays unique across cards. */}
                <div>
                  <label className="field-label" htmlFor={`${p.id}-source`}>
                    Source
                  </label>
                  <input
                    id={`${p.id}-source`}
                    className="field-input font-mono text-xs"
                    value={p.source}
                    onChange={(e) => updatePlugin(p.id, { source: e.target.value })}
                    placeholder="owner/repo or local path"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor={`${p.id}-description`}>
                    Description
                  </label>
                  <input
                    id={`${p.id}-description`}
                    className="field-input"
                    value={p.description ?? ""}
                    onChange={(e) => updatePlugin(p.id, { description: e.target.value })}
                    placeholder="What this plugin adds"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                addPlugin({
                  id: `plugin-${Date.now()}`,
                  name: "new-plugin",
                  source: "owner/repo",
                  enabled: true,
                  kind: "claude-plugin",
                })
              }
            >
              <Plus className="size-3.5" />
              Add plugin
            </button>
          </div>
        )}

        {tab === "mcp" && (
          <div className="space-y-3">
            {integrations.mcps.map((m) => (
              <div key={m.id} className="panel-card space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => updateMcp(m.id, { enabled: e.target.checked })}
                    aria-label={`Enable ${m.name}`}
                  />
                  <input
                    className="field-input flex-1"
                    value={m.name}
                    onChange={(e) => updateMcp(m.id, { name: e.target.value })}
                    aria-label="MCP server name"
                  />
                  <select
                    className="field-input w-28"
                    value={m.transport}
                    onChange={(e) =>
                      updateMcp(m.id, {
                        transport: e.target.value as "stdio" | "sse" | "http",
                      })
                    }
                    aria-label={`${m.name} transport`}
                  >
                    <option value="stdio">stdio</option>
                    <option value="sse">sse</option>
                    <option value="http">http</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeMcp(m.id)}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {m.transport === "stdio" ? (
                  <>
                    <div>
                      <label className="field-label" htmlFor={`${m.id}-command`}>
                        Command
                      </label>
                      <input
                        id={`${m.id}-command`}
                        className="field-input font-mono text-xs"
                        value={m.command ?? ""}
                        onChange={(e) => updateMcp(m.id, { command: e.target.value })}
                        placeholder="npx"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`${m.id}-args`}>
                        Arguments
                      </label>
                      <input
                        id={`${m.id}-args`}
                        className="field-input font-mono text-xs"
                        value={(m.args ?? []).join(" ")}
                        onChange={(e) =>
                          updateMcp(m.id, {
                            args: e.target.value.split(/\s+/).filter(Boolean),
                          })
                        }
                        placeholder="-y some-mcp-server"
                      />
                      {/* The split/join round-trip is lossy: an argument
                          containing a space cannot survive it. Stated here so
                          the next reader does not treat it as a bug. */}
                      <p className="field-hint">Separated by spaces.</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="field-label" htmlFor={`${m.id}-url`}>
                      URL
                    </label>
                    <input
                      id={`${m.id}-url`}
                      className="field-input font-mono text-xs"
                      value={m.url ?? ""}
                      onChange={(e) => updateMcp(m.id, { url: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                )}
                {/* Italic so it does not read as another .field-hint — this
                    describes the server, not the field above it. */}
                {m.notes && <p className="field-note">{m.notes}</p>}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                addMcp({
                  id: `mcp-${Date.now()}`,
                  name: "custom-mcp",
                  transport: "stdio",
                  command: "npx",
                  args: ["-y", "package"],
                  enabled: false,
                })
              }
            >
              <Plus className="size-3.5" />
              Add MCP server
            </button>
          </div>
        )}

        {tab === "export" && (
          <div className="panel-card space-y-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportClaudeSettings());
                  showToast("Config copied");
                } catch {
                  showToast("Copy failed");
                }
              }}
            >
              <Copy className="size-3.5" />
              Copy settings JSON
            </button>
            <pre className="text-[0.6875rem] font-mono overflow-auto max-h-[420px] p-3 rounded-md bg-bg border border-border text-fg-muted">
              {exportClaudeSettings()}
            </pre>
            <p className="text-[0.6875rem] text-fg-subtle">
              Illustrative merge target for Claude Code / host MCP config — adapt keys to your host
              schema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
