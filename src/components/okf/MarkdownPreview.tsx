import { markdownToHtml } from "@/lib/okf/markdown";

export function MarkdownPreview({ source, className = "" }: { source: string; className?: string }) {
  const html = markdownToHtml(source);
  return (
    <div
      className={`md-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
