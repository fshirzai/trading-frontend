import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
async function freePort() {
  const s = net.createServer();
  s.listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
test("npm development entry starts Next pages and forwards the same-origin API without untrusted proxy headers", async () => {
  let headers;
  const backend = http.createServer((req, res) => {
    headers = req.headers;
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify({ status: "ready" }));
  });
  backend.listen(0, "127.0.0.1");
  await new Promise((r) => backend.once("listening", r));
  const port = await freePort();
  const child = spawn(process.execPath, ["scripts/dev.mjs"], {
    env: {
      ...process.env,
      PORT: String(port),
      BACKEND_URL: `http://127.0.0.1:${backend.address().port}`,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (b) => {
    log += b;
  });
  child.stderr.on("data", (b) => {
    log += b;
  });
  try {
    await new Promise((resolve, reject) => {
      const started = Date.now(),
        timer = setInterval(() => {
          if (log.includes("Trading frontend:")) {
            clearInterval(timer);
            resolve();
          } else if (Date.now() - started > 45000 || child.exitCode !== null) {
            clearInterval(timer);
            reject(Error("Development server failed: " + log.slice(-1000)));
          }
        }, 50);
    });
    const api = await fetch(`http://127.0.0.1:${port}/api/health/ready`);
    assert.equal((await api.json()).status, "ready");
    assert.equal(headers["x-forwarded-for"], undefined);
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Shirzai/i);
    assert.match(html, /Agricultural products for your business./);
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) =>
      child.exitCode !== null ? r() : child.once("exit", r),
    );
    await new Promise((r) => backend.close(r));
  }
});
