"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function resolveFile(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${HOST}:${PORT}`).pathname);
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requested = path.join(PUBLIC_DIR, normalized);
  const candidate = requested.endsWith(path.sep) ? path.join(requested, "index.html") : requested;

  if (!candidate.startsWith(PUBLIC_DIR)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  const indexFile = path.join(candidate, "index.html");
  if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) return indexFile;

  return null;
}

if (!fs.existsSync(PUBLIC_DIR)) {
  console.error("[preview] Missing public directory. Run npm run build:production first.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(file);
  res.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": contentTypes.get(ext) || "application/octet-stream",
  });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[preview] Serving production output from ${PUBLIC_DIR}`);
  console.log(`[preview] Chinese: http://${HOST}:${PORT}/zh-CN/`);
  console.log(`[preview] English: http://${HOST}:${PORT}/en/`);
});
