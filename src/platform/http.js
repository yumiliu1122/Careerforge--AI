import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { config } from "./config.js";
import { toPublicError } from "./util.js";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

export function createServer(routes) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      if (url.pathname.startsWith("/api/")) {
        const route = routes.find((candidate) => {
          const match = candidate.pattern.exec(url.pathname);
          return candidate.method === request.method && match;
        });

        if (!route) {
          sendJson(response, 404, { error: { message: "API route not found", code: "NOT_FOUND" } });
          return;
        }

        const match = route.pattern.exec(url.pathname);
        const body = await readJson(request);
        const result = await route.handler({
          request,
          query: Object.fromEntries(url.searchParams.entries()),
          body,
          params: match.groups || {}
        });
        sendJson(response, route.status || 200, { data: result });
        return;
      }

      await serveStatic(url.pathname, response);
    } catch (error) {
      sendJson(response, error.status || 500, { error: toPublicError(error) });
    }
  });
}

export function route(method, pattern, handler, status) {
  return { method, pattern, handler, status };
}

async function readJson(request) {
  if (!["POST", "PUT", "PATCH"].includes(request.method)) {
    return {};
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > config.maxRequestBytes) {
      const error = new Error(`请求体过大，请将单次上传控制在 ${Math.round(config.maxRequestBytes / 1024 / 1024)}MB 以内。`);
      error.status = 413;
      error.code = "REQUEST_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.status = 400;
    error.code = "BAD_JSON";
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(config.publicDir, safePath));

  if (!filePath.startsWith(config.publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    response.end(data);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    const fallback = await fs.readFile(path.join(config.publicDir, "index.html"));
    response.writeHead(200, { "Content-Type": contentTypes[".html"] });
    response.end(fallback);
  }
}
