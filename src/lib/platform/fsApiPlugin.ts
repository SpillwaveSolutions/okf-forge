/**
 * Vite dev middleware: /api/fs/* backed by fsCore + OKF_WORKSPACE.
 * Gives Playwright / web mode a real filesystem jail (Motion-style).
 */
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import {
  collectFiles,
  FsError,
  MARKDOWN_EXTENSIONS,
  readWorkspaceFile,
  toRelative,
  writeWorkspaceFile,
} from "./fsCore";

function defaultWorkspace(): string {
  return (
    process.env.OKF_WORKSPACE ||
    process.env.MOTION_WORKSPACE ||
    resolve(process.cwd(), "public/sample-okf")
  );
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function okfFsApiPlugin(): Plugin {
  return {
    name: "okf-fs-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? "";
        const pathOnly = rawUrl.split("?", 1)[0] ?? "";
        if (!pathOnly.startsWith("/api/fs")) {
          next();
          return;
        }

        const root = defaultWorkspace();
        const url = new URL(rawUrl, "http://127.0.0.1");

        try {
          if (pathOnly === "/api/fs/workspace" && req.method === "GET") {
            json(res, 200, { root });
            return;
          }

          if (pathOnly === "/api/fs/list" && req.method === "GET") {
            const sub = url.searchParams.get("path") || root;
            const absFiles = collectFiles(sub, MARKDOWN_EXTENSIONS);
            const files = absFiles.map((f) => {
              try {
                return toRelative(root, f);
              } catch {
                return f;
              }
            });
            json(res, 200, { files, root });
            return;
          }

          if (pathOnly === "/api/fs/read" && req.method === "GET") {
            const p = url.searchParams.get("path");
            if (!p) {
              json(res, 400, { error: "path required" });
              return;
            }
            const content = readWorkspaceFile(root, p);
            json(res, 200, { content, path: p });
            return;
          }

          if (pathOnly === "/api/fs/write" && req.method === "POST") {
            const body = JSON.parse(await readBody(req)) as {
              path?: string;
              content?: string;
            };
            if (!body.path || typeof body.content !== "string") {
              json(res, 400, { error: "path and content required" });
              return;
            }
            writeWorkspaceFile(root, body.path, body.content);
            json(res, 200, { ok: true, path: body.path });
            return;
          }

          json(res, 404, { error: "not found" });
        } catch (e) {
          if (e instanceof FsError) {
            const status = e.code === "denied" ? 403 : e.code === "not-found" ? 404 : 400;
            json(res, status, { error: e.message, code: e.code });
            return;
          }
          json(res, 500, {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      });
    },
  };
}
