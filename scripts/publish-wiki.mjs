#!/usr/bin/env node
/**
 * Publish the worklog IA manifest to the GitHub wiki.
 *
 * Three things the manifest does not describe, all handled here:
 *
 * 1. Frontmatter is stripped in the wiki copy only. Gollum (GitHub's wiki
 *    renderer) prints YAML frontmatter as raw text, so every page would open
 *    with a `---` block. The docs/ sources keep theirs — that is the
 *    machine-readable source of truth.
 *
 * 2. Wireframe PNGs are copied to the wiki root. The wiki namespace is flat,
 *    so `![](ui-editor.png)` only resolves if the image sits beside the page.
 *    PNG rather than SVG: GitHub serves raw SVG as text/plain, so it would not
 *    render. The .puml file is the diffable artifact; the render only has to
 *    be viewable.
 *
 * 3. Living UI specs get their banner corrected. worklog's ia.is_frozen()
 *    treats every design doc except current_design_doc.md as a frozen dated
 *    artifact, so docs/designs/ui-*.md are handed a status-report banner
 *    ("Reports freeze once published") and frozen:true, which would make
 *    wiki-publish refuse to republish after an edit. These specs are living.
 *    Overriding here rather than patching bin/ia_render.py, because bin/ is
 *    re-copied on every `worklog init` upgrade.
 *
 * Usage: node scripts/publish-wiki.mjs [--dry-run]
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKOUT = join(ROOT, ".work/wiki-checkout");
const MANIFEST = join(ROOT, "docs/.index/publish-manifest.json");
const LEDGER = join(ROOT, ".work/published.json");
const WIREFRAMES = join(ROOT, "docs/designs/wireframes");
const DRY = process.argv.includes("--dry-run");

const LIVING_SPEC_BANNER =
  "> **Living spec** — edited in place; the `git_hash` in the source " +
  "frontmatter records the commit it was last drawn against.";

const sh = (cmd, args, cwd = ROOT) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8" }).trim();

const stripFrontmatter = (t) => t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
const hash = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);

// A living spec: doc_type design, but authored by hand and edited in place.
const isLivingSpec = (p) => (p.wiki_key ?? "").startsWith("design/ui-");

function originWikiUrl() {
  const origin = sh("git", ["remote", "get-url", "origin"]);
  return origin.replace(/\.git$/, "") + ".wiki.git";
}

function syncCheckout() {
  if (existsSync(join(CHECKOUT, ".git"))) {
    // The checkout is a cache; pages may have been edited in the web UI.
    sh("git", ["pull", "--quiet", "--ff-only"], CHECKOUT);
  } else {
    rmSync(CHECKOUT, { recursive: true, force: true });
    mkdirSync(dirname(CHECKOUT), { recursive: true });
    sh("git", ["clone", "--quiet", originWikiUrl(), CHECKOUT]);
  }
}

function main() {
  if (!existsSync(MANIFEST)) {
    console.error("No publish manifest. Run: worklog ia-render");
    process.exit(1);
  }
  syncCheckout();

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const ledger = existsSync(LEDGER)
    ? JSON.parse(readFileSync(LEDGER, "utf8"))
    : {};
  const base =
    sh("git", ["remote", "get-url", "origin"]).replace(/\.git$/, "") + "/wiki/";

  const written = [];
  for (const page of manifest.pages) {
    const src = join(ROOT, page.source);
    if (!existsSync(src)) {
      console.warn(`skip (missing): ${page.source}`);
      continue;
    }
    const raw = readFileSync(src);
    let body = stripFrontmatter(raw.toString("utf8"));

    const living = isLivingSpec(page);
    const banner = living ? LIVING_SPEC_BANNER : page.banner;
    if (page.render === "doc+banner" && banner) body = `${banner}\n\n${body}`;

    const name = page.wiki_key === "sidebar" ? "_Sidebar" : page.page_name;
    if (!DRY) writeFileSync(join(CHECKOUT, `${name}.md`), body);

    ledger[page.wiki_key] = {
      source: page.source,
      url: base + name,
      page_id: name,
      source_hash: hash(raw),
      render_hash: page.render_hash,
      // Living specs are never frozen regardless of what the manifest says.
      frozen: living ? false : Boolean(page.frozen),
    };
    written.push(`${name}  <- ${page.source}${living ? "  (living spec)" : ""}`);
  }

  let images = 0;
  if (existsSync(WIREFRAMES)) {
    for (const f of readdirSync(WIREFRAMES).filter((f) => f.endsWith(".png"))) {
      if (!DRY) copyFileSync(join(WIREFRAMES, f), join(CHECKOUT, f));
      images++;
    }
  }

  console.log(written.map((w) => `  ${w}`).join("\n"));
  console.log(`${written.length} page(s), ${images} wireframe image(s)`);
  if (DRY) return console.log("--dry-run: nothing written or pushed");

  const dirty = sh("git", ["status", "--porcelain"], CHECKOUT);
  if (!dirty) return console.log("wiki already up to date");

  sh("git", ["add", "-A"], CHECKOUT);
  sh("git", ["commit", "--quiet", "-m", "Publish docs from worklog manifest"], CHECKOUT);
  sh("git", ["push", "--quiet", "origin", "master"], CHECKOUT);
  const rev = sh("git", ["rev-parse", "HEAD"], CHECKOUT);
  for (const k of Object.keys(ledger)) if (ledger[k].rev !== rev) ledger[k].rev = rev;
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n");
  console.log(`pushed wiki ${rev.slice(0, 8)}; ledger updated`);
}

main();
