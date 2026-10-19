import http from "node:http";
import https from "node:https";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};
export function createFrontendServer({
  root = path.resolve("out"),
  backend = process.env.BACKEND_URL || "http://127.0.0.1:4000",
  origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  allowedHosts = (
    process.env.FRONTEND_HOSTS || "localhost,127.0.0.1,[::1]"
  ).split(","),
  fallback = null,
  forwardHeaders = process.env.BACKEND_FORWARD_HEADERS === "true",
} = {}) {
  root = path.resolve(root);
  const target = new URL(backend);
  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    target.pathname !== "/"
  )
    throw Error("BACKEND_URL must be a plain HTTP(S) origin");
  return http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    try {
      const base = new URL("http://" + req.headers.host);
      if (!allowedHosts.includes(base.hostname)) {
        res.writeHead(400).end("Invalid host");
        return;
      }
      const url = new URL(req.url, base);
      if (url.pathname.startsWith("/api/")) {
        if (!["GET", "POST", "PATCH", "OPTIONS"].includes(req.method)) {
          res.writeHead(405).end();
          return;
        }
        if (req.headers.origin && req.headers.origin !== origin) {
          res.writeHead(403).end("Untrusted origin");
          return;
        }
        if (
          ["POST", "PATCH"].includes(req.method) &&
          req.headers.origin !== origin
        ) {
          res.writeHead(403).end("Trusted Origin required");
          return;
        }
        if (Number(req.headers["content-length"] || 0) > 6 * 1024 * 1024) {
          res.writeHead(413).end();
          return;
        }
        const headers = {};
        if (forwardHeaders) {
          headers["x-forwarded-proto"] = new URL(origin).protocol.replace(
            ":",
            "",
          );
          headers["x-forwarded-for"] = req.socket.remoteAddress;
        }
        for (const k of [
          "content-type",
          "content-length",
          "authorization",
          "cookie",
          "origin",
          "idempotency-key",
          "x-document-name",
          "x-document-kind",
        ])
          if (req.headers[k]) headers[k] = req.headers[k];
        const transport = target.protocol === "https:" ? https : http;
        const upstream = transport.request(
          new URL(url.pathname + url.search, target),
          { method: req.method, headers, timeout: 15000 },
          (reply) => {
            res.statusCode = reply.statusCode;
            for (const key of [
              "content-type",
              "set-cookie",
              "content-disposition",
              "x-request-id",
              "retry-after",
              "cache-control",
              "ratelimit",
              "ratelimit-policy",
            ])
              if (reply.headers[key]) res.setHeader(key, reply.headers[key]);
            reply.pipe(res);
            reply.on("error", () => res.destroy());
          },
        );
        upstream.on("timeout", () =>
          upstream.destroy(Error("Backend timeout")),
        );
        upstream.on("error", () => {
          if (!res.headersSent) {
            res
              .writeHead(503, {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              })
              .end(
                JSON.stringify({
                  error:
                    "Backend unavailable. Start your trading backend on port 4000.",
                }),
              );
          } else res.destroy();
        });
        let bytes = 0;
        req.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 6 * 1024 * 1024) {
            upstream.destroy();
            if (!res.headersSent) res.writeHead(413).end();
          }
        });
        req.on("aborted", () => upstream.destroy());
        req.pipe(upstream);
        return;
      }
      if (fallback) return await fallback(req, res);
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405).end();
        return;
      }
      const pathname = decodeURIComponent(url.pathname);
      let file = path.resolve(root, "." + pathname);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      const data = await readFile(file);
      const type = types[path.extname(file)] || "application/octet-stream";
      if (type.startsWith("text/html")) {
        const scripts = [
          ...data.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),
        ].map(
          (m) =>
            `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`,
        );
        const connect = process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
          ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
          : "";
        res.setHeader(
          "Content-Security-Policy",
          `default-src 'self'; script-src 'self' ${scripts.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ${connect}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
        );
      }
      res
        .writeHead(200, {
          "Content-Type": type,
          "Cache-Control": file.includes(path.sep + "_next" + path.sep)
            ? "public,max-age=31536000,immutable"
            : "no-cache",
        })
        .end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 3000);
  createFrontendServer().listen(port, "127.0.0.1", () =>
    console.log(`Frontend connected proxy: http://localhost:${port}`),
  );
}
