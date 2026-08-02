import { create } from "zustand";
import {
  classifyDocuments,
  suggestionsToBundle,
  type ClassificationSuggestion,
  type SourceDoc,
} from "./classify";
import { buildFromBundle, impact, pack, searchConcepts, subgraph } from "./graph";
import {
  emptyScaffoldBundle,
  loadBundledSample,
  loadFilesFromUpload,
  loadGithubBundle,
  loadPluginMeta,
} from "./loaders";
import {
  buildClaudeSettingsSnippet,
  buildDeepAgentExport,
  buildPythonDeepAgentSnippet,
  defaultIntegrations,
  loadIntegrations,
  saveIntegrations,
  type ClaudePluginConfig,
  type DeepAgentSkillMapping,
  type IntegrationsState,
  type McpServerConfig,
} from "./integrations";
import type {
  AppView,
  Concept,
  GraphEdge,
  GraphNode,
  ImpactResult,
  OkfBundle,
  PackResult,
  SearchHit,
  ValidateResult,
} from "./types";
import { getStorage, isTauriRuntime } from "@/lib/platform/storage";

export type EditorViewMode = "wysiwyg" | "markdown" | "split";

interface OkfState {
  ready: boolean;
  loading: boolean;
  error: string | null;
  view: AppView;
  editorMode: EditorViewMode;
  bundle: OkfBundle | null;
  concepts: Record<string, Concept>;
  validation: ValidateResult | null;
  selectedPath: string | null;
  editorDraft: string;
  dirty: boolean;
  fileFilter: string;
  searchQuery: string;
  searchHits: SearchHit[];
  impactTarget: string;
  impactResult: ImpactResult | null;
  packResult: PackResult | null;
  packHops: number;
  packMaxNodes: number;
  graphFocus: string | null;
  graphHops: number;
  graphData: {
    root: string;
    hops: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
  } | null;
  classifyDocs: SourceDoc[];
  classifications: ClassificationSuggestion[];
  integrations: IntegrationsState;
  pluginSkills: Record<string, string>;
  pluginAgent: string;
  pluginInfo: Record<string, unknown> | null;
  learnStep: number;
  toast: string | null;
  openDialog: boolean;
  statusMessage: string | null;
  /** Absolute path of opened native/web workspace (when using FS storage). */
  workspaceRoot: string | null;
  /**
   * Optional on-disk prefix under workspaceRoot when the logical OKF root is
   * nested (e.g. `sample-okf/` or `.okf/`). Bundle paths are relative to the
   * logical root; FS reads/writes use prefix + path.
   */
  workspacePrefix: string;
  isDesktop: boolean;

  init: () => Promise<void>;
  setView: (v: AppView) => void;
  setEditorMode: (m: EditorViewMode) => void;
  selectPath: (path: string | null) => void;
  setEditorDraft: (text: string) => void;
  saveEditor: () => void;
  setFileFilter: (q: string) => void;
  setSearchQuery: (q: string) => void;
  runSearch: () => void;
  runImpact: (target?: string) => void;
  runPack: (target?: string) => void;
  runGraph: (target?: string) => void;
  setPackOpts: (hops: number, maxNodes: number) => void;
  setGraphHops: (hops: number) => void;
  loadSample: () => Promise<void>;
  loadGithub: (input: string) => Promise<void>;
  loadUpload: (files: FileList | File[]) => Promise<void>;
  /** Open folder (Tauri dialog or web OKF_WORKSPACE) and load as OKF bundle. */
  openWorkspaceFolder: () => Promise<void>;
  /** Load markdown from the fixed web workspace (Playwright /api/fs). */
  loadWebWorkspace: () => Promise<void>;
  scaffoldNew: (name?: string) => void;
  setClassifyDocs: (docs: SourceDoc[]) => void;
  runClassify: () => void;
  updateClassification: (id: string, patch: Partial<ClassificationSuggestion>) => void;
  applyClassifications: (name?: string) => void;
  setIntegrations: (patch: Partial<IntegrationsState>) => void;
  updatePlugin: (id: string, patch: Partial<ClaudePluginConfig>) => void;
  addPlugin: (p: ClaudePluginConfig) => void;
  removePlugin: (id: string) => void;
  updateMcp: (id: string, patch: Partial<McpServerConfig>) => void;
  addMcp: (m: McpServerConfig) => void;
  removeMcp: (id: string) => void;
  updateSkillMapping: (id: string, patch: Partial<DeepAgentSkillMapping>) => void;
  exportDeepAgentJson: () => string;
  exportDeepAgentPython: () => string;
  exportClaudeSettings: () => string;
  createConcept: (path: string, content: string) => void;
  deleteConcept: (path: string) => void;
  setLearnStep: (n: number) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  setOpenDialog: (open: boolean) => void;
}

