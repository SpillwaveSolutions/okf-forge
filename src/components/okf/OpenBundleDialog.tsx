import { useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { FolderOpen, Github, Layers, Monitor, Upload, X } from "lucide-react";
import { useOkfStore } from "@/lib/okf/store";

export function OpenBundleDialog() {
  const open = useOkfStore((s) => s.openDialog);
  const setOpen = useOkfStore((s) => s.setOpenDialog);
  const loadSample = useOkfStore((s) => s.loadSample);
  const loadGithub = useOkfStore((s) => s.loadGithub);
  const loadUpload = useOkfStore((s) => s.loadUpload);
  const scaffoldNew = useOkfStore((s) => s.scaffoldNew);
  const openWorkspaceFolder = useOkfStore((s) => s.openWorkspaceFolder);
  const loadWebWorkspace = useOkfStore((s) => s.loadWebWorkspace);
  const loading = useOkfStore((s) => s.loading);
  const error = useOkfStore((s) => s.error);
  const isDesktop = useOkfStore((s) => s.isDesktop);

  const [github, setGithub] = useState("SpillwaveSolutions/okf-plugin/sample-okf");
  const [name, setName] = useState("my-okf");
  const fileRef = useRef<HTMLInputElement>(null);
  const dirRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Open OKF repository"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-bg-elevated shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">Open OKF repository</h2>
            <p className="text-xs text-fg-muted mt-0.5">
              {isDesktop
                ? "Desktop: native folder picker · also sample, GitHub, upload"
                : "Web: sample, GitHub, upload, or OKF_WORKSPACE via /api/fs"}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70dvh] overflow-y-auto">
          {error && (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="button"
            className="panel-card w-full text-left hover:border-primary/50 transition-colors"
            onClick={() => void openWorkspaceFolder()}
            disabled={loading}
            data-testid="open-workspace"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary-muted p-2 text-primary">
                <Monitor className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-fg">
                  {isDesktop ? "Open folder (native)" : "Open web workspace"}
                </div>
                <p className="text-xs text-fg-muted mt-1">
                  {isDesktop
                    ? "Native dialog + jailed filesystem (Tauri). Saves write to disk."
                    : "Uses OKF_WORKSPACE (default public/sample-okf) via /api/fs — Playwright-testable."}
                </p>
              </div>
            </div>
          </button>

          {!isDesktop && (
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={() => void loadWebWorkspace()}
              disabled={loading}
              data-testid="load-web-workspace"
            >
              Reload OKF_WORKSPACE
            </button>
          )}

          <button
            type="button"
            className="panel-card w-full text-left hover:border-primary/50 transition-colors"
            onClick={() => void loadSample()}
            disabled={loading}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary-muted p-2 text-primary">
                <Layers className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-fg">Sample: okf-plugin / sample-okf</div>
                <p className="text-xs text-fg-muted mt-1">
                  Bundled dual knowledge + agent graph (read-only in-memory until you save to a
                  folder)
                </p>
              </div>
            </div>
          </button>

          <div className="panel-card space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-fg">
              <Github className="size-4 text-fg-muted" />
              GitHub repo
            </div>
            <input
              className="field-input"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="owner/repo or owner/repo/path"
              aria-label="GitHub repository"
            />
            <button
              type="button"
              className="btn btn-secondary w-full"
              disabled={loading || !github.trim()}
              onClick={() => void loadGithub(github.trim())}
            >
              Load from GitHub
            </button>
          </div>

          <div className="panel-card space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-fg">
              <FolderOpen className="size-4 text-fg-muted" />
              Browser file pick
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dirRef.current?.click()}
                disabled={loading}
              >
                <Upload className="size-3.5" />
                Choose folder
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                Choose .md files
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".md,text/markdown"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void loadUpload(e.target.files);
              }}
            />
            <input
              ref={dirRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void loadUpload(e.target.files);
              }}
              {...({
                webkitdirectory: "",
                directory: "",
              } as InputHTMLAttributes<HTMLInputElement>)}
            />
          </div>

          <div className="panel-card space-y-2">
            <div className="text-sm font-medium text-fg">Scaffold empty OKF</div>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bundle name"
              aria-label="New bundle name"
            />
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => scaffoldNew(name.trim() || "my-okf")}
              disabled={loading}
            >
              Create scaffold
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
