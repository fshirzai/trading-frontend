import test from "node:test";
import http from "node:http";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFrontendServer } from "../scripts/serve.mjs";
const listen = async (s) => {
  s.listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  return `http://127.0.0.1:${s.address().port}`;
};
test("static frontend applies hash CSP and blocks host/origin abuse", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "trading-ui-"));
  await writeFile(
    path.join(root, "index.html"),
    '<html><script>console.log("safe")</script></html>',
  );
  const s = createFrontendServer({ root }),
    base = await listen(s);
  try {
    const r = await fetch(base);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-security-policy"), /sha256-/);
    assert.match(
      r.headers.get("content-security-policy"),
      /frame-ancestors 'none'/,
    );
    assert.equal(r.headers.get("referrer-policy"), "no-referrer");
    assert.equal(
      await new Promise((resolve, reject) => {
        http
          .get(base, { headers: { Host: "evil.example" } }, (r) => {
            r.resume();
            resolve(r.statusCode);
          })
          .on("error", reject);
      }),
      400,
    );
    assert.equal(
      (
        await fetch(base + "/api/auth/login", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (await fetch(base + "/api/auth/login", { method: "POST" })).status,
      403,
    );
  } finally {
    await new Promise((r) => s.close(r));
    await rm(root, { recursive: true, force: true });
  }
});
test("invalid backend configuration cannot turn the proxy into an arbitrary URL forwarder", () => {
  for (const backend of [
    "file:///etc/passwd",
    "http://user:pass@localhost:4000",
    "http://localhost:4000/path",
  ])
    assert.throws(() => createFrontendServer({ backend }));
});
