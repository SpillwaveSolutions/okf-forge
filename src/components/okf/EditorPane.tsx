import { useEffect } from "react";
import { Bold, Code, Heading1, Heading2, List, ListOrdered, Save } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";
import { MarkdownPreview } from "./MarkdownPreview";
import { GraphCanvas } from "./GraphCanvas";

function wrapSelection(text: string, start: number, end: number, before: string, after: string) {
  const selected = text.slice(start, end) || "text";
  const next = text.slice(0, start) + before + selected + after + text.slice(end);
  return {
    next,
    cursor: start + before.length + selected.length + after.length,
  };
}

export function EditorPane() {
  const selectedPath = useOkfStore((s) => s.selectedPath);
  const editorDraft = useOkfStore((s) => s.editorDraft);
  const setEditorDraft = useOkfStore((s) => s.setEditorDraft);
  const saveEditor = useOkfStore((s) => s.saveEditor);
  const dirty = useOkfStore((s) => s.dirty);
  const editorMode = useOkfStore((s) => s.editorMode);
  const concepts = useOkfStore((s) => s.concepts);
  const graphData = useOkfStore((s) => s.graphData);
  const selectPath = useOkfStore((s) => s.selectPath);
  const runImpact = useOkfStore((s) => s.runImpact);
  const runPack = useOkfStore((s) => s.runPack);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEditor();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveEditor]);

  const concept = selectedPath ? concepts[selectedPath] : null;

  const applyWrap = (before: string, after: string) => {
    const ta = document.getElementById("okf-md-editor") as HTMLTextAreaElement | null;
    if (!ta) {
      setEditorDraft(before + after + editorDraft);
      return;
    }
    const { next } = wrapSelection(editorDraft, ta.selectionStart, ta.selectionEnd, before, after);
    setEditorDraft(next);
  };

  if (!selectedPath) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-lg font-semibold text-fg">No file selected</h2>
          <p className="text-sm text-fg-muted">
            Open an OKF repository and pick a concept from the sidebar — or start from the Learn
            tab.
          </p>
        </div>
      </div>
    );
  }

  const showMd = editorMode === "markdown" || editorMode === "split";
  const showPreview = editorMode === "wysiwyg" || editorMode === "split";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="editor-toolbar">
        <span className="text-xs text-fg-muted font-mono mr-2 truncate max-w-[40%]">
          {selectedPath}
          {dirty ? " · unsaved" : ""}
        </span>
        {concept && (
          <>
            <span className="badge badge-primary">{concept.type}</span>
            {concept.verified && <span className="badge badge-success">verified</span>}
          </>
        )}
        <div className="toolbar-divider" />
        <button
          type="button"
          className="toolbar-btn"
          title="Bold"
          onClick={() => applyWrap("**", "**")}
        >
          <Bold className="size-3.5" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Inline code"
          onClick={() => applyWrap("`", "`")}
        >
          <Code className="size-3.5" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Heading 1"
          onClick={() => applyWrap("\n# ", "\n")}
        >
          <Heading1 className="size-3.5" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Heading 2"
          onClick={() => applyWrap("\n## ", "\n")}
        >
          <Heading2 className="size-3.5" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Bullet list"
          onClick={() => applyWrap("\n- ", "\n")}
        >
          <List className="size-3.5" />
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Numbered list"
          onClick={() => applyWrap("\n1. ", "\n")}
        >
          <ListOrdered className="size-3.5" />
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          className="toolbar-btn"
          title="Impact analysis"
          onClick={() => runImpact(selectedPath)}
        >
          Impact
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Context pack"
          onClick={() => runPack(selectedPath)}
        >
          Pack
        </button>
        <button
          type="button"
          className="toolbar-btn ml-auto"
          onClick={() => saveEditor()}
          disabled={!dirty}
          title="Save"
        >
          <Save className="size-3.5" />
        </button>
      </div>

      <div
        className={`flex-1 min-h-0 grid ${
          editorMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {showMd && (
          <textarea
            id="okf-md-editor"
            className="w-full h-full min-h-[240px] resize-none border-0 border-r border-border bg-bg p-4 font-mono text-[13px] leading-relaxed text-fg outline-none focus:ring-0"
            value={editorDraft}
            onChange={(e) => setEditorDraft(e.target.value)}
            spellCheck={false}
            aria-label="Markdown editor"
          />
        )}
        {showPreview && (
          <div
            className="overflow-y-auto p-4 md:p-6 scrollbar-thin border-t lg:border-t-0 border-border"
            // Rendered markdown scrolls; links below the fold are expected.
            data-scroll
          >
            <MarkdownPreview source={editorDraft} />
            {graphData && graphData.root === selectedPath && (
              <div className="mt-8 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  Neighborhood graph
                </h3>
                <GraphCanvas
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  root={graphData.root}
                  onSelect={selectPath}
                  height={280}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
