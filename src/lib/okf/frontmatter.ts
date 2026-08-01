import { KNOWN_RELS, type TypedEdge } from "./types";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function parseFrontmatter(text: string): {
  meta: Record<string, unknown>;
  body: string;
} {
  const m = text.match(FRONTMATTER_RE);
  if (!m) return { meta: {}, body: text };

  const block = m[1] ?? "";
  const meta: Record<string, unknown> = {};
  const links: Array<Record<string, string>> = [];
  let inLinks = false;
  let current: Record<string, string> | null = null;

  for (const raw of block.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;

    if (/^links:\s*$/.test(stripped)) {
      inLinks = true;
      current = null;
      continue;
    }

    if (inLinks) {
      const item = stripped.match(/^-\s+(.*)$/);
      if (item) {
        if (current) links.push(current);
        current = {};
        const rest = item[1] ?? "";
        if (rest.includes(":") && !rest.startsWith("{")) {
          const [k, ...restParts] = rest.split(":");
          current[(k ?? "").trim()] = restParts
            .join(":")
            .trim()
            .replace(/^["']|["']$/g, "");
        }
        continue;
      }
      if (current && /^[A-Za-z0-9_]+:/.test(stripped) && !stripped.startsWith("-")) {
        if (line[0] === " " || line[0] === "\t") {
          const [k, ...restParts] = stripped.split(":");
          current[(k ?? "").trim()] = restParts
            .join(":")
            .trim()
            .replace(/^["']|["']$/g, "");
          continue;
        }
      }
      if (current) {
        links.push(current);
        current = null;
      }
      inLinks = false;
    }

    if (!stripped.includes(":")) continue;
    const colon = stripped.indexOf(":");
    const key = stripped.slice(0, colon).trim();
    const val = stripped
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (val.toLowerCase() === "true") meta[key] = true;
    else if (val.toLowerCase() === "false") meta[key] = false;
    else if (val.startsWith("[") && val.endsWith("]")) {
      const inner = val.slice(1, -1).trim();
      meta[key] = inner
        ? inner
            .split(",")
            .map((x) => x.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean)
        : [];
    } else meta[key] = val;
  }

  if (current) links.push(current);
  if (links.length) meta.links = links;

  const body = text.slice(m[0].length);
  return { meta, body };
}

export function serializeFrontmatter(meta: Record<string, unknown>, body: string): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    if (key === "links" && Array.isArray(value)) {
      lines.push("links:");
      for (const item of value as Array<Record<string, string>>) {
        const keys = Object.keys(item);
        if (keys.length === 0) continue;
        const first = keys[0]!;
        lines.push(`  - ${first}: ${item[first]}`);
        for (const k of keys.slice(1)) {
          lines.push(`    ${k}: ${item[k]}`);
        }
      }
      continue;
    }
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => String(v)).join(", ")}]`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (value === undefined || value === null) {
      continue;
    } else {
      const s = String(value);
      lines.push(s.includes(":") || s.includes("#") ? `${key}: "${s}"` : `${key}: ${s}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n") + body.replace(/^\n?/, "");
}

function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

function joinPath(base: string, rel: string): string {
  const parts = (base ? base.split("/") : []).concat(rel.split("/"));
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

export function normalizeTarget(
  target: string,
  sourcePath: string,
  fileSet: Set<string>,
): string | null {
  const t = target.split("#")[0]?.trim() ?? "";
  if (!t || t.startsWith("http") || t.startsWith("mailto:")) return null;

  let cand: string;
  if (t.startsWith("/")) cand = t.replace(/^\/+/, "");
  else cand = joinPath(dirname(sourcePath), t);

  cand = cand.replace(/\/+$/, "");

  if (fileSet.has(cand)) return cand;
  if (fileSet.has(cand + ".md")) return cand + ".md";
  if (fileSet.has(cand + "/index.md")) return cand + "/index.md";
  if (cand.endsWith(".md")) return cand;
  return null;
}

export function extractMarkdownLinks(
  text: string,
  sourcePath: string,
  fileSet: Set<string>,
): TypedEdge[] {
  const edges: TypedEdge[] = [];
  const seen = new Set<string>();
  LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = LINK_RE.exec(text))) {
    const relPath = normalizeTarget(m[2] ?? "", sourcePath, fileSet);
    if (!relPath) continue;
    const key = relPath + "|links_to";
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ target: relPath, rel: "links_to", source: "markdown" });
  }
  return edges;
}

export function extractFrontmatterLinks(
  meta: Record<string, unknown>,
  sourcePath: string,
  fileSet: Set<string>,
): TypedEdge[] {
  const edges: TypedEdge[] = [];
  const links = meta.links;
  if (!Array.isArray(links)) return edges;
  for (const item of links) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, string>;
    const target = rec.target || rec.to || rec.href || "";
    let rel = (rec.rel || rec.type || "related_to").trim();
    if (!KNOWN_RELS.has(rel)) rel = rel || "related_to";
    const relPath = normalizeTarget(String(target), sourcePath, fileSet);
    if (!relPath) continue;
    edges.push({ target: relPath, rel, source: "frontmatter" });
  }
  return edges;
}

export function mergeEdges(mdEdges: TypedEdge[], fmEdges: TypedEdge[]): TypedEdge[] {
  const byTarget = new Map<string, TypedEdge>();
  for (const e of mdEdges) byTarget.set(e.target, e);
  for (const e of fmEdges) {
    const prev = byTarget.get(e.target);
    if (!prev || prev.rel === "links_to" || e.source === "frontmatter") {
      byTarget.set(e.target, e);
    }
  }
  return [...byTarget.values()];
}

export function splitBodyAndFrontmatter(raw: string) {
  return parseFrontmatter(raw);
}