function recompute(bundle: OkfBundle) {
  const { concepts, validation } = buildFromBundle(bundle);
  return { concepts, validation };
}

function pickDefaultPath(concepts: Record<string, Concept>): string | null {
  if ("agents/graph-engineer.md" in concepts) return "agents/graph-engineer.md";
  const nonIndex = Object.keys(concepts).find((p) => !p.endsWith("index.md") && p !== "log.md");
  return nonIndex ?? Object.keys(concepts)[0] ?? null;
}

/** Hard cap so opening a home/docs tree does not freeze the UI. */
export const MAX_WORKSPACE_MD_FILES = 400;

const SKIP_PATH_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  ".next",
  "coverage",
  ".cache",
  "vendor",
  "__pycache__",
]);

/** Allow `.okf` bundles; skip other hidden / junk segments. */
function shouldSkipPath(rel: string): boolean {
  const parts = rel.split(/[/\\]/).filter(Boolean);
  return parts.some((p) => {
    if (p === ".okf") return false;
    if (SKIP_PATH_SEGMENTS.has(p)) return true;
    if (p.startsWith(".") && p !== ".okf") return true;
    return false;
  });
}

/**
 * When the opened folder is not an OKF root, prefer a nested OKF subtree.
 * Returns relative keys for the bundle and the on-disk prefix to read from.
 */
function resolveWorkspaceSelection(allPaths: string[]): {
  /** Paths relative to the logical OKF root (bundle keys). */
  relative: string[];
  /** Prefix on disk under workspace root ("" | "sample-okf/" | ".okf/"). */
  diskPrefix: string;
  name: string;
} {
  const paths = allPaths
    .map((p) => p.replace(/^\/+/, "").replace(/\\/g, "/"))
    .filter((p) => p.endsWith(".md") && !shouldSkipPath(p))
    .sort();

  if (paths.includes("index.md")) {
    return { relative: paths, diskPrefix: "", name: "workspace" };
  }

  const sample = paths.filter((p) => p.startsWith("sample-okf/"));
  if (sample.length && sample.some((p) => p === "sample-okf/index.md")) {
    return {
      relative: sample.map((p) => p.slice("sample-okf/".length)).filter(Boolean),
      diskPrefix: "sample-okf/",
      name: "sample-okf",
    };
  }

  const okf = paths.filter((p) => p.startsWith(".okf/"));
  if (okf.length) {
    return {
      relative: okf.map((p) => p.slice(".okf/".length)).filter(Boolean),
      diskPrefix: ".okf/",
      name: ".okf",
    };
  }

  return { relative: paths, diskPrefix: "", name: "workspace" };
}

async function loadBundleFromStorage(rootLabel: string): Promise<{
  bundle: OkfBundle;
  truncated: number;
  skipped: number;
  diskPrefix: string;
}> {
  const storage = getStorage();
  const listed = await storage.listMarkdownFiles();
  if (!listed.length) {
    throw new Error("No markdown files in workspace");
  }

  const normalized = listed.map((p) => p.replace(/^\/+/, "").replace(/\\/g, "/"));
  const junkFree = normalized.filter((p) => !shouldSkipPath(p));
  const skipped = normalized.length - junkFree.length;
  const { relative, diskPrefix, name } = resolveWorkspaceSelection(junkFree);

  let selected = relative;
  let truncated = 0;
  if (selected.length > MAX_WORKSPACE_MD_FILES) {
    truncated = selected.length - MAX_WORKSPACE_MD_FILES;
    selected = selected.slice(0, MAX_WORKSPACE_MD_FILES);
  }

  if (!selected.length) {
    throw new Error("No markdown files left after filtering (or empty OKF root)");
  }

  const files: Record<string, string> = {};
  for (const rel of selected) {
    const content = await storage.readFile(diskPrefix + rel);
    files[rel] = content;
  }

  const folderName = rootLabel.split(/[/\\]/).pop() || "workspace";

  return {
    bundle: {
      id: `ws-${Date.now()}`,
      name: name === "workspace" ? folderName : name,
      source: "local",
      sourceUrl: rootLabel,
      files,
      loadedAt: new Date().toISOString(),
    },
    truncated,
    skipped: Math.max(0, skipped),
    diskPrefix,
  };
}

