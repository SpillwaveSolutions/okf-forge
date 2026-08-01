/** Lightweight Markdown → safe HTML for preview (no external deps). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

export function markdownToHtml(md: string): string {
  // Strip frontmatter for preview body
  const text = md.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  const lines = text.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];
  let inList: "ul" | "ol" | null = null;
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

  const inline = (s: string): string => {
    let t = escapeHtml(s);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
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
        out.push(
          `<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
        );
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
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
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
    } else {
      closeTable();
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      closeList();
      out.push("<hr />");
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      closeList();
      const level = h[1]!.length;
      out.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
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
      out.push(`<li>${inline(ul[1]!)}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (inList !== "ol") {
        closeList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(ol[1]!)}</li>`);
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
  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }

  return out.join("\n");
}
