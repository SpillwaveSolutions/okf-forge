import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import { ALL_OKF_TYPES } from "@/lib/okf/classify";

export function ClassifyPanel() {
  const classifyDocs = useOkfStore((s) => s.classifyDocs);
  const setClassifyDocs = useOkfStore((s) => s.setClassifyDocs);
  const classifications = useOkfStore((s) => s.classifications);
  const runClassify = useOkfStore((s) => s.runClassify);
  const updateClassification = useOkfStore((s) => s.updateClassification);
  const applyClassifications = useOkfStore((s) => s.applyClassifications);
  const [paste, setPaste] = useState("");
  const [bundleName, setBundleName] = useState("classified-okf");
  const fileRef = useRef<HTMLInputElement>(null);

  const addPaste = () => {
    if (!paste.trim()) return;
    const id = `paste-${Date.now()}`;
    setClassifyDocs([
      ...classifyDocs,
      {
        id,
        name: `pasted-${classifyDocs.length + 1}.md`,
        content: paste,
      },
    ]);
    setPaste("");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-fg">Classify into OKF</h1>
          <p className="text-sm text-fg-muted mt-1">
            Drop a pile of documents — we suggest types, paths, tags, and frontmatter, then build a
            searchable OKF bundle (okf-author style).
          </p>
          <p className="text-xs text-fg-subtle mt-2 rounded-md border border-border bg-bg-subtle px-3 py-2">
            <strong className="text-fg-muted">Safe by default:</strong> Classify only works on files
            you upload or paste here. It does <strong className="text-fg-muted">not</strong> scan or
            rewrite your open workspace on disk. Applying results creates a new in-memory bundle;
            nothing is written until you explicitly Save to a workspace.
          </p>
        </div>

        <div className="panel-card space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Upload markdown
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files) return;
                const docs = [];
                for (const f of Array.from(files)) {
                  docs.push({
                    id: `${f.name}-${f.lastModified}`,
                    name: f.name,
                    content: await f.text(),
                  });
                }
                setClassifyDocs([...classifyDocs, ...docs]);
              }}
            />
            <span className="text-xs text-fg-muted self-center">
              {classifyDocs.length} document
              {classifyDocs.length === 1 ? "" : "s"} staged
            </span>
          </div>
          <label className="field-label">Or paste markdown</label>
          <textarea
            className="field-textarea min-h-[120px]"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="# Incident runbook&#10;&#10;When the API errors..."
          />
          <button type="button" className="btn btn-secondary" onClick={addPaste}>
            Add pasted doc
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!classifyDocs.length}
            onClick={runClassify}
          >
            Classify documents
          </button>
        </div>

        {classifications.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[160px]">
                <label className="field-label">Bundle name</label>
                <input
                  className="field-input"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => applyClassifications(bundleName)}
              >
                Create OKF repo
              </button>
            </div>

            {classifications.map((c) => (
              <div key={c.id} className="panel-card space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      checked={c.accepted}
                      onChange={(e) =>
                        updateClassification(c.id, {
                          accepted: e.target.checked,
                        })
                      }
                    />
                    <span className="font-medium">{c.sourceName}</span>
                  </label>
                  <span className="badge badge-primary">
                    {Math.round(c.confidence * 100)}% conf
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <div>
                    <label className="field-label">Type</label>
                    <select
                      className="field-input"
                      value={c.type}
                      onChange={(e) => updateClassification(c.id, { type: e.target.value })}
                    >
                      {ALL_OKF_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Path</label>
                    <input
                      className="field-input font-mono text-xs"
                      value={c.path}
                      onChange={(e) => updateClassification(c.id, { path: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Title</label>
                    <input
                      className="field-input"
                      value={c.title}
                      onChange={(e) => updateClassification(c.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Tags</label>
                    <input
                      className="field-input"
                      value={c.tags.join(", ")}
                      onChange={(e) =>
                        updateClassification(c.id, {
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-fg-muted">{c.description}</p>
                <p className="text-[11px] text-fg-subtle">Reasons: {c.reasons.join(" · ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