export const useOkfStore = create<OkfState>((set, get) => ({
  ready: false,
  loading: false,
  error: null,
  view: "learn",
  editorMode: "split",
  bundle: null,
  concepts: {},
  validation: null,
  selectedPath: null,
  editorDraft: "",
  dirty: false,
  fileFilter: "",
  searchQuery: "",
  searchHits: [],
  impactTarget: "agents/graph-engineer.md",
  impactResult: null,
  packResult: null,
  packHops: 2,
  packMaxNodes: 20,
  graphFocus: null,
  graphHops: 2,
  graphData: null,
  classifyDocs: [],
  classifications: [],
  integrations: defaultIntegrations(),
  pluginSkills: {},
  pluginAgent: "",
  pluginInfo: null,
  learnStep: 0,
  toast: null,
  openDialog: false,
  statusMessage: null,
  workspaceRoot: null,
  workspacePrefix: "",
  isDesktop: false,

  init: async () => {
    set({ loading: true, error: null, isDesktop: isTauriRuntime() });
    try {
      const integrations = loadIntegrations();
      let meta: Awaited<ReturnType<typeof loadPluginMeta>> | null = null;
      try {
        meta = await loadPluginMeta();
      } catch {
        meta = null;
      }
      const bundle = await loadBundledSample();
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      set({
        ready: true,
        loading: false,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        impactTarget: first ?? "",
        graphFocus: first,
        integrations,
        pluginSkills: meta?.skills ?? {},
        pluginAgent: meta?.agent ?? "",
        pluginInfo: meta?.plugin ?? null,
        statusMessage: `Loaded ${bundle.name} · ${Object.keys(concepts).length} concepts`,
      });
      if (first) get().runGraph(first);
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
        ready: true,
      });
    }
  },

  setView: (view) => set({ view }),
  setEditorMode: (editorMode) => set({ editorMode }),

  selectPath: (path) => {
    if (get().dirty) get().saveEditor();
    const { concepts } = get();
    set({
      selectedPath: path,
      editorDraft: path && concepts[path] ? concepts[path]!.raw : "",
      dirty: false,
      impactTarget: path ?? get().impactTarget,
      graphFocus: path,
      view: path ? "editor" : get().view,
    });
    if (path) get().runGraph(path);
  },

  setEditorDraft: (text) => set({ editorDraft: text, dirty: true }),

  saveEditor: () => {
    const { bundle, selectedPath, editorDraft, workspaceRoot } = get();
    if (!bundle || !selectedPath) return;
    const files = { ...bundle.files, [selectedPath]: editorDraft };
    const next = { ...bundle, files };
    const { concepts, validation } = recompute(next);
    set({
      bundle: next,
      concepts,
      validation,
      dirty: false,
      editorDraft,
      statusMessage: `Saved ${selectedPath}`,
    });
    get().showToast(`Saved ${selectedPath}`);
    if (get().graphFocus) get().runGraph(get().graphFocus!);

    // Persist to real FS when a workspace is open (desktop or web /api/fs)
    if (workspaceRoot) {
      const prefix = get().workspacePrefix;
      void getStorage()
        .writeFile(prefix + selectedPath, editorDraft)
        .catch((e) => {
          get().showToast(`Disk save failed: ${e instanceof Error ? e.message : String(e)}`);
        });
    }
  },

  setFileFilter: (q) => set({ fileFilter: q }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  runSearch: () => {
    const { concepts, searchQuery } = get();
    set({ searchHits: searchConcepts(concepts, searchQuery), view: "search" });
  },

  runImpact: (target) => {
    const t = target ?? get().impactTarget;
    const result = impact(get().concepts, t);
    if ("error" in result) {
      set({ impactResult: null, error: result.error });
      return;
    }
    set({
      impactResult: result,
      impactTarget: t,
      error: null,
      view: "search",
    });
  },

  runPack: (target) => {
    const t = target ?? get().impactTarget;
    const { packHops, packMaxNodes, concepts } = get();
    const result = pack(concepts, t, packHops, packMaxNodes, false);
    if ("error" in result) {
      set({ packResult: null, error: result.error });
      return;
    }
    set({ packResult: result, error: null, view: "search" });
  },

  runGraph: (target) => {
    const t = target ?? get().graphFocus ?? get().selectedPath ?? "";
    if (!t) return;
    const result = subgraph(get().concepts, t, get().graphHops);
    if ("error" in result) {
      set({ graphData: null });
      return;
    }
    set({ graphData: result, graphFocus: t });
  },

  setPackOpts: (hops, maxNodes) => set({ packHops: hops, packMaxNodes: maxNodes }),
  setGraphHops: (hops) => {
    set({ graphHops: hops });
    get().runGraph();
  },

  loadSample: async () => {
    set({
      loading: true,
      error: null,
      openDialog: false,
      workspaceRoot: null,
      workspacePrefix: "",
    });
    try {
      const bundle = await loadBundledSample();
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      set({
        loading: false,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        dirty: false,
        impactTarget: first ?? "",
        graphFocus: first,
        view: "explorer",
        statusMessage: `Loaded sample-okf · ${Object.keys(concepts).length} concepts`,
      });
      if (first) get().runGraph(first);
      get().showToast("Loaded sample-okf from okf-plugin");
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  loadGithub: async (input) => {
    set({
      loading: true,
      error: null,
      openDialog: false,
      workspaceRoot: null,
      workspacePrefix: "",
    });
    try {
      const bundle = await loadGithubBundle(input);
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      set({
        loading: false,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        dirty: false,
        impactTarget: first ?? "",
        graphFocus: first,
        view: "explorer",
        statusMessage: `Loaded ${bundle.name} · ${Object.keys(concepts).length} concepts`,
      });
      if (first) get().runGraph(first);
      get().showToast(`Loaded ${bundle.name} (${Object.keys(concepts).length} concepts)`);
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  loadUpload: async (files) => {
    set({
      loading: true,
      error: null,
      openDialog: false,
      workspaceRoot: null,
      workspacePrefix: "",
    });
    try {
      const bundle = await loadFilesFromUpload(files);
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      set({
        loading: false,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        dirty: false,
        view: "explorer",
      });
      get().showToast(`Uploaded ${Object.keys(concepts).length} files`);
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  openWorkspaceFolder: async () => {
    set({ loading: true, error: null, openDialog: false });
    try {
      const storage = getStorage();
      const root = await storage.openFolder();
      if (!root) {
        set({ loading: false });
        return;
      }
      const { bundle, truncated, skipped, diskPrefix } = await loadBundleFromStorage(root);
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      const n = Object.keys(concepts).length;
      const notes = [
        truncated ? `showing first ${n} of ${n + truncated}` : null,
        skipped ? `skipped ${skipped} junk paths` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      set({
        loading: false,
        workspaceRoot: root,
        workspacePrefix: diskPrefix,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        dirty: false,
        impactTarget: first ?? "",
        graphFocus: first,
        view: "explorer",
        statusMessage: `Opened ${root} · ${n} concepts${notes ? ` (${notes})` : ""}`,
      });
      if (first) get().runGraph(first);
      get().showToast(
        notes ? `Opened workspace · ${n} files (${notes})` : `Opened workspace (${n} files)`,
      );
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
      get().showToast(`Open failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  loadWebWorkspace: async () => {
    set({ loading: true, error: null, openDialog: false });
    try {
      const storage = getStorage();
      const root = await storage.getWorkspaceRoot();
      if (!root) throw new Error("No web workspace configured (OKF_WORKSPACE)");
      const { bundle, truncated, skipped, diskPrefix } = await loadBundleFromStorage(root);
      const { concepts, validation } = recompute(bundle);
      const first = pickDefaultPath(concepts);
      const n = Object.keys(concepts).length;
      const notes = [truncated ? `capped at ${n}` : null, skipped ? `skipped ${skipped}` : null]
        .filter(Boolean)
        .join(" · ");
      set({
        loading: false,
        workspaceRoot: root,
        workspacePrefix: diskPrefix,
        bundle,
        concepts,
        validation,
        selectedPath: first,
        editorDraft: first ? (concepts[first]?.raw ?? "") : "",
        dirty: false,
        impactTarget: first ?? "",
        graphFocus: first,
        view: "explorer",
        statusMessage: `Web workspace ${root}${notes ? ` · ${notes}` : ""}`,
      });
      if (first) get().runGraph(first);
      get().showToast(
        notes ? `Loaded web workspace · ${n} files (${notes})` : "Loaded web workspace via /api/fs",
      );
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
      get().showToast(`Load failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },

  scaffoldNew: (name) => {
    const bundle = emptyScaffoldBundle(name);
    const { concepts, validation } = recompute(bundle);
    const first = "agents/research-agent.md";
    set({
      bundle,
      concepts,
      validation,
      selectedPath: first,
      editorDraft: concepts[first]?.raw ?? "",
      dirty: false,
      view: "editor",
      impactTarget: first,
      graphFocus: first,
      openDialog: false,
      workspaceRoot: null,
      workspacePrefix: "",
    });
    get().runGraph(first);
    get().showToast("Scaffolded new OKF bundle");
  },

  setClassifyDocs: (docs) => set({ classifyDocs: docs }),

  runClassify: () => {
    const classifications = classifyDocuments(get().classifyDocs);
    set({ classifications });
    get().showToast(`Classified ${classifications.length} documents`);
  },

  updateClassification: (id, patch) => {
    set({
      classifications: get().classifications.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  },

  applyClassifications: (name) => {
    const bundle = suggestionsToBundle(name || "classified-okf", get().classifications);
    const { concepts, validation } = recompute(bundle);
    const first = pickDefaultPath(concepts);
    set({
      bundle,
      concepts,
      validation,
      selectedPath: first,
      editorDraft: first ? (concepts[first]?.raw ?? "") : "",
      dirty: false,
      view: "explorer",
      workspaceRoot: null,
      workspacePrefix: "",
    });
    get().showToast(`Created OKF repo with ${Object.keys(concepts).length} files`);
  },

  setIntegrations: (patch) => {
    const integrations = { ...get().integrations, ...patch };
    saveIntegrations(integrations);
    set({ integrations });
  },

  updatePlugin: (id, patch) => {
    const plugins = get().integrations.plugins.map((p) => (p.id === id ? { ...p, ...patch } : p));
    get().setIntegrations({ plugins });
  },

  addPlugin: (p) => {
    get().setIntegrations({
      plugins: [...get().integrations.plugins, p],
    });
  },

  removePlugin: (id) => {
    get().setIntegrations({
      plugins: get().integrations.plugins.filter((p) => p.id !== id),
    });
  },

  updateMcp: (id, patch) => {
    const mcps = get().integrations.mcps.map((m) => (m.id === id ? { ...m, ...patch } : m));
    get().setIntegrations({ mcps });
  },

  addMcp: (m) => {
    get().setIntegrations({ mcps: [...get().integrations.mcps, m] });
  },

  removeMcp: (id) => {
    get().setIntegrations({
      mcps: get().integrations.mcps.filter((m) => m.id !== id),
    });
  },

  updateSkillMapping: (id, patch) => {
    const skillMappings = get().integrations.skillMappings.map((s) =>
      s.skillId === id ? { ...s, ...patch } : s,
    );
    get().setIntegrations({ skillMappings });
  },

  exportDeepAgentJson: () => {
    const { integrations, bundle, pluginSkills } = get();
    return JSON.stringify(
      buildDeepAgentExport(integrations, bundle?.name ?? "okf-bundle", pluginSkills),
      null,
      2,
    );
  },

  exportDeepAgentPython: () => {
    const { integrations, bundle, pluginSkills } = get();
    const exp = buildDeepAgentExport(integrations, bundle?.name ?? "okf-bundle", pluginSkills);
    return buildPythonDeepAgentSnippet(exp);
  },

  exportClaudeSettings: () => buildClaudeSettingsSnippet(get().integrations),

  createConcept: (path, content) => {
    const { bundle, workspaceRoot } = get();
    if (!bundle) return;
    const files = { ...bundle.files, [path]: content };
    const next = { ...bundle, files };
    const { concepts, validation } = recompute(next);
    set({
      bundle: next,
      concepts,
      validation,
      selectedPath: path,
      editorDraft: content,
      dirty: false,
      view: "editor",
    });
    get().showToast(`Created ${path}`);
    if (workspaceRoot) {
      const prefix = get().workspacePrefix;
      void getStorage()
        .writeFile(prefix + path, content)
        .catch(() => {});
    }
  },

  deleteConcept: (path) => {
    const { bundle } = get();
    if (!bundle) return;
    const files = { ...bundle.files };
    delete files[path];
    const next = { ...bundle, files };
    const { concepts, validation } = recompute(next);
    const first = pickDefaultPath(concepts);
    set({
      bundle: next,
      concepts,
      validation,
      selectedPath: first,
      editorDraft: first ? (concepts[first]?.raw ?? "") : "",
      dirty: false,
    });
  },

  setLearnStep: (n) => set({ learnStep: n }),

  showToast: (msg) => {
    set({ toast: msg });
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (get().toast === msg) set({ toast: null });
      }, 2800);
    }
  },

  clearToast: () => set({ toast: null }),
  setOpenDialog: (open) => set({ openDialog: open }),
}));
