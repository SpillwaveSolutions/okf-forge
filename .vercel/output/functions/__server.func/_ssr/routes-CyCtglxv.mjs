import { r as __toESM } from "../_runtime.mjs";
import { M as require_react, h as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { C as Code, D as Bold, E as BookOpen, O as ArrowRight, S as Copy, T as Bot, _ as GitBranch, a as Settings2, b as FileText, c as Plug, d as List, f as ListOrdered, g as Github, h as Heading1, i as Sparkles, l as Plus, m as Heading2, n as Upload, o as Search, p as Layers, r as Trash2, s as Save, t as X, u as Network, v as FolderTree, w as CircleCheck, x as Download, y as FolderOpen } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CyCtglxv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KNOWLEDGE_TYPES = [
	"Dataset",
	"Table",
	"Metric",
	"Playbook",
	"Runbook",
	"API",
	"Reference"
];
var HARNESS_TYPES = [
	"AgentNode",
	"Workflow",
	"Harness",
	"DecisionRecord",
	"SharedState",
	"ToolCapability",
	"TicketLink"
];
var HIGH_IMPACT_TYPES = /* @__PURE__ */ new Set([
	"AgentNode",
	"Workflow",
	"Harness",
	"SharedState"
]);
var MEDIUM_IMPACT_TYPES = /* @__PURE__ */ new Set([
	"Dataset",
	"Table",
	"Metric",
	"API",
	"ToolCapability"
]);
var KNOWN_RELS = /* @__PURE__ */ new Set([
	"depends_on",
	"routes_to",
	"implements",
	"documents",
	"uses",
	"owns",
	"supersedes",
	"related_to",
	"tracks",
	"maps_to"
]);
var FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
var LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
function parseFrontmatter(text) {
	const m = text.match(FRONTMATTER_RE);
	if (!m) return {
		meta: {},
		body: text
	};
	const block = m[1] ?? "";
	const meta = {};
	const links = [];
	let inLinks = false;
	let current = null;
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
					current[(k ?? "").trim()] = restParts.join(":").trim().replace(/^["']|["']$/g, "");
				}
				continue;
			}
			if (current && /^[A-Za-z0-9_]+:/.test(stripped) && !stripped.startsWith("-")) {
				if (line[0] === " " || line[0] === "	") {
					const [k, ...restParts] = stripped.split(":");
					current[(k ?? "").trim()] = restParts.join(":").trim().replace(/^["']|["']$/g, "");
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
		let val = stripped.slice(colon + 1).trim().replace(/^["']|["']$/g, "");
		if (val.toLowerCase() === "true") meta[key] = true;
		else if (val.toLowerCase() === "false") meta[key] = false;
		else if (val.startsWith("[") && val.endsWith("]")) {
			const inner = val.slice(1, -1).trim();
			meta[key] = inner ? inner.split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
		} else meta[key] = val;
	}
	if (current) links.push(current);
	if (links.length) meta.links = links;
	return {
		meta,
		body: text.slice(m[0].length)
	};
}
function serializeFrontmatter(meta, body) {
	const lines = ["---"];
	for (const [key, value] of Object.entries(meta)) {
		if (key === "links" && Array.isArray(value)) {
			lines.push("links:");
			for (const item of value) {
				const keys = Object.keys(item);
				if (keys.length === 0) continue;
				const first = keys[0];
				lines.push(`  - ${first}: ${item[first]}`);
				for (const k of keys.slice(1)) lines.push(`    ${k}: ${item[k]}`);
			}
			continue;
		}
		if (Array.isArray(value)) lines.push(`${key}: [${value.map((v) => String(v)).join(", ")}]`);
		else if (typeof value === "boolean") lines.push(`${key}: ${value}`);
		else if (value === void 0 || value === null) continue;
		else {
			const s = String(value);
			lines.push(s.includes(":") || s.includes("#") ? `${key}: "${s}"` : `${key}: ${s}`);
		}
	}
	lines.push("---", "");
	return lines.join("\n") + body.replace(/^\n?/, "");
}
function dirname(path) {
	const i = path.lastIndexOf("/");
	return i === -1 ? "" : path.slice(0, i);
}
function joinPath(base, rel) {
	const parts = (base ? base.split("/") : []).concat(rel.split("/"));
	const out = [];
	for (const p of parts) {
		if (!p || p === ".") continue;
		if (p === "..") out.pop();
		else out.push(p);
	}
	return out.join("/");
}
function normalizeTarget(target, sourcePath, fileSet) {
	let t = target.split("#")[0]?.trim() ?? "";
	if (!t || t.startsWith("http") || t.startsWith("mailto:")) return null;
	let cand;
	if (t.startsWith("/")) cand = t.replace(/^\/+/, "");
	else cand = joinPath(dirname(sourcePath), t);
	cand = cand.replace(/\/+$/, "");
	if (fileSet.has(cand)) return cand;
	if (fileSet.has(cand + ".md")) return cand + ".md";
	if (fileSet.has(cand + "/index.md")) return cand + "/index.md";
	if (cand.endsWith(".md")) return cand;
	return null;
}
function extractMarkdownLinks(text, sourcePath, fileSet) {
	const edges = [];
	const seen = /* @__PURE__ */ new Set();
	LINK_RE.lastIndex = 0;
	let m;
	while (m = LINK_RE.exec(text)) {
		const relPath = normalizeTarget(m[2] ?? "", sourcePath, fileSet);
		if (!relPath) continue;
		const key = relPath + "|links_to";
		if (seen.has(key)) continue;
		seen.add(key);
		edges.push({
			target: relPath,
			rel: "links_to",
			source: "markdown"
		});
	}
	return edges;
}
function extractFrontmatterLinks(meta, sourcePath, fileSet) {
	const edges = [];
	const links = meta.links;
	if (!Array.isArray(links)) return edges;
	for (const item of links) {
		if (!item || typeof item !== "object") continue;
		const rec = item;
		const target = rec.target || rec.to || rec.href || "";
		let rel = (rec.rel || rec.type || "related_to").trim();
		if (!KNOWN_RELS.has(rel)) rel = rel || "related_to";
		const relPath = normalizeTarget(String(target), sourcePath, fileSet);
		if (!relPath) continue;
		edges.push({
			target: relPath,
			rel,
			source: "frontmatter"
		});
	}
	return edges;
}
function mergeEdges(mdEdges, fmEdges) {
	const byTarget = /* @__PURE__ */ new Map();
	for (const e of mdEdges) byTarget.set(e.target, e);
	for (const e of fmEdges) {
		const prev = byTarget.get(e.target);
		if (!prev || prev.rel === "links_to" || e.source === "frontmatter") byTarget.set(e.target, e);
	}
	return [...byTarget.values()];
}
var TYPE_HINTS = [
	{
		type: "AgentNode",
		dir: "agents",
		patterns: [
			/\bagent\b/i,
			/\bsubagent\b/i,
			/\broutes_to\b/i,
			/\bspecialist\b/i,
			/\bdeepagent\b/i
		],
		weight: 3
	},
	{
		type: "Workflow",
		dir: "workflows",
		patterns: [
			/\bworkflow\b/i,
			/\bpipeline\b/i,
			/\bplaybook steps\b/i,
			/\bprocess\b/i
		],
		weight: 2.5
	},
	{
		type: "Runbook",
		dir: "knowledge",
		patterns: [
			/\brunbook\b/i,
			/\bon[- ]call\b/i,
			/\bincident\b/i,
			/\bops\b/i
		],
		weight: 2.5
	},
	{
		type: "Playbook",
		dir: "knowledge",
		patterns: [
			/\bplaybook\b/i,
			/\bhow to\b/i,
			/\bguide\b/i,
			/\btutorial\b/i
		],
		weight: 2
	},
	{
		type: "API",
		dir: "knowledge",
		patterns: [
			/\bapi\b/i,
			/\bendpoint\b/i,
			/\bopenapi\b/i,
			/\bREST\b/,
			/\bgraphql\b/i
		],
		weight: 2.5
	},
	{
		type: "Dataset",
		dir: "knowledge",
		patterns: [
			/\bdataset\b/i,
			/\btable schema\b/i,
			/\bwarehouse\b/i,
			/\bETL\b/
		],
		weight: 2
	},
	{
		type: "Table",
		dir: "knowledge",
		patterns: [
			/\btable\b/i,
			/\bcolumn\b/i,
			/\bprimary key\b/i,
			/\bschema\b/i
		],
		weight: 2
	},
	{
		type: "Metric",
		dir: "knowledge",
		patterns: [
			/\bmetric\b/i,
			/\bKPI\b/,
			/\bSLA\b/,
			/\bmeasure\b/i
		],
		weight: 2
	},
	{
		type: "DecisionRecord",
		dir: "decisions",
		patterns: [
			/\bADR\b/,
			/\bdecision\b/i,
			/\bwe decided\b/i,
			/\brationale\b/i
		],
		weight: 2.5
	},
	{
		type: "SharedState",
		dir: "shared",
		patterns: [
			/\bshared state\b/i,
			/\bsession\b/i,
			/\bcontext store\b/i,
			/\bmemory\b/i
		],
		weight: 2
	},
	{
		type: "ToolCapability",
		dir: "knowledge",
		patterns: [
			/\btool\b/i,
			/\bMCP\b/,
			/\bCLI\b/,
			/\bcapability\b/i,
			/\bscript\b/i
		],
		weight: 2
	},
	{
		type: "TicketLink",
		dir: "tickets",
		patterns: [
			/\bticket\b/i,
			/\bissue #\d+/i,
			/\bULID\b/,
			/\bworklog\b/i
		],
		weight: 2
	},
	{
		type: "Reference",
		dir: "knowledge",
		patterns: [
			/\breference\b/i,
			/\bglossary\b/i,
			/\bconvention\b/i,
			/\bspec\b/i
		],
		weight: 1.5
	}
];
function slugify(name) {
	return name.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "concept";
}
function titleFromName(name, content) {
	const h1 = content.match(/^#\s+(.+)$/m);
	if (h1?.[1]) return h1[1].trim();
	return name.replace(/\.md$/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function firstParagraph(content) {
	return (content.replace(/^---[\s\S]*?---\n?/, "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("```"))[0] ?? "Imported document.").slice(0, 220);
}
function classifyDocuments(docs) {
	return docs.map((doc) => {
		const scores = /* @__PURE__ */ new Map();
		for (const hint of TYPE_HINTS) {
			let score = 0;
			const reasons = [];
			for (const p of hint.patterns) if (p.test(doc.content) || p.test(doc.name)) {
				score += hint.weight;
				reasons.push(`Matched ${p.source}`);
			}
			if (score > 0) {
				const prev = scores.get(hint.type);
				if (!prev || score > prev.score) scores.set(hint.type, {
					score,
					reasons
				});
			}
		}
		let bestType = "Reference";
		let bestDir = "knowledge";
		let bestScore = .5;
		let reasons = ["Defaulted to Reference"];
		for (const hint of TYPE_HINTS) {
			const s = scores.get(hint.type);
			if (s && s.score > bestScore) {
				bestScore = s.score;
				bestType = hint.type;
				bestDir = hint.dir;
				reasons = s.reasons.slice(0, 4);
			}
		}
		const confidence = Math.min(.95, .35 + bestScore / 12);
		const title = titleFromName(doc.name, doc.content);
		const slug = slugify(doc.name);
		const path = `${bestDir}/${slug}.md`;
		const tags = extractTags(doc.content, bestType);
		const body = doc.content.replace(/^---[\s\S]*?---\n?/, "").trim() || `# ${title}\n\n${firstParagraph(doc.content)}\n`;
		return {
			id: doc.id,
			sourceName: doc.name,
			path,
			type: bestType,
			title,
			description: firstParagraph(doc.content),
			tags,
			confidence,
			reasons,
			body,
			links: [],
			accepted: true
		};
	});
}
function extractTags(content, type) {
	const tags = /* @__PURE__ */ new Set([type.toLowerCase()]);
	const candidates = [
		"okf",
		"agent",
		"workflow",
		"api",
		"mcp",
		"claude",
		"langchain",
		"deepagent",
		"security",
		"ops",
		"data"
	];
	const lower = content.toLowerCase();
	for (const c of candidates) if (lower.includes(c)) tags.add(c);
	return [...tags].slice(0, 6);
}
function suggestionsToBundle(name, suggestions) {
	const accepted = suggestions.filter((s) => s.accepted);
	const files = {};
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const byDir = {};
	for (const s of accepted) {
		const dir = s.path.split("/")[0] ?? "knowledge";
		(byDir[dir] ??= []).push(s);
	}
	for (const s of accepted) {
		const meta = {
			type: s.type,
			title: s.title,
			description: s.description,
			timestamp: now,
			status: "draft",
			verified: false,
			generated: true,
			tags: s.tags,
			sources: [s.sourceName]
		};
		if (s.links.length) meta.links = s.links;
		files[s.path] = serializeFrontmatter(meta, s.body.startsWith("#") ? s.body : `# ${s.title}\n\n${s.body}\n`);
	}
	for (const [dir, items] of Object.entries(byDir)) {
		const lines = items.map((i) => `- [${i.title}](/${i.path}) — ${i.description.slice(0, 80)}`);
		files[`${dir}/index.md`] = serializeFrontmatter({
			title: `${dir[0].toUpperCase()}${dir.slice(1)} catalog`,
			description: `Auto-generated catalog for ${dir}`,
			timestamp: now
		}, `# ${dir[0].toUpperCase()}${dir.slice(1)}\n\n${lines.join("\n")}\n`);
	}
	files["index.md"] = serializeFrontmatter({
		okf_version: "0.2",
		title: name,
		description: `OKF bundle classified from ${accepted.length} documents`,
		timestamp: now,
		tags: [
			"okf",
			"classified",
			"generated"
		]
	}, `# ${name}\n\nAuto-classified OKF searchable repository.\n\n## Catalogs\n\n${Object.keys(byDir).map((d) => `- [${d}](/${d}/index.md)`).join("\n")}\n`);
	files["log.md"] = serializeFrontmatter({
		title: "Change log",
		timestamp: now
	}, `# Log\n\n- ${now.slice(0, 10)} — Classified ${accepted.length} documents into OKF concepts\n`);
	return {
		id: `classified-${Date.now()}`,
		name,
		source: "classified",
		files,
		loadedAt: now
	};
}
var ALL_OKF_TYPES = [
	...KNOWLEDGE_TYPES,
	...HARNESS_TYPES,
	"Index",
	"Unknown"
];
function loadConcepts(files) {
	const fileSet = new Set(Object.keys(files));
	const concepts = {};
	for (const path of Object.keys(files).sort()) {
		if (!path.endsWith(".md") || path.split("/").pop()?.startsWith(".")) continue;
		const raw = files[path] ?? "";
		const { meta, body } = parseFrontmatter(raw);
		const edges = mergeEdges(extractMarkdownLinks(raw, path, fileSet), extractFrontmatterLinks(meta, path, fileSet));
		const tags = Array.isArray(meta.tags) ? meta.tags.map(String) : [];
		concepts[path] = {
			path,
			title: String(meta.title || path.split("/").pop()?.replace(/\.md$/, "") || path),
			type: String(meta.type || (path.endsWith("index.md") ? "Index" : "Unknown")),
			status: String(meta.status || ""),
			verified: Boolean(meta.verified),
			tags,
			meta,
			body,
			raw,
			outbound: edges.map((e) => e.target),
			edges
		};
	}
	for (const c of Object.values(concepts)) c.outbound = c.outbound.filter((t) => t in concepts);
	return concepts;
}
function buildInbound(concepts) {
	const inbound = {};
	for (const [rel, c] of Object.entries(concepts)) for (const tgt of c.outbound) {
		if (!(tgt in concepts)) continue;
		(inbound[tgt] ??= []).push(rel);
	}
	return inbound;
}
function resolveConcept(concepts, query) {
	const q = query.trim().replace(/^\/+/, "");
	if (q in concepts) return q;
	const qLower = q.toLowerCase();
	for (const [rel, c] of Object.entries(concepts)) {
		if ((rel.split("/").pop()?.replace(/\.md$/, "") ?? "").toLowerCase() === qLower || c.title.toLowerCase() === qLower) return rel;
		if (rel.endsWith(q) || rel.endsWith(q + ".md")) return rel;
	}
	return null;
}
function bfsClosure(start, edges, hops = null) {
	const seen = /* @__PURE__ */ new Set([start]);
	const q = [[start, 0]];
	const out = [];
	while (q.length) {
		const [node, depth] = q.shift();
		if (node !== start) out.push({
			id: node,
			depth
		});
		if (hops !== null && depth >= hops) continue;
		for (const nxt of edges[node] ?? []) if (!seen.has(nxt)) {
			seen.add(nxt);
			q.push([nxt, depth + 1]);
		}
	}
	return out;
}
function criticalityOf(c) {
	let criticality = "low";
	if (HIGH_IMPACT_TYPES.has(c.type)) criticality = "high";
	else if (MEDIUM_IMPACT_TYPES.has(c.type)) criticality = "medium";
	if (!c.verified && criticality !== "low") criticality = criticality === "high" ? "critical" : criticality;
	return criticality;
}
function enrichNodes(concepts, items) {
	const order = {
		critical: 0,
		high: 1,
		medium: 2,
		low: 3
	};
	const result = [];
	for (const item of items) {
		const c = concepts[item.id];
		if (!c) continue;
		result.push({
			id: item.id,
			depth: item.depth,
			title: c.title,
			type: c.type,
			status: c.status,
			verified: c.verified,
			criticality: criticalityOf(c)
		});
	}
	result.sort((a, b) => (order[a.criticality] ?? 9) - (order[b.criticality] ?? 9) || (a.depth ?? 0) - (b.depth ?? 0) || a.title.localeCompare(b.title));
	return result;
}
function toNode(c, depth) {
	return {
		id: c.path,
		title: c.title,
		type: c.type,
		status: c.status,
		verified: c.verified,
		criticality: criticalityOf(c),
		depth
	};
}
function impact(concepts, conceptQuery) {
	const inboundMap = buildInbound(concepts);
	const outboundMap = {};
	for (const [k, v] of Object.entries(concepts)) outboundMap[k] = v.outbound;
	const target = resolveConcept(concepts, conceptQuery);
	if (!target || !concepts[target]) return { error: `concept not found: ${conceptQuery}` };
	const c = concepts[target];
	const inbound = enrichNodes(concepts, bfsClosure(target, inboundMap));
	const outbound = enrichNodes(concepts, bfsClosure(target, outboundMap));
	const direct_out = c.edges.filter((e) => e.target in concepts).map((e) => ({
		to: e.target,
		rel: e.rel,
		source: e.source
	}));
	const direct_in = [];
	for (const [rel, concept] of Object.entries(concepts)) for (const e of concept.edges) if (e.target === target) direct_in.push({
		from: rel,
		rel: e.rel,
		source: e.source
	});
	return {
		target: toNode(c),
		inbound,
		outbound,
		direct_edges: {
			inbound: direct_in,
			outbound: direct_out
		},
		suggested_order: inbound.map((x) => x.id),
		stats: {
			inbound_count: inbound.length,
			outbound_count: outbound.length,
			total_concepts: Object.keys(concepts).length,
			typed_edge_count: c.edges.filter((e) => e.rel !== "links_to").length
		}
	};
}
function pack(concepts, conceptQuery, hops = 2, maxNodes = 20, undirected = false) {
	const target = resolveConcept(concepts, conceptQuery);
	if (!target || !concepts[target]) return { error: `concept not found: ${conceptQuery}` };
	const outboundMap = {};
	for (const [k, v] of Object.entries(concepts)) outboundMap[k] = v.outbound.filter((o) => o in concepts);
	let graph;
	if (undirected) {
		const g = {};
		for (const [k, outs] of Object.entries(outboundMap)) for (const o of outs) {
			(g[k] ??= []).push(o);
			(g[o] ??= []).push(k);
		}
		graph = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [...new Set(v)].sort()]));
	} else graph = outboundMap;
	const neighborhood = [target, ...bfsClosure(target, graph, hops).map((x) => x.id).filter((id) => id in concepts)];
	const scoreNums = (nid) => {
		const c = concepts[nid];
		if (!c) return [
			9,
			9,
			9
		];
		return [
			nid === target ? 0 : 1,
			c.verified ? 0 : 1,
			HIGH_IMPACT_TYPES.has(c.type) ? 0 : 1
		];
	};
	const ranked = [...new Set(neighborhood)].filter((n) => n in concepts).sort((a, b) => {
		const sa = scoreNums(a);
		const sb = scoreNums(b);
		for (let i = 0; i < 3; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
		return (concepts[a]?.title ?? a).localeCompare(concepts[b]?.title ?? b);
	});
	const included = ranked.slice(0, Math.max(1, maxNodes));
	const excluded = ranked.filter((n) => !included.includes(n));
	const nodeSet = new Set(included);
	const edges = [];
	for (const n of included) for (const e of concepts[n].edges) if (nodeSet.has(e.target)) edges.push({
		from: n,
		to: e.target,
		rel: e.rel,
		source: e.source
	});
	const read_order = [...included].sort((a, b) => {
		const ca = concepts[a];
		const cb = concepts[b];
		return (a === target ? 0 : 1) - (b === target ? 0 : 1) || (HIGH_IMPACT_TYPES.has(ca.type) ? 0 : 1) - (HIGH_IMPACT_TYPES.has(cb.type) ? 0 : 1) || (ca.type === "SharedState" ? 0 : 1) - (cb.type === "SharedState" ? 0 : 1) || ca.title.localeCompare(cb.title);
	});
	const lines = [
		`# Context pack: ${concepts[target].title}`,
		``,
		`Root: \`${target}\` · hops=${hops} · mode=${undirected ? "undirected" : "outbound"} · nodes=${included.length}`,
		``
	];
	for (const n of read_order) {
		const c = concepts[n];
		lines.push(`## ${c.title}`);
		lines.push(``);
		lines.push(`- path: \`${n}\``);
		lines.push(`- type: \`${c.type}\``);
		lines.push(`- verified: ${c.verified}`);
		if (c.tags.length) lines.push(`- tags: ${c.tags.join(", ")}`);
		lines.push(``);
		const excerpt = c.body.trim().split("\n").slice(0, 12).join("\n");
		if (excerpt) {
			lines.push(excerpt);
			lines.push(``);
		}
	}
	return {
		root: target,
		hops,
		max_nodes: maxNodes,
		mode: undirected ? "undirected" : "outbound",
		nodes: included.map((id) => toNode(concepts[id])),
		edges,
		read_order,
		markdown: lines.join("\n"),
		excluded
	};
}
function subgraph(concepts, conceptQuery, hops = 2) {
	const target = resolveConcept(concepts, conceptQuery);
	if (!target || !concepts[target]) return { error: `concept not found: ${conceptQuery}` };
	const inboundMap = buildInbound(concepts);
	const undirected = {};
	for (const [k, c] of Object.entries(concepts)) for (const o of c.outbound) {
		(undirected[k] ??= []).push(o);
		(undirected[o] ??= []).push(k);
	}
	for (const [k, ins] of Object.entries(inboundMap)) for (const i of ins) {
		(undirected[k] ??= []).push(i);
		(undirected[i] ??= []).push(k);
	}
	const nodes = [target, ...bfsClosure(target, Object.fromEntries(Object.entries(undirected).map(([k, v]) => [k, [...new Set(v)].sort()])), hops).map((x) => x.id)].filter((n, i, a) => a.indexOf(n) === i && n in concepts);
	const nodeSet = new Set(nodes);
	const edges = [];
	for (const n of nodes) for (const e of concepts[n].edges) if (nodeSet.has(e.target)) edges.push({
		from: n,
		to: e.target,
		rel: e.rel,
		source: e.source
	});
	return {
		root: target,
		hops,
		nodes: nodes.map((id) => toNode(concepts[id])),
		edges
	};
}
function validateBundle(concepts, files) {
	const issues = [];
	const paths = Object.keys(files);
	if (!("index.md" in files)) issues.push({
		severity: "error",
		code: "missing_root_index",
		message: "Root index.md is missing"
	});
	else {
		const { meta } = parseFrontmatter(files["index.md"]);
		if (!meta.okf_version) issues.push({
			severity: "warn",
			code: "missing_okf_version",
			message: "Root index.md should declare okf_version: \"0.2\"",
			path: "index.md"
		});
	}
	if (!("log.md" in files)) issues.push({
		severity: "warn",
		code: "missing_log",
		message: "log.md is missing (recommended for change history)"
	});
	let edgeCount = 0;
	const inbound = buildInbound(concepts);
	for (const [path, c] of Object.entries(concepts)) {
		edgeCount += c.edges.length;
		if (!path.endsWith("index.md") && path !== "log.md" && (!c.meta.type || c.type === "Unknown")) issues.push({
			severity: "warn",
			code: "missing_type",
			message: "Concept missing frontmatter type",
			path
		});
		if (!c.meta.title && !path.endsWith("index.md") && path !== "log.md") issues.push({
			severity: "warn",
			code: "missing_title",
			message: "Concept missing title",
			path
		});
		for (const e of c.edges) if (!(e.target in concepts) && !paths.includes(e.target)) issues.push({
			severity: "error",
			code: "broken_link",
			message: `Broken link to ${e.target}`,
			path
		});
		if (HIGH_IMPACT_TYPES.has(c.type) && !c.verified && !path.endsWith("index.md")) issues.push({
			severity: "warn",
			code: "unverified_high_impact",
			message: `High-impact ${c.type} is not verified`,
			path
		});
		const ins = inbound[path] ?? [];
		if (!path.endsWith("index.md") && path !== "log.md" && ins.length === 0 && c.outbound.length === 0) issues.push({
			severity: "info",
			code: "orphan",
			message: "Orphan concept (no inbound or outbound edges)",
			path
		});
	}
	return {
		concept_count: Object.keys(concepts).length,
		edge_count: edgeCount,
		issues,
		error_count: issues.filter((i) => i.severity === "error").length,
		warn_count: issues.filter((i) => i.severity === "warn").length
	};
}
function searchConcepts(concepts, query) {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	const terms = q.split(/\s+/).filter(Boolean);
	const hits = [];
	for (const c of Object.values(concepts)) {
		const hay = [
			c.path,
			c.title,
			c.type,
			c.tags.join(" "),
			c.body,
			String(c.meta.description ?? "")
		].join("\n").toLowerCase();
		let score = 0;
		for (const t of terms) {
			if (c.title.toLowerCase().includes(t)) score += 8;
			if (c.path.toLowerCase().includes(t)) score += 5;
			if (c.type.toLowerCase() === t) score += 6;
			if (c.tags.some((tag) => tag.toLowerCase().includes(t))) score += 4;
			if (hay.includes(t)) score += 1;
		}
		if (score === 0) continue;
		const idx = hay.indexOf(terms[0]);
		const start = Math.max(0, idx - 40);
		const snippet = (c.body || c.title).replace(/\s+/g, " ").slice(start, start + 140).trim();
		hits.push({
			path: c.path,
			title: c.title,
			type: c.type,
			score,
			snippet: snippet || String(c.meta.description ?? ""),
			tags: c.tags
		});
	}
	hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
	return hits.slice(0, 50);
}
function catalogTree(concepts) {
	const dirs = {};
	for (const c of Object.values(concepts)) {
		const parts = c.path.split("/");
		const dir = parts.length > 1 ? parts[0] : "(root)";
		(dirs[dir] ??= []).push(c);
	}
	for (const list of Object.values(dirs)) list.sort((a, b) => a.path.localeCompare(b.path));
	return dirs;
}
function buildFromBundle(bundle) {
	const concepts = loadConcepts(bundle.files);
	return {
		concepts,
		inbound: buildInbound(concepts),
		validation: validateBundle(concepts, bundle.files)
	};
}
async function loadBundledSample() {
	const res = await fetch("/sample-okf-bundle.json");
	if (!res.ok) throw new Error("Failed to load sample OKF bundle");
	const data = await res.json();
	return {
		id: "sample-okf",
		name: data.name || "sample-okf",
		source: "bundled",
		sourceUrl: "https://github.com/SpillwaveSolutions/okf-plugin/tree/main/sample-okf",
		files: data.files,
		loadedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function loadPluginMeta() {
	const res = await fetch("/okf-plugin-meta.json");
	if (!res.ok) throw new Error("Failed to load plugin meta");
	return res.json();
}
/** Parse owner/repo[/path] or full GitHub URL into parts. */
function parseGithubInput(input) {
	const raw = input.trim().replace(/\.git$/, "");
	if (!raw) return null;
	let owner = "";
	let repo = "";
	let branch = "main";
	let subpath = "";
	const urlMatch = raw.match(/github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+)(?:\/(.*))?)?/);
	if (urlMatch) {
		owner = urlMatch[1];
		repo = urlMatch[2];
		if (urlMatch[3]) branch = urlMatch[3];
		if (urlMatch[4]) subpath = urlMatch[4].replace(/\/$/, "");
	} else {
		const parts = raw.split("/").filter(Boolean);
		if (parts.length < 2) return null;
		owner = parts[0];
		repo = parts[1];
		if (parts.length > 2) subpath = parts.slice(2).join("/");
	}
	return {
		owner,
		repo,
		branch,
		subpath
	};
}
async function fetchGithubTree(owner, repo, branch) {
	const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
	const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`GitHub tree fetch failed (${res.status}): ${text.slice(0, 200)}`);
	}
	return (await res.json()).tree ?? [];
}
async function fetchRaw(owner, repo, branch, path) {
	const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${path}`);
	return res.text();
}
/**
* Load markdown files from a public GitHub repo (or subfolder) as an OKF bundle.
* Prefers paths that look like OKF (index.md + knowledge/agents) when present.
*/
async function loadGithubBundle(input, preferredSubpath) {
	const parsed = parseGithubInput(input);
	if (!parsed) throw new Error("Enter owner/repo or a GitHub URL");
	let { owner, repo, branch, subpath } = parsed;
	if (preferredSubpath) subpath = preferredSubpath.replace(/\/$/, "");
	const mdFiles = (await fetchGithubTree(owner, repo, branch)).filter((t) => t.type === "blob" && t.path.endsWith(".md") && !t.path.includes("node_modules"));
	if (!subpath) {
		const hasSample = mdFiles.some((f) => f.path.startsWith("sample-okf/"));
		const hasOkf = mdFiles.some((f) => f.path.startsWith(".okf/"));
		if (hasSample && !mdFiles.some((f) => f.path === "index.md")) subpath = "sample-okf";
		else if (hasOkf) subpath = ".okf";
	}
	const prefix = subpath ? subpath + "/" : "";
	const limited = mdFiles.filter((f) => subpath ? f.path.startsWith(prefix) : true).slice(0, 200);
	if (!limited.length) throw new Error("No markdown files found in that path");
	const files = {};
	const batchSize = 8;
	for (let i = 0; i < limited.length; i += batchSize) {
		const batch = limited.slice(i, i + batchSize);
		await Promise.all(batch.map(async (f) => {
			const content = await fetchRaw(owner, repo, branch, f.path);
			const rel = subpath ? f.path.slice(prefix.length) : f.path;
			if (rel) files[rel] = content;
		}));
	}
	return {
		id: `gh-${owner}-${repo}-${Date.now()}`,
		name: subpath ? `${repo}/${subpath}` : repo,
		source: "github",
		sourceUrl: `https://github.com/${owner}/${repo}/tree/${branch}${subpath ? "/" + subpath : ""}`,
		files,
		loadedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function loadFilesFromUpload(fileList) {
	const files = {};
	const list = Array.from(fileList);
	for (const file of list) {
		if (!file.name.endsWith(".md") && file.type !== "text/markdown") continue;
		const path = (file.webkitRelativePath || file.name).replace(/^[^/]+\//, "");
		const content = await file.text();
		files[path.includes("/") ? path : file.name] = content;
	}
	if (!Object.keys(files).length) throw new Error("No markdown files in upload");
	return {
		id: `upload-${Date.now()}`,
		name: "uploaded-bundle",
		source: "upload",
		files,
		loadedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function emptyScaffoldBundle(name = "my-okf") {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const index = (title, desc, body) => `---\ntitle: ${title}\ndescription: ${desc}\ntimestamp: ${now}\n---\n\n${body}\n`;
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
			"tickets/index.md": index("Tickets", "TicketLink catalog", `# Tickets\n\n`)
		},
		loadedAt: now
	};
}
var DEFAULT_OKF_SKILLS = [
	{
		skillId: "okf-init-graph",
		okfSkill: "okf-init-graph",
		description: "Scaffold graph-eng OKF bundles",
		enabled: true,
		asSubagent: false,
		tools: ["okf_validate", "filesystem"]
	},
	{
		skillId: "okf-author",
		okfSkill: "okf-author",
		description: "Create/update OKF concepts with provenance",
		enabled: true,
		asSubagent: false,
		tools: ["okf_validate", "filesystem"]
	},
	{
		skillId: "okf-impact",
		okfSkill: "okf-impact",
		description: "Blast-radius / impact analysis",
		enabled: true,
		asSubagent: true,
		tools: [
			"okf_impact",
			"okf_edges",
			"okf_backlinks"
		]
	},
	{
		skillId: "okf-query",
		okfSkill: "okf-query",
		description: "Multi-hop query & progressive disclosure packs",
		enabled: true,
		asSubagent: true,
		tools: [
			"okf_pack",
			"okf_subgraph",
			"okf_search"
		]
	},
	{
		skillId: "okf-validate",
		okfSkill: "okf-validate",
		description: "Conformance + graph quality checks",
		enabled: true,
		asSubagent: false,
		tools: ["okf_validate", "okf_orphans"]
	},
	{
		skillId: "okf-maintain",
		okfSkill: "okf-maintain",
		description: "Indexes, drift, orphans, migration",
		enabled: true,
		asSubagent: false,
		tools: [
			"okf_validate",
			"okf_orphans",
			"filesystem"
		]
	},
	{
		skillId: "okf-visualize",
		okfSkill: "okf-visualize",
		description: "Mermaid / JSON graph views",
		enabled: true,
		asSubagent: false,
		tools: ["okf_subgraph", "okf_edges"]
	}
];
var DEFAULT_PLUGINS = [{
	id: "okf-graph-eng",
	name: "okf-graph-eng",
	source: "SpillwaveSolutions/okf-plugin",
	version: "0.2.0",
	enabled: true,
	description: "Graph engineering for OKF — impact, agent graphs, progressive disclosure",
	kind: "claude-plugin"
}];
var DEFAULT_MCPS = [
	{
		id: "filesystem",
		name: "filesystem",
		transport: "stdio",
		command: "npx",
		args: [
			"-y",
			"@modelcontextprotocol/server-filesystem",
			"."
		],
		enabled: false,
		notes: "Local filesystem access for agents"
	},
	{
		id: "github",
		name: "github",
		transport: "stdio",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-github"],
		env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
		enabled: false,
		notes: "GitHub issues/PRs via MCP"
	},
	{
		id: "okf-graph",
		name: "okf-graph",
		transport: "stdio",
		command: "python3",
		args: ["scripts/okf-graph-mcp.py"],
		enabled: false,
		notes: "Optional future OKF MCP (roadmap) — configure when available"
	}
];
var STORAGE_KEY = "okf-workbench-integrations-v1";
function defaultIntegrations() {
	return {
		plugins: DEFAULT_PLUGINS.map((p) => ({ ...p })),
		mcps: DEFAULT_MCPS.map((m) => ({
			...m,
			env: m.env ? { ...m.env } : void 0
		})),
		skillMappings: DEFAULT_OKF_SKILLS.map((s) => ({
			...s,
			tools: [...s.tools]
		})),
		deepagentName: "okf-graph-engineer",
		deepagentDescription: "LangChain DeepAgent wired with okf-graph-eng skills for impact analysis, progressive disclosure, and OKF curation",
		packHops: 2,
		packMaxNodes: 20
	};
}
function loadIntegrations() {
	if (typeof localStorage === "undefined") return defaultIntegrations();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultIntegrations();
		const parsed = JSON.parse(raw);
		const base = defaultIntegrations();
		return {
			...base,
			...parsed,
			plugins: parsed.plugins?.length ? parsed.plugins : base.plugins,
			mcps: parsed.mcps?.length ? parsed.mcps : base.mcps,
			skillMappings: parsed.skillMappings?.length ? parsed.skillMappings : base.skillMappings
		};
	} catch {
		return defaultIntegrations();
	}
}
function saveIntegrations(state) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function buildDeepAgentExport(state, bundleName, skillBodies) {
	const enabledSkills = state.skillMappings.filter((s) => s.enabled);
	const skills = enabledSkills.map((s) => ({
		name: s.skillId,
		description: s.description,
		instructions: skillBodies?.[s.okfSkill]?.slice(0, 4e3) || `Load and follow the ${s.okfSkill} skill from okf-graph-eng. Prefer deterministic okf-graph tools before free-form reasoning.`,
		tools: s.tools
	}));
	const subagents = enabledSkills.filter((s) => s.asSubagent).map((s) => ({
		name: s.skillId.replace(/^okf-/, "okf_"),
		description: s.description,
		skills: [s.skillId],
		system_prompt: `You are a specialist subagent for ${s.okfSkill}. Use progressive disclosure (hops=${state.packHops}, max_nodes=${state.packMaxNodes}). Prefer deterministic graph tools. Cite concept paths.`
	}));
	if (enabledSkills.length) subagents.unshift({
		name: "graph_engineer",
		description: "Orchestrator for OKF dual-graph reasoning, impact, and curation",
		skills: enabledSkills.map((s) => s.skillId),
		system_prompt: "You are Graph Engineer. Treat the OKF repo as knowledge + agent/harness graph. Run impact before structural edits. Pack minimal context for long runs. Validate after writes."
	});
	return {
		framework: "langchain-deepagents",
		version: "0.1",
		name: state.deepagentName,
		description: state.deepagentDescription,
		skills,
		subagents,
		mcp_servers: state.mcps.filter((m) => m.enabled).map((m) => ({
			name: m.name,
			transport: m.transport,
			command: m.command,
			args: m.args,
			url: m.url
		})),
		okf: {
			bundle: bundleName,
			progressive_disclosure: {
				hops: state.packHops,
				max_nodes: state.packMaxNodes
			},
			prefer_deterministic: true
		}
	};
}
function buildClaudeSettingsSnippet(state) {
	const plugins = state.plugins.filter((p) => p.enabled).map((p) => ({
		name: p.name,
		source: p.source,
		version: p.version
	}));
	const mcpServers = {};
	for (const m of state.mcps.filter((x) => x.enabled)) if (m.transport === "stdio") mcpServers[m.name] = {
		command: m.command,
		args: m.args ?? [],
		env: m.env ?? {}
	};
	else mcpServers[m.name] = {
		url: m.url,
		transport: m.transport
	};
	return JSON.stringify({
		plugins,
		mcpServers,
		note: "Illustrative export — merge into Claude Code / host config as appropriate"
	}, null, 2);
}
function buildPythonDeepAgentSnippet(exp) {
	return `"""LangChain DeepAgents + okf-graph-eng skills (generated by OKF Workbench)."""
# pip install langchain deepagents  # adjust to your environment

from deepagents import create_deep_agent  # illustrative API surface

OKF_SKILLS = ${JSON.stringify(exp.skills.map((s) => ({
		name: s.name,
		description: s.description,
		tools: s.tools
	})), null, 2)}

SUBAGENTS = ${JSON.stringify(exp.subagents.map((s) => ({
		name: s.name,
		description: s.description,
		skills: s.skills
	})), null, 2)}

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
function recompute(bundle) {
	const { concepts, validation } = buildFromBundle(bundle);
	return {
		concepts,
		validation
	};
}
function pickDefaultPath(concepts) {
	if ("agents/graph-engineer.md" in concepts) return "agents/graph-engineer.md";
	return Object.keys(concepts).find((p) => !p.endsWith("index.md") && p !== "log.md") ?? Object.keys(concepts)[0] ?? null;
}
var useOkfStore = create((set, get) => ({
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
	init: async () => {
		set({
			loading: true,
			error: null
		});
		try {
			const integrations = loadIntegrations();
			let meta = null;
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
				editorDraft: first ? concepts[first]?.raw ?? "" : "",
				impactTarget: first ?? "",
				graphFocus: first,
				integrations,
				pluginSkills: meta?.skills ?? {},
				pluginAgent: meta?.agent ?? "",
				pluginInfo: meta?.plugin ?? null,
				statusMessage: `Loaded ${bundle.name} · ${Object.keys(concepts).length} concepts`
			});
			if (first) get().runGraph(first);
		} catch (e) {
			set({
				loading: false,
				error: e instanceof Error ? e.message : String(e),
				ready: true
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
			editorDraft: path && concepts[path] ? concepts[path].raw : "",
			dirty: false,
			impactTarget: path ?? get().impactTarget,
			graphFocus: path,
			view: path ? "editor" : get().view
		});
		if (path) get().runGraph(path);
	},
	setEditorDraft: (text) => set({
		editorDraft: text,
		dirty: true
	}),
	saveEditor: () => {
		const { bundle, selectedPath, editorDraft } = get();
		if (!bundle || !selectedPath) return;
		const files = {
			...bundle.files,
			[selectedPath]: editorDraft
		};
		const next = {
			...bundle,
			files
		};
		const { concepts, validation } = recompute(next);
		set({
			bundle: next,
			concepts,
			validation,
			dirty: false,
			editorDraft,
			statusMessage: `Saved ${selectedPath}`
		});
		get().showToast(`Saved ${selectedPath}`);
		if (get().graphFocus) get().runGraph(get().graphFocus);
	},
	setFileFilter: (q) => set({ fileFilter: q }),
	setSearchQuery: (q) => set({ searchQuery: q }),
	runSearch: () => {
		const { concepts, searchQuery } = get();
		set({
			searchHits: searchConcepts(concepts, searchQuery),
			view: "search"
		});
	},
	runImpact: (target) => {
		const t = target ?? get().impactTarget;
		const result = impact(get().concepts, t);
		if ("error" in result) {
			set({
				impactResult: null,
				error: result.error
			});
			return;
		}
		set({
			impactResult: result,
			impactTarget: t,
			error: null,
			view: "search"
		});
	},
	runPack: (target) => {
		const t = target ?? get().impactTarget;
		const { packHops, packMaxNodes, concepts } = get();
		const result = pack(concepts, t, packHops, packMaxNodes, false);
		if ("error" in result) {
			set({
				packResult: null,
				error: result.error
			});
			return;
		}
		set({
			packResult: result,
			error: null,
			view: "search"
		});
	},
	runGraph: (target) => {
		const t = target ?? get().graphFocus ?? get().selectedPath ?? "";
		if (!t) return;
		const result = subgraph(get().concepts, t, get().graphHops);
		if ("error" in result) {
			set({ graphData: null });
			return;
		}
		set({
			graphData: result,
			graphFocus: t
		});
	},
	setPackOpts: (hops, maxNodes) => set({
		packHops: hops,
		packMaxNodes: maxNodes
	}),
	setGraphHops: (hops) => {
		set({ graphHops: hops });
		get().runGraph();
	},
	loadSample: async () => {
		set({
			loading: true,
			error: null,
			openDialog: false
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
				editorDraft: first ? concepts[first]?.raw ?? "" : "",
				dirty: false,
				impactTarget: first ?? "",
				graphFocus: first,
				view: "explorer",
				statusMessage: `Loaded sample-okf · ${Object.keys(concepts).length} concepts`
			});
			if (first) get().runGraph(first);
			get().showToast("Loaded sample-okf from okf-plugin");
		} catch (e) {
			set({
				loading: false,
				error: e instanceof Error ? e.message : String(e)
			});
		}
	},
	loadGithub: async (input) => {
		set({
			loading: true,
			error: null,
			openDialog: false
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
				editorDraft: first ? concepts[first]?.raw ?? "" : "",
				dirty: false,
				impactTarget: first ?? "",
				graphFocus: first,
				view: "explorer",
				statusMessage: `Loaded ${bundle.name} · ${Object.keys(concepts).length} concepts`
			});
			if (first) get().runGraph(first);
			get().showToast(`Loaded ${bundle.name} (${Object.keys(concepts).length} concepts)`);
		} catch (e) {
			set({
				loading: false,
				error: e instanceof Error ? e.message : String(e)
			});
		}
	},
	loadUpload: async (files) => {
		set({
			loading: true,
			error: null,
			openDialog: false
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
				editorDraft: first ? concepts[first]?.raw ?? "" : "",
				dirty: false,
				view: "explorer"
			});
			get().showToast(`Uploaded ${Object.keys(concepts).length} files`);
		} catch (e) {
			set({
				loading: false,
				error: e instanceof Error ? e.message : String(e)
			});
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
			openDialog: false
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
		set({ classifications: get().classifications.map((c) => c.id === id ? {
			...c,
			...patch
		} : c) });
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
			editorDraft: first ? concepts[first]?.raw ?? "" : "",
			dirty: false,
			view: "explorer"
		});
		get().showToast(`Created OKF repo with ${Object.keys(concepts).length} files`);
	},
	setIntegrations: (patch) => {
		const integrations = {
			...get().integrations,
			...patch
		};
		saveIntegrations(integrations);
		set({ integrations });
	},
	updatePlugin: (id, patch) => {
		const plugins = get().integrations.plugins.map((p) => p.id === id ? {
			...p,
			...patch
		} : p);
		get().setIntegrations({ plugins });
	},
	addPlugin: (p) => {
		get().setIntegrations({ plugins: [...get().integrations.plugins, p] });
	},
	removePlugin: (id) => {
		get().setIntegrations({ plugins: get().integrations.plugins.filter((p) => p.id !== id) });
	},
	updateMcp: (id, patch) => {
		const mcps = get().integrations.mcps.map((m) => m.id === id ? {
			...m,
			...patch
		} : m);
		get().setIntegrations({ mcps });
	},
	addMcp: (m) => {
		get().setIntegrations({ mcps: [...get().integrations.mcps, m] });
	},
	removeMcp: (id) => {
		get().setIntegrations({ mcps: get().integrations.mcps.filter((m) => m.id !== id) });
	},
	updateSkillMapping: (id, patch) => {
		const skillMappings = get().integrations.skillMappings.map((s) => s.skillId === id ? {
			...s,
			...patch
		} : s);
		get().setIntegrations({ skillMappings });
	},
	exportDeepAgentJson: () => {
		const { integrations, bundle, pluginSkills } = get();
		return JSON.stringify(buildDeepAgentExport(integrations, bundle?.name ?? "okf-bundle", pluginSkills), null, 2);
	},
	exportDeepAgentPython: () => {
		const { integrations, bundle, pluginSkills } = get();
		return buildPythonDeepAgentSnippet(buildDeepAgentExport(integrations, bundle?.name ?? "okf-bundle", pluginSkills));
	},
	exportClaudeSettings: () => buildClaudeSettingsSnippet(get().integrations),
	createConcept: (path, content) => {
		const { bundle } = get();
		if (!bundle) return;
		const files = {
			...bundle.files,
			[path]: content
		};
		const next = {
			...bundle,
			files
		};
		const { concepts, validation } = recompute(next);
		set({
			bundle: next,
			concepts,
			validation,
			selectedPath: path,
			editorDraft: content,
			dirty: false,
			view: "editor"
		});
		get().showToast(`Created ${path}`);
	},
	deleteConcept: (path) => {
		const { bundle } = get();
		if (!bundle) return;
		const files = { ...bundle.files };
		delete files[path];
		const next = {
			...bundle,
			files
		};
		const { concepts, validation } = recompute(next);
		const first = pickDefaultPath(concepts);
		set({
			bundle: next,
			concepts,
			validation,
			selectedPath: first,
			editorDraft: first ? concepts[first]?.raw ?? "" : "",
			dirty: false
		});
	},
	setLearnStep: (n) => set({ learnStep: n }),
	showToast: (msg) => {
		set({ toast: msg });
		window.setTimeout(() => {
			if (get().toast === msg) set({ toast: null });
		}, 2800);
	},
	clearToast: () => set({ toast: null }),
	setOpenDialog: (open) => set({ openDialog: open })
}));
var MODES = [
	{
		id: "wysiwyg",
		label: "Preview"
	},
	{
		id: "markdown",
		label: "Markdown"
	},
	{
		id: "split",
		label: "Split"
	}
];
function Header() {
	const fileFilter = useOkfStore((s) => s.fileFilter);
	const setFileFilter = useOkfStore((s) => s.setFileFilter);
	const searchQuery = useOkfStore((s) => s.searchQuery);
	const setSearchQuery = useOkfStore((s) => s.setSearchQuery);
	const runSearch = useOkfStore((s) => s.runSearch);
	const editorMode = useOkfStore((s) => s.editorMode);
	const setEditorMode = useOkfStore((s) => s.setEditorMode);
	const setOpenDialog = useOkfStore((s) => s.setOpenDialog);
	const setView = useOkfStore((s) => s.setView);
	const dirty = useOkfStore((s) => s.dirty);
	const saveEditor = useOkfStore((s) => s.saveEditor);
	const bundle = useOkfStore((s) => s.bundle);
	const loading = useOkfStore((s) => s.loading);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "app-header",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "logo-mark",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitBranch, { className: "size-3.5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-semibold tracking-tight text-fg",
						children: "OKF Motion"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-fg-subtle hidden sm:block",
						children: "Graph engineering workbench"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "search-field hide-mobile",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3.5 text-fg-subtle shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "search",
					placeholder: "Search concepts, types, tags…",
					value: searchQuery || fileFilter,
					onChange: (e) => {
						setFileFilter(e.target.value);
						setSearchQuery(e.target.value);
					},
					onKeyDown: (e) => {
						if (e.key === "Enter") runSearch();
					},
					"aria-label": "Search notes and graph"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "view-toggle hide-mobile",
				role: "group",
				"aria-label": "Editor view mode",
				children: MODES.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `view-toggle-btn ${editorMode === m.id ? "active" : ""}`,
					onClick: () => {
						setEditorMode(m.id);
						setView("editor");
					},
					children: m.label
				}, m.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 ml-auto shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-ghost hide-mobile",
						onClick: () => setView("learn"),
						title: "Learn OKF",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden lg:inline",
							children: "Learn"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-secondary",
						onClick: () => setOpenDialog(true),
						disabled: loading,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Open"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-secondary hide-mobile",
						onClick: () => setView("classify"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden lg:inline",
							children: "Classify"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => saveEditor(),
						disabled: !dirty,
						title: "Save (⌘S)",
						children: dirty ? "Save" : "Saved"
					})
				]
			}),
			bundle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sr-only",
				"aria-live": "polite",
				children: ["Workspace ", bundle.name]
			})
		]
	});
}
var NAV = [
	{
		id: "learn",
		label: "Learn OKF",
		icon: BookOpen
	},
	{
		id: "explorer",
		label: "Explorer",
		icon: FolderTree
	},
	{
		id: "editor",
		label: "Editor",
		icon: FileText
	},
	{
		id: "search",
		label: "Graph & Search",
		icon: Network
	},
	{
		id: "classify",
		label: "Classify",
		icon: Sparkles
	},
	{
		id: "deepagent",
		label: "DeepAgents",
		icon: Bot
	},
	{
		id: "integrations",
		label: "Plugins & MCP",
		icon: Plug
	}
];
function typeBadge(type) {
	if (type === "AgentNode") return "badge-primary";
	if (type === "Workflow") return "badge-success";
	if (type === "Index") return "";
	return "";
}
function Sidebar() {
	const view = useOkfStore((s) => s.view);
	const setView = useOkfStore((s) => s.setView);
	const concepts = useOkfStore((s) => s.concepts);
	const selectedPath = useOkfStore((s) => s.selectedPath);
	const selectPath = useOkfStore((s) => s.selectPath);
	const fileFilter = useOkfStore((s) => s.fileFilter);
	const setFileFilter = useOkfStore((s) => s.setFileFilter);
	const bundle = useOkfStore((s) => s.bundle);
	const validation = useOkfStore((s) => s.validation);
	const tree = (0, import_react.useMemo)(() => catalogTree(concepts), [concepts]);
	const filter = fileFilter.trim().toLowerCase();
	const match = (c) => {
		if (!filter) return true;
		return c.path.toLowerCase().includes(filter) || c.title.toLowerCase().includes(filter) || c.type.toLowerCase().includes(filter);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "app-sidebar",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "nav-rail",
				"aria-label": "Primary",
				children: NAV.map((item) => {
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `nav-item ${view === item.id ? "active" : ""}`,
						onClick: () => setView(item.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 shrink-0" }), item.label]
					}, item.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 py-2 border-b border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-fg-subtle",
						children: bundle?.name ?? "Documents"
					}), validation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `badge ${validation.error_count ? "badge-danger" : "badge-success"}`,
						title: `${validation.error_count} errors, ${validation.warn_count} warnings`,
						children: validation.error_count ? `${validation.error_count} err` : "valid"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "search-field max-w-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3 text-fg-subtle shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						placeholder: "Filter files…",
						value: fileFilter,
						onChange: (e) => setFileFilter(e.target.value),
						"aria-label": "Filter files"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto px-2 py-2 scrollbar-thin",
				children: [Object.keys(concepts).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-4 text-center text-xs text-fg-muted",
					children: "No markdown in workspace. Open a repo or scaffold one."
				}), Object.entries(tree).map(([dir, list]) => {
					const filtered = list.filter(match);
					if (!filtered.length) return null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle",
							children: dir
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							role: "listbox",
							"aria-label": `${dir} concepts`,
							children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "option",
								"aria-selected": selectedPath === c.path,
								className: `file-tree-item ${selectedPath === c.path ? "active" : ""}`,
								onClick: () => selectPath(c.path),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 shrink-0 opacity-60" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate flex-1",
										children: c.path.split("/").pop()
									}),
									c.type && c.type !== "Unknown" && c.type !== "Index" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `badge ${typeBadge(c.type)}`,
										children: c.type.replace("Node", "")
									})
								]
							}, c.path))
						})]
					}, dir);
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border px-3 py-2 text-[10px] text-fg-subtle flex items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-3" }),
					Object.keys(concepts).length,
					" concepts",
					bundle?.source ? ` · ${bundle.source}` : ""
				]
			})
		]
	});
}
/** Lightweight Markdown → safe HTML for preview (no external deps). */
function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function markdownToHtml(md) {
	const lines = md.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").split("\n");
	const out = [];
	let inCode = false;
	let codeLang = "";
	let codeBuf = [];
	let inList = null;
	let inTable = false;
	const closeList = () => {
		if (inList) {
			out.push(inList === "ul" ? "</ul>" : "</ol>");
			inList = null;
		}
	};
	const closeTable = () => {
		if (inTable) {
			out.push("</tbody></table>");
			inTable = false;
		}
	};
	const inline = (s) => {
		let t = escapeHtml(s);
		t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
		t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\">$1</a>");
		t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
		t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
		t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
		return t;
	};
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		if (line.startsWith("```")) {
			if (!inCode) {
				closeList();
				closeTable();
				inCode = true;
				codeLang = line.slice(3).trim();
				codeBuf = [];
			} else {
				out.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
				inCode = false;
				codeLang = "";
				codeBuf = [];
			}
			continue;
		}
		if (inCode) {
			codeBuf.push(line);
			continue;
		}
		if (line.includes("|") && line.trim().startsWith("|")) {
			const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
			const next = lines[i + 1] ?? "";
			const isSep = /^\|?[\s:-]+\|/.test(next);
			if (!inTable) {
				closeList();
				out.push("<table><thead><tr>");
				for (const c of cells) out.push(`<th>${inline(c)}</th>`);
				out.push("</tr></thead><tbody>");
				inTable = true;
				if (isSep) {
					i++;
					continue;
				}
				continue;
			}
			if (/^[\s|:-]+$/.test(line.replace(/\|/g, ""))) continue;
			out.push("<tr>");
			for (const c of cells) out.push(`<td>${inline(c)}</td>`);
			out.push("</tr>");
			continue;
		} else closeTable();
		if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
			closeList();
			out.push("<hr />");
			continue;
		}
		const h = line.match(/^(#{1,4})\s+(.+)$/);
		if (h) {
			closeList();
			const level = h[1].length;
			out.push(`<h${level}>${inline(h[2])}</h${level}>`);
			continue;
		}
		if (line.startsWith("> ")) {
			closeList();
			out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
			continue;
		}
		const ul = line.match(/^[-*+]\s+(.+)$/);
		if (ul) {
			if (inList !== "ul") {
				closeList();
				out.push("<ul>");
				inList = "ul";
			}
			out.push(`<li>${inline(ul[1])}</li>`);
			continue;
		}
		const ol = line.match(/^\d+\.\s+(.+)$/);
		if (ol) {
			if (inList !== "ol") {
				closeList();
				out.push("<ol>");
				inList = "ol";
			}
			out.push(`<li>${inline(ol[1])}</li>`);
			continue;
		}
		if (!line.trim()) {
			closeList();
			continue;
		}
		closeList();
		out.push(`<p>${inline(line)}</p>`);
	}
	closeList();
	closeTable();
	if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
	return out.join("\n");
}
function MarkdownPreview({ source, className = "" }) {
	const html = markdownToHtml(source);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `md-preview ${className}`,
		dangerouslySetInnerHTML: { __html: html }
	});
}
/** Force-free radial layout around root for subgraph visualization. */
function GraphCanvas({ nodes, edges, root, onSelect, height = 320 }) {
	const layout = (0, import_react.useMemo)(() => {
		if (!nodes.length) return [];
		const w = 640;
		const h = height;
		const cx = w / 2;
		const cy = h / 2;
		const rootId = root && nodes.some((n) => n.id === root) ? root : nodes[0].id;
		const others = nodes.filter((n) => n.id !== rootId);
		const r = Math.min(w, h) * .36;
		const placed = [{
			...nodes.find((n) => n.id === rootId),
			x: cx,
			y: cy
		}];
		others.forEach((n, i) => {
			const angle = i / Math.max(others.length, 1) * Math.PI * 2 - Math.PI / 2;
			const ring = n.depth && n.depth > 1 ? r * 1.15 : r;
			placed.push({
				...n,
				x: cx + Math.cos(angle) * ring,
				y: cy + Math.sin(angle) * ring
			});
		});
		return placed;
	}, [
		nodes,
		root,
		height
	]);
	const byId = (0, import_react.useMemo)(() => {
		return new Map(layout.map((n) => [n.id, n]));
	}, [layout]);
	if (!nodes.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center text-fg-muted text-sm border border-border rounded-lg bg-bg-elevated",
		style: { height },
		children: "No graph nodes — select a concept"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-hidden rounded-lg border border-border bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 640 ${height}`,
			className: "w-full",
			style: { height },
			role: "img",
			"aria-label": "OKF concept graph",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("marker", {
					id: "arrow",
					viewBox: "0 0 10 10",
					refX: "9",
					refY: "5",
					markerWidth: "6",
					markerHeight: "6",
					orient: "auto-start-reverse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M 0 0 L 10 5 L 0 10 z",
						fill: "#484f58"
					})
				}) }),
				edges.map((e, i) => {
					const a = byId.get(e.from);
					const b = byId.get(e.to);
					if (!a || !b) return null;
					const typed = e.rel !== "links_to";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: a.x,
						y1: a.y,
						x2: b.x,
						y2: b.y,
						stroke: typed ? "#58a6ff" : "#30363d",
						strokeWidth: typed ? 1.5 : 1,
						strokeDasharray: typed ? void 0 : "4 3",
						markerEnd: "url(#arrow)"
					}), typed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: (a.x + b.x) / 2,
						y: (a.y + b.y) / 2 - 4,
						fill: "#6e7681",
						fontSize: "9",
						textAnchor: "middle",
						children: e.rel
					})] }, `${e.from}-${e.to}-${i}`);
				}),
				layout.map((n) => {
					const isRoot = n.id === root || n.id === layout[0]?.id;
					const r = isRoot ? 22 : 16;
					const fill = n.type === "AgentNode" ? "#1f6feb" : n.type === "Workflow" ? "#238636" : n.criticality === "critical" ? "#da3633" : "#21262d";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						className: "cursor-pointer",
						onClick: () => onSelect?.(n.id),
						role: "button",
						tabIndex: 0,
						onKeyDown: (ev) => {
							if (ev.key === "Enter" || ev.key === " ") onSelect?.(n.id);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: n.x,
							cy: n.y,
							r,
							fill,
							stroke: isRoot ? "#58a6ff" : "#30363d",
							strokeWidth: isRoot ? 2 : 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							x: n.x,
							y: n.y + r + 12,
							fill: "#e6edf3",
							fontSize: "10",
							textAnchor: "middle",
							children: n.title.length > 22 ? n.title.slice(0, 20) + "…" : n.title
						})]
					}, n.id);
				})
			]
		})
	});
}
function wrapSelection(text, start, end, before, after) {
	const selected = text.slice(start, end) || "text";
	return {
		next: text.slice(0, start) + before + selected + after + text.slice(end),
		cursor: start + before.length + selected.length + after.length
	};
}
function EditorPane() {
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
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				saveEditor();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [saveEditor]);
	const concept = selectedPath ? concepts[selectedPath] : null;
	const applyWrap = (before, after) => {
		const ta = document.getElementById("okf-md-editor");
		if (!ta) {
			setEditorDraft(before + after + editorDraft);
			return;
		}
		const { next } = wrapSelection(editorDraft, ta.selectionStart, ta.selectionEnd, before, after);
		setEditorDraft(next);
	};
	if (!selectedPath) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 flex items-center justify-center p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold text-fg",
				children: "No file selected"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg-muted",
				children: "Open an OKF repository and pick a concept from the sidebar — or start from the Learn tab."
			})]
		})
	});
	const showMd = editorMode === "markdown" || editorMode === "split";
	const showPreview = editorMode === "wysiwyg" || editorMode === "split";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 flex flex-col min-h-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "editor-toolbar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-fg-muted font-mono mr-2 truncate max-w-[40%]",
					children: [selectedPath, dirty ? " · unsaved" : ""]
				}),
				concept && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "badge badge-primary",
					children: concept.type
				}), concept.verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "badge badge-success",
					children: "verified"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "toolbar-divider" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Bold",
					onClick: () => applyWrap("**", "**"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bold, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Inline code",
					onClick: () => applyWrap("`", "`"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Code, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Heading 1",
					onClick: () => applyWrap("\n# ", "\n"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading1, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Heading 2",
					onClick: () => applyWrap("\n## ", "\n"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading2, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Bullet list",
					onClick: () => applyWrap("\n- ", "\n"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Numbered list",
					onClick: () => applyWrap("\n1. ", "\n"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "size-3.5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "toolbar-divider" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Impact analysis",
					onClick: () => runImpact(selectedPath),
					children: "Impact"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn",
					title: "Context pack",
					onClick: () => runPack(selectedPath),
					children: "Pack"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "toolbar-btn ml-auto",
					onClick: () => saveEditor(),
					disabled: !dirty,
					title: "Save",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `flex-1 min-h-0 grid ${editorMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`,
			children: [showMd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				id: "okf-md-editor",
				className: "w-full h-full min-h-[240px] resize-none border-0 border-r border-border bg-bg p-4 font-mono text-[13px] leading-relaxed text-fg outline-none focus:ring-0",
				value: editorDraft,
				onChange: (e) => setEditorDraft(e.target.value),
				spellCheck: false,
				"aria-label": "Markdown editor"
			}), showPreview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-y-auto p-4 md:p-6 scrollbar-thin border-t lg:border-t-0 border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownPreview, { source: editorDraft }), graphData && graphData.root === selectedPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-semibold uppercase tracking-wider text-fg-subtle",
						children: "Neighborhood graph"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraphCanvas, {
						nodes: graphData.nodes,
						edges: graphData.edges,
						root: graphData.root,
						onSelect: selectPath,
						height: 280
					})]
				})]
			})]
		})]
	});
}
var STEPS = [
	{
		title: "What is OKF?",
		body: "OKF (Open Knowledge Format) is Git-native Markdown + YAML. Each concept file is a node; absolute Markdown links are edges. You get a portable knowledge graph without a proprietary database."
	},
	{
		title: "Dual graph",
		body: "okf-graph-eng treats the same repo as (1) a knowledge graph — datasets, APIs, runbooks — and (2) an agent/harness graph — AgentNode, Workflow, SharedState, DecisionRecord."
	},
	{
		title: "Frontmatter & types",
		body: "Every concept needs type, title, description, timestamp. Knowledge types: Dataset, Table, Metric, Playbook, Runbook, API, Reference. Harness: AgentNode, Workflow, Harness, DecisionRecord, SharedState, ToolCapability, TicketLink."
	},
	{
		title: "Typed edges",
		body: "Prefer absolute links like [Graph Engineer](/agents/graph-engineer.md). Optional frontmatter links: rel routes_to, depends_on, uses, implements, tracks…"
	},
	{
		title: "Impact analysis",
		body: "Before structural edits, run impact on a concept. You get inbound/outbound blast radius, criticality by type + verified flag, and a suggested update order."
	},
	{
		title: "Progressive disclosure",
		body: "Pack a 2-hop subgraph (default max ~20 nodes) so long-running agents get minimal context instead of the whole tree. This is the core of okf-query."
	},
	{
		title: "Skills in okf-plugin",
		body: "okf-init-graph, okf-author, okf-impact, okf-query, okf-validate, okf-maintain, okf-visualize — portable SKILL.md files for Claude Code and Grok Build."
	},
	{
		title: "DeepAgents + MCP",
		body: "Map those skills into LangChain DeepAgents (skills + subagents), enable Claude plugins, and configure MCP servers from the Integrations tab. Export JSON or Python scaffolding."
	}
];
function LearnPanel() {
	const step = useOkfStore((s) => s.learnStep);
	const setLearnStep = useOkfStore((s) => s.setLearnStep);
	const setView = useOkfStore((s) => s.setView);
	const selectPath = useOkfStore((s) => s.selectPath);
	const runImpact = useOkfStore((s) => s.runImpact);
	const runPack = useOkfStore((s) => s.runPack);
	const concepts = useOkfStore((s) => s.concepts);
	const validation = useOkfStore((s) => s.validation);
	const pluginInfo = useOkfStore((s) => s.pluginInfo);
	const current = STEPS[step] ?? STEPS[0];
	const sampleAgent = "agents/graph-engineer.md";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-3xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold uppercase tracking-wider text-primary mb-2",
						children: "Learning path"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl md:text-3xl font-semibold tracking-tight text-fg",
						children: "Learn OKF by using it"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-fg-muted max-w-2xl",
						children: [
							"A Motion-style writing surface, upgraded for",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://github.com/SpillwaveSolutions/okf-plugin",
								className: "text-primary hover:underline",
								target: "_blank",
								rel: "noreferrer",
								children: "okf-graph-eng"
							}),
							": edit Markdown, search the graph, classify docs into a searchable repo, and wire skills into DeepAgents."
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid sm:grid-cols-3 gap-3",
					children: [
						{
							icon: BookOpen,
							label: "Concepts",
							value: String(Object.keys(concepts).length)
						},
						{
							icon: CircleCheck,
							label: "Validation",
							value: validation ? validation.error_count ? `${validation.error_count} errors` : "Healthy" : "—"
						},
						{
							icon: Network,
							label: "Plugin",
							value: String(pluginInfo?.name ?? "okf-graph-eng")
						}
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-fg-muted text-xs mb-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "size-3.5" }), s.label]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-semibold text-fg truncate",
							children: s.value
						})]
					}, s.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-sm font-semibold text-fg",
								children: [
									"Step ",
									step + 1,
									" of ",
									STEPS.length,
									": ",
									current.title
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "badge",
								children: [Math.round((step + 1) / STEPS.length * 100), "%"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 rounded-full bg-bg-subtle overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-primary rounded-full transition-all",
								style: { width: `${(step + 1) / STEPS.length * 100}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg-muted leading-relaxed",
							children: current.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								disabled: step === 0,
								onClick: () => setLearnStep(Math.max(0, step - 1)),
								children: "Back"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "btn btn-primary",
								onClick: () => setLearnStep(Math.min(STEPS.length - 1, step + 1)),
								disabled: step >= STEPS.length - 1,
								children: ["Next", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid sm:grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "panel-card text-left hover:border-primary/40 transition-colors",
							onClick: () => {
								selectPath(sampleAgent);
								setView("editor");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCue, {
								icon: BookOpen,
								title: "Open Graph Engineer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-2",
								children: "Inspect a real AgentNode from sample-okf with typed edges."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "panel-card text-left hover:border-primary/40 transition-colors",
							onClick: () => {
								runImpact(sampleAgent);
								setView("search");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCue, {
								icon: Network,
								title: "Run impact analysis"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-2",
								children: "See blast radius for the specialist agent before edits."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "panel-card text-left hover:border-primary/40 transition-colors",
							onClick: () => {
								runPack(sampleAgent);
								setView("search");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCue, {
								icon: Sparkles,
								title: "Build a context pack"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-2",
								children: "Progressive disclosure: 2-hop pack for agent runs."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "panel-card text-left hover:border-primary/40 transition-colors",
							onClick: () => setView("deepagent"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCue, {
								icon: Bot,
								title: "Wire DeepAgents"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-2",
								children: "Install okf skills as LangChain DeepAgent skills/subagents."
							})]
						})
					]
				})
			]
		})
	});
}
function FileCue({ icon: Icon, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 text-sm font-medium text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), title]
	});
}
function SearchPanel() {
	const searchQuery = useOkfStore((s) => s.searchQuery);
	const setSearchQuery = useOkfStore((s) => s.setSearchQuery);
	const runSearch = useOkfStore((s) => s.runSearch);
	const searchHits = useOkfStore((s) => s.searchHits);
	const impactTarget = useOkfStore((s) => s.impactTarget);
	const impactResult = useOkfStore((s) => s.impactResult);
	const packResult = useOkfStore((s) => s.packResult);
	const packHops = useOkfStore((s) => s.packHops);
	const packMaxNodes = useOkfStore((s) => s.packMaxNodes);
	const setPackOpts = useOkfStore((s) => s.setPackOpts);
	const runImpact = useOkfStore((s) => s.runImpact);
	const runPack = useOkfStore((s) => s.runPack);
	const graphData = useOkfStore((s) => s.graphData);
	const graphHops = useOkfStore((s) => s.graphHops);
	const setGraphHops = useOkfStore((s) => s.setGraphHops);
	const selectPath = useOkfStore((s) => s.selectPath);
	const concepts = useOkfStore((s) => s.concepts);
	const validation = useOkfStore((s) => s.validation);
	const setView = useOkfStore((s) => s.setView);
	const conceptList = Object.values(concepts).sort((a, b) => a.title.localeCompare(b.title));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-5xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold text-fg",
					children: "Graph & search"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-fg-muted mt-1",
					children: "Full-text search over concepts plus okf-graph ops: impact, pack, neighborhood, validation."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "field-label",
							children: "Search"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input flex-1",
								value: searchQuery,
								onChange: (e) => setSearchQuery(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && runSearch(),
								placeholder: "impact analysis, AgentNode, routes_to…",
								"aria-label": "Graph search query"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-primary",
								onClick: runSearch,
								children: "Search"
							})]
						}),
						searchHits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border",
							children: searchHits.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "w-full text-left py-2.5 hover:bg-bg-subtle px-2 rounded-md",
								onClick: () => {
									selectPath(h.path);
									setView("editor");
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-medium text-fg",
												children: h.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "badge",
												children: h.type
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] text-fg-subtle ml-auto",
												children: ["score ", h.score]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-fg-muted mt-0.5 font-mono",
										children: h.path
									}),
									h.snippet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-fg-subtle mt-1 line-clamp-2",
										children: h.snippet
									})
								]
							}) }, h.path))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid lg:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold text-fg",
								children: "Impact analysis"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "field-label",
								children: "Target concept"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field-input",
								value: impactTarget,
								onChange: (e) => runImpact(e.target.value),
								"aria-label": "Impact target",
								children: conceptList.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: c.path,
									children: [
										c.title,
										" (",
										c.path,
										")"
									]
								}, c.path))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								onClick: () => runImpact(),
								children: "Compute impact"
							}),
							impactResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "badge badge-primary",
											children: ["inbound ", impactResult.stats.inbound_count]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "badge",
											children: ["outbound ", impactResult.stats.outbound_count]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "badge",
											children: ["typed ", impactResult.stats.typed_edge_count]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "field-label",
									children: "Suggested update order"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "list-decimal pl-4 text-fg-muted space-y-0.5",
									children: impactResult.suggested_order.slice(0, 12).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-primary hover:underline",
										onClick: () => selectPath(id),
										children: id
									}), impactResult.inbound.find((n) => n.id === id) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-1 badge",
										children: impactResult.inbound.find((n) => n.id === id).criticality
									})] }, id))
								})] })]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold text-fg",
								children: "Progressive disclosure pack"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "field-label",
									children: "Hops"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									max: 5,
									className: "field-input",
									value: packHops,
									onChange: (e) => setPackOpts(Number(e.target.value) || 2, packMaxNodes)
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "field-label",
									children: "Max nodes"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 3,
									max: 50,
									className: "field-input",
									value: packMaxNodes,
									onChange: (e) => setPackOpts(packHops, Number(e.target.value) || 20)
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary",
								onClick: () => runPack(),
								children: "Build pack"
							}),
							packResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "badge badge-primary",
											children: [packResult.nodes.length, " nodes"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "badge",
											children: packResult.mode
										}),
										packResult.excluded.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "badge badge-warn",
											children: [packResult.excluded.length, " trimmed"]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "max-h-64 overflow-y-auto rounded-md border border-border bg-bg p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownPreview, { source: packResult.markdown })
								})]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold text-fg",
							children: "Neighborhood graph"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs text-fg-muted",
								children: "Hops"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								max: 4,
								className: "field-input w-20",
								value: graphHops,
								onChange: (e) => setGraphHops(Number(e.target.value) || 2)
							})]
						})]
					}), graphData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraphCanvas, {
						nodes: graphData.nodes,
						edges: graphData.edges,
						root: graphData.root,
						onSelect: (p) => {
							selectPath(p);
						},
						height: 360
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg-muted",
						children: "Select a concept to visualize."
					})]
				}),
				validation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold text-fg",
							children: "Validation"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "badge",
									children: [validation.concept_count, " concepts"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "badge",
									children: [validation.edge_count, " edges"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `badge ${validation.error_count ? "badge-danger" : "badge-success"}`,
									children: [validation.error_count, " errors"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "badge badge-warn",
									children: [validation.warn_count, " warnings"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "text-xs space-y-1 max-h-48 overflow-y-auto",
							children: validation.issues.slice(0, 40).map((iss, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `badge ${iss.severity === "error" ? "badge-danger" : iss.severity === "warn" ? "badge-warn" : ""}`,
									children: iss.severity
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-fg-muted",
									children: [iss.message, iss.path ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-primary hover:underline",
										onClick: () => selectPath(iss.path),
										children: iss.path
									})] }) : null]
								})]
							}, i))
						})
					]
				})
			]
		})
	});
}
function ClassifyPanel() {
	const classifyDocs = useOkfStore((s) => s.classifyDocs);
	const setClassifyDocs = useOkfStore((s) => s.setClassifyDocs);
	const classifications = useOkfStore((s) => s.classifications);
	const runClassify = useOkfStore((s) => s.runClassify);
	const updateClassification = useOkfStore((s) => s.updateClassification);
	const applyClassifications = useOkfStore((s) => s.applyClassifications);
	const [paste, setPaste] = (0, import_react.useState)("");
	const [bundleName, setBundleName] = (0, import_react.useState)("classified-okf");
	const fileRef = (0, import_react.useRef)(null);
	const addPaste = () => {
		if (!paste.trim()) return;
		const id = `paste-${Date.now()}`;
		setClassifyDocs([...classifyDocs, {
			id,
			name: `pasted-${classifyDocs.length + 1}.md`,
			content: paste
		}]);
		setPaste("");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-4xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold text-fg",
					children: "Classify into OKF"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-fg-muted mt-1",
					children: "Drop a pile of documents — we suggest types, paths, tags, and frontmatter, then build a searchable OKF bundle (okf-author style)."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "btn btn-secondary",
									onClick: () => fileRef.current?.click(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Upload markdown"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileRef,
									type: "file",
									accept: ".md,.txt,text/markdown,text/plain",
									multiple: true,
									className: "hidden",
									onChange: async (e) => {
										const files = e.target.files;
										if (!files) return;
										const docs = [];
										for (const f of Array.from(files)) docs.push({
											id: `${f.name}-${f.lastModified}`,
											name: f.name,
											content: await f.text()
										});
										setClassifyDocs([...classifyDocs, ...docs]);
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-fg-muted self-center",
									children: [
										classifyDocs.length,
										" document",
										classifyDocs.length === 1 ? "" : "s",
										" staged"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "field-label",
							children: "Or paste markdown"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "field-textarea min-h-[120px]",
							value: paste,
							onChange: (e) => setPaste(e.target.value),
							placeholder: "# Incident runbook\n\nWhen the API errors..."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: addPaste,
							children: "Add pasted doc"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-primary",
							disabled: !classifyDocs.length,
							onClick: runClassify,
							children: "Classify documents"
						})
					]
				}),
				classifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-w-[160px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "field-label",
								children: "Bundle name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input",
								value: bundleName,
								onChange: (e) => setBundleName(e.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-primary",
							onClick: () => applyClassifications(bundleName),
							children: "Create OKF repo"
						})]
					}), classifications.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex items-center gap-2 text-sm text-fg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: c.accepted,
										onChange: (e) => updateClassification(c.id, { accepted: e.target.checked })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: c.sourceName
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "badge badge-primary",
									children: [Math.round(c.confidence * 100), "% conf"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid sm:grid-cols-2 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "field-label",
										children: "Type"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										className: "field-input",
										value: c.type,
										onChange: (e) => updateClassification(c.id, { type: e.target.value }),
										children: ALL_OKF_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: t,
											children: t
										}, t))
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "field-label",
										children: "Path"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input font-mono text-xs",
										value: c.path,
										onChange: (e) => updateClassification(c.id, { path: e.target.value })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "field-label",
										children: "Title"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input",
										value: c.title,
										onChange: (e) => updateClassification(c.id, { title: e.target.value })
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "field-label",
										children: "Tags"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input",
										value: c.tags.join(", "),
										onChange: (e) => updateClassification(c.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted",
								children: c.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-fg-subtle",
								children: ["Reasons: ", c.reasons.join(" · ")]
							})
						]
					}, c.id))]
				})
			]
		})
	});
}
function DeepAgentPanel() {
	const integrations = useOkfStore((s) => s.integrations);
	const updateSkillMapping = useOkfStore((s) => s.updateSkillMapping);
	const setIntegrations = useOkfStore((s) => s.setIntegrations);
	const exportDeepAgentJson = useOkfStore((s) => s.exportDeepAgentJson);
	const exportDeepAgentPython = useOkfStore((s) => s.exportDeepAgentPython);
	const pluginSkills = useOkfStore((s) => s.pluginSkills);
	const showToast = useOkfStore((s) => s.showToast);
	const [tab, setTab] = (0, import_react.useState)("map");
	const copy = async (text) => {
		try {
			await navigator.clipboard.writeText(text);
			showToast("Copied to clipboard");
		} catch {
			showToast("Copy failed — select and copy manually");
		}
	};
	const download = (filename, text) => {
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-4xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold text-fg",
					children: "LangChain DeepAgents"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-fg-muted mt-1",
					children: [
						"Install",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-primary",
							children: "okf-graph-eng"
						}),
						" skills as DeepAgent skills and specialist subagents. Export JSON config or Python scaffolding for your harness."
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card grid sm:grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "field-label",
							children: "Agent name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field-input",
							value: integrations.deepagentName,
							onChange: (e) => setIntegrations({ deepagentName: e.target.value })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "field-label",
							children: "Pack hops / max nodes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								className: "field-input",
								value: integrations.packHops,
								onChange: (e) => setIntegrations({ packHops: Number(e.target.value) || 2 })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								className: "field-input",
								value: integrations.packMaxNodes,
								onChange: (e) => setIntegrations({ packMaxNodes: Number(e.target.value) || 20 })
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "field-label",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "field-textarea min-h-[72px]",
								value: integrations.deepagentDescription,
								onChange: (e) => setIntegrations({ deepagentDescription: e.target.value })
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "view-toggle w-fit",
					children: [
						["map", "Skill map"],
						["json", "JSON export"],
						["python", "Python"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `view-toggle-btn ${tab === id ? "active" : ""}`,
						onClick: () => setTab(id),
						children: label
					}, id))
				}),
				tab === "map" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: integrations.skillMappings.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-sm font-medium text-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.enabled,
											onChange: (e) => updateSkillMapping(s.skillId, { enabled: e.target.checked })
										}), s.skillId]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-1.5 text-xs text-fg-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: s.asSubagent,
											onChange: (e) => updateSkillMapping(s.skillId, { asSubagent: e.target.checked })
										}), "Subagent"]
									}),
									pluginSkills[s.okfSkill] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "badge badge-success",
										children: "SKILL.md loaded"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-1",
								children: s.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-fg-subtle mt-1 font-mono",
								children: ["tools: ", s.tools.join(", ")]
							})
						]
					}, s.skillId))
				}),
				tab === "json" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: () => void copy(exportDeepAgentJson()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: () => download("okf-deepagent.json", exportDeepAgentJson()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Download"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "text-[11px] font-mono overflow-auto max-h-[480px] p-3 rounded-md bg-bg border border-border text-fg-muted",
						children: exportDeepAgentJson()
					})]
				}),
				tab === "python" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: () => void copy(exportDeepAgentPython()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: () => download("okf_deepagent.py", exportDeepAgentPython()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Download"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "text-[11px] font-mono overflow-auto max-h-[480px] p-3 rounded-md bg-bg border border-border text-fg-muted whitespace-pre-wrap",
						children: exportDeepAgentPython()
					})]
				})
			]
		})
	});
}
function IntegrationsPanel() {
	const integrations = useOkfStore((s) => s.integrations);
	const updatePlugin = useOkfStore((s) => s.updatePlugin);
	const addPlugin = useOkfStore((s) => s.addPlugin);
	const removePlugin = useOkfStore((s) => s.removePlugin);
	const updateMcp = useOkfStore((s) => s.updateMcp);
	const addMcp = useOkfStore((s) => s.addMcp);
	const removeMcp = useOkfStore((s) => s.removeMcp);
	const exportClaudeSettings = useOkfStore((s) => s.exportClaudeSettings);
	const showToast = useOkfStore((s) => s.showToast);
	const [tab, setTab] = (0, import_react.useState)("plugins");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-4xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold text-fg",
					children: "Plugins & MCP"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-fg-muted mt-1",
					children: "Configure Claude Code plugins (including okf-graph-eng) and MCP servers. Settings persist in this browser."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "view-toggle w-fit",
					children: [
						["plugins", "Claude plugins"],
						["mcp", "MCP servers"],
						["export", "Export config"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `view-toggle-btn ${tab === id ? "active" : ""}`,
						onClick: () => setTab(id),
						children: label
					}, id))
				}),
				tab === "plugins" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [integrations.plugins.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: p.enabled,
										onChange: (e) => updatePlugin(p.id, { enabled: e.target.checked }),
										"aria-label": `Enable ${p.name}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input flex-1",
										value: p.name,
										onChange: (e) => updatePlugin(p.id, { name: e.target.value }),
										"aria-label": "Plugin name"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn btn-ghost btn-icon",
										onClick: () => removePlugin(p.id),
										"aria-label": `Remove ${p.name}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input font-mono text-xs",
								value: p.source,
								onChange: (e) => updatePlugin(p.id, { source: e.target.value }),
								placeholder: "owner/repo or local path",
								"aria-label": "Plugin source"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input",
								value: p.description ?? "",
								onChange: (e) => updatePlugin(p.id, { description: e.target.value }),
								placeholder: "Description"
							})
						]
					}, p.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-secondary",
						onClick: () => addPlugin({
							id: `plugin-${Date.now()}`,
							name: "new-plugin",
							source: "owner/repo",
							enabled: true,
							kind: "claude-plugin"
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Add plugin"]
					})]
				}),
				tab === "mcp" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [integrations.mcps.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: m.enabled,
										onChange: (e) => updateMcp(m.id, { enabled: e.target.checked })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "field-input flex-1",
										value: m.name,
										onChange: (e) => updateMcp(m.id, { name: e.target.value })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "field-input w-28",
										value: m.transport,
										onChange: (e) => updateMcp(m.id, { transport: e.target.value }),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "stdio",
												children: "stdio"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "sse",
												children: "sse"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "http",
												children: "http"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn btn-ghost btn-icon",
										onClick: () => removeMcp(m.id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
									})
								]
							}),
							m.transport === "stdio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input font-mono text-xs",
								value: m.command ?? "",
								onChange: (e) => updateMcp(m.id, { command: e.target.value }),
								placeholder: "command"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input font-mono text-xs",
								value: (m.args ?? []).join(" "),
								onChange: (e) => updateMcp(m.id, { args: e.target.value.split(/\s+/).filter(Boolean) }),
								placeholder: "args space-separated"
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input font-mono text-xs",
								value: m.url ?? "",
								onChange: (e) => updateMcp(m.id, { url: e.target.value }),
								placeholder: "https://…"
							}),
							m.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-fg-subtle",
								children: m.notes
							})
						]
					}, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn btn-secondary",
						onClick: () => addMcp({
							id: `mcp-${Date.now()}`,
							name: "custom-mcp",
							transport: "stdio",
							command: "npx",
							args: ["-y", "package"],
							enabled: false
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Add MCP server"]
					})]
				}),
				tab === "export" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn btn-secondary",
							onClick: async () => {
								try {
									await navigator.clipboard.writeText(exportClaudeSettings());
									showToast("Config copied");
								} catch {
									showToast("Copy failed");
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Copy settings JSON"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "text-[11px] font-mono overflow-auto max-h-[420px] p-3 rounded-md bg-bg border border-border text-fg-muted",
							children: exportClaudeSettings()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-fg-subtle",
							children: "Illustrative merge target for Claude Code / host MCP config — adapt keys to your host schema."
						})
					]
				})
			]
		})
	});
}
function ExplorerPanel() {
	const concepts = useOkfStore((s) => s.concepts);
	const selectPath = useOkfStore((s) => s.selectPath);
	const setView = useOkfStore((s) => s.setView);
	const bundle = useOkfStore((s) => s.bundle);
	const validation = useOkfStore((s) => s.validation);
	const graphData = useOkfStore((s) => s.graphData);
	const selectedPath = useOkfStore((s) => s.selectedPath);
	const tree = (0, import_react.useMemo)(() => catalogTree(concepts), [concepts]);
	const byType = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const c of Object.values(concepts)) m.set(c.type, (m.get(c.type) ?? 0) + 1);
		return [...m.entries()].sort((a, b) => b[1] - a[1]);
	}, [concepts]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-5xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold text-fg",
						children: bundle?.name ?? "Workspace"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg-muted mt-1",
						children: bundle?.sourceUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: bundle.sourceUrl,
							className: "text-primary hover:underline",
							target: "_blank",
							rel: "noreferrer",
							children: bundle.sourceUrl
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Source: ", bundle?.source ?? "—"] })
					})] }), validation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "badge",
								children: [validation.concept_count, " concepts"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "badge",
								children: [validation.edge_count, " edges"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `badge ${validation.error_count ? "badge-danger" : "badge-success"}`,
								children: validation.error_count ? `${validation.error_count} errors` : "valid"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: byType.map(([type, n]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "badge",
						children: [
							type,
							" · ",
							n
						]
					}, type))
				}),
				graphData && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel-card space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-sm font-semibold text-fg",
						children: ["Focus: ", graphData.root]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraphCanvas, {
						nodes: graphData.nodes,
						edges: graphData.edges,
						root: graphData.root,
						onSelect: (p) => {
							selectPath(p);
							setView("editor");
						},
						height: 300
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3",
					children: Object.entries(tree).map(([dir, list]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold uppercase tracking-wider text-fg-subtle mb-2",
							children: dir
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1",
							children: list.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: `w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-bg-subtle ${selectedPath === c.path ? "bg-primary-muted text-primary" : "text-fg-muted"}`,
								onClick: () => {
									selectPath(c.path);
									setView("editor");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-medium",
									children: c.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[10px] opacity-70 font-mono truncate",
									children: c.path
								})]
							}) }, c.path))
						})]
					}, dir))
				})
			]
		})
	});
}
function OpenBundleDialog() {
	const open = useOkfStore((s) => s.openDialog);
	const setOpen = useOkfStore((s) => s.setOpenDialog);
	const loadSample = useOkfStore((s) => s.loadSample);
	const loadGithub = useOkfStore((s) => s.loadGithub);
	const loadUpload = useOkfStore((s) => s.loadUpload);
	const scaffoldNew = useOkfStore((s) => s.scaffoldNew);
	const loading = useOkfStore((s) => s.loading);
	const error = useOkfStore((s) => s.error);
	const [github, setGithub] = (0, import_react.useState)("SpillwaveSolutions/okf-plugin/sample-okf");
	const [name, setName] = (0, import_react.useState)("my-okf");
	const fileRef = (0, import_react.useRef)(null);
	const dirRef = (0, import_react.useRef)(null);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": "Open OKF repository",
		onClick: (e) => {
			if (e.target === e.currentTarget) setOpen(false);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-xl border border-border bg-bg-elevated shadow-lg overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-b border-border px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-fg",
					children: "Open OKF repository"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-fg-muted mt-0.5",
					children: "Sample, GitHub, local markdown folder, or scaffold"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-ghost btn-icon",
					onClick: () => setOpen(false),
					"aria-label": "Close",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 space-y-4 max-h-[70dvh] overflow-y-auto",
				children: [
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "panel-card w-full text-left hover:border-primary/50 transition-colors",
						onClick: () => void loadSample(),
						disabled: loading,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-md bg-primary-muted p-2 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium text-fg",
								children: "Sample: okf-plugin / sample-okf"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-fg-muted mt-1",
								children: "Self-describing dual knowledge + agent graph from the plugin"
							})] })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-medium text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "size-4 text-fg-muted" }), "GitHub repo"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input",
								value: github,
								onChange: (e) => setGithub(e.target.value),
								placeholder: "owner/repo or owner/repo/path",
								"aria-label": "GitHub repository"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-secondary w-full",
								disabled: loading || !github.trim(),
								onClick: () => void loadGithub(github.trim()),
								children: "Load from GitHub"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-fg-subtle",
								children: "Public repos only. Prefer paths with index.md (e.g. sample-okf)."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-medium text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "size-4 text-fg-muted" }), "Local folder / files"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "btn btn-secondary",
									onClick: () => dirRef.current?.click(),
									disabled: loading,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Choose folder"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-secondary",
									onClick: () => fileRef.current?.click(),
									disabled: loading,
									children: "Choose .md files"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: ".md,text/markdown",
								multiple: true,
								className: "hidden",
								onChange: (e) => {
									if (e.target.files?.length) loadUpload(e.target.files);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: dirRef,
								type: "file",
								multiple: true,
								className: "hidden",
								onChange: (e) => {
									if (e.target.files?.length) loadUpload(e.target.files);
								},
								webkitdirectory: "",
								directory: ""
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel-card space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium text-fg",
								children: "Scaffold empty OKF"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field-input",
								value: name,
								onChange: (e) => setName(e.target.value),
								placeholder: "bundle name",
								"aria-label": "New bundle name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn btn-primary w-full",
								onClick: () => scaffoldNew(name.trim() || "my-okf"),
								disabled: loading,
								children: "Create scaffold"
							})
						]
					})
				]
			})]
		})
	});
}
function AppShell() {
	const init = useOkfStore((s) => s.init);
	const ready = useOkfStore((s) => s.ready);
	const loading = useOkfStore((s) => s.loading);
	const view = useOkfStore((s) => s.view);
	const toast = useOkfStore((s) => s.toast);
	const statusMessage = useOkfStore((s) => s.statusMessage);
	const error = useOkfStore((s) => s.error);
	const validation = useOkfStore((s) => s.validation);
	const selectedPath = useOkfStore((s) => s.selectedPath);
	const dirty = useOkfStore((s) => s.dirty);
	(0, import_react.useEffect)(() => {
		init();
	}, [init]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "app-main",
				children: [!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 flex items-center justify-center text-sm text-fg-muted",
					children: "Loading workspace…"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					view === "learn" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnPanel, {}),
					view === "explorer" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExplorerPanel, {}),
					view === "editor" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorPane, {}),
					view === "search" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchPanel, {}),
					view === "classify" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassifyPanel, {}),
					view === "deepagent" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeepAgentPanel, {}),
					view === "integrations" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntegrationsPanel, {})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "status-bar",
					role: "status",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: statusMessage ?? "OKF Motion" }),
						selectedPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono truncate max-w-[40%]",
							children: [selectedPath, dirty ? " *" : ""]
						}),
						validation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-auto",
							children: [
								validation.concept_count,
								" concepts · ",
								validation.edge_count,
								" ",
								"edges",
								validation.error_count ? ` · ${validation.error_count} errors` : ""
							]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-danger truncate max-w-[30%]",
							children: error
						}),
						loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Working…" })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenBundleDialog, {}),
			toast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "toast",
				role: "status",
				children: toast
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
