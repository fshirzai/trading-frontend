import test from "node:test";
import assert from "node:assert/strict";
import { createApi, safeCheckoutUrl } from "../src/shared/api.js";
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("financial requests preserve body and retry key and include credentials", async () => {
  let call;
  const api = createApi({
    base: "http://localhost:4000/api",
    fetcher: async (...args) => {
      call = args;
      return response({ ok: true });
    },
  });
  api.setToken("access");
  await api.request("/payments/123/verify", {
    method: "POST",
    body: { bankFundsConfirmed: true },
    key: "fixed-key",
  });
  assert.equal(call[0], "http://localhost:4000/api/payments/123/verify");
  assert.equal(call[1].headers.Authorization, "Bearer access");
  assert.equal(call[1].headers["Idempotency-Key"], "fixed-key");
  assert.equal(call[1].credentials, "include");
  assert.deepEqual(JSON.parse(call[1].body), { bankFundsConfirmed: true });
});
test("parallel expired requests perform one refresh and retain original idempotency keys", async () => {
  let refresh = 0;
  const writes = [];
  const api = createApi({
    fetcher: async (path, opts) => {
      if (path.endsWith("/auth/refresh")) {
        refresh++;
        await new Promise((r) => setTimeout(r, 15));
        return response({ accessToken: "new" });
      }
      writes.push(opts);
      return opts.headers.Authorization === "Bearer old"
        ? response({ error: "expired" }, 401)
        : response({ ok: true });
    },
  });
  api.setToken("old");
  await Promise.all([
    api.request("/a", { method: "POST", body: { amount: 1 }, key: "a" }),
    api.request("/b", { method: "POST", body: { amount: 2 }, key: "b" }),
  ]);
  assert.equal(refresh, 1);
  assert.deepEqual(
    writes.map((w) => w.headers["Idempotency-Key"]),
    ["a", "b", "a", "b"],
  );
});
test("concurrent session restoration rotates refresh cookie once", async () => {
  let n = 0;
  const api = createApi({
    fetcher: async (path) => {
      if (path.endsWith("/auth/refresh")) {
        n++;
        await new Promise((r) => setTimeout(r, 10));
        return response({ accessToken: "restored" });
      }
      return response({ role: "customer" });
    },
  });
  await Promise.all([api.restore(), api.restore()]);
  assert.equal(n, 1);
});
test("failed refresh clears access and notifies the session owner", async () => {
  let expired = 0;
  const api = createApi({
    fetcher: async () => response({ error: "Invalid session" }, 401),
    onExpired: () => expired++,
  });
  api.setToken("old");
  await assert.rejects(api.request("/orders"), (e) => e.status === 401);
  assert.equal(expired, 1);
});
test("backend validation errors keep request references", async () => {
  const api = createApi({
    fetcher: async () =>
      response({ error: "Deposit required", requestId: "abc" }, 422),
  });
  await assert.rejects(
    api.request("/orders"),
    (e) => e.message === "Deposit required" && e.requestId === "abc",
  );
});
test("network failure does not automatically repeat a write", async () => {
  let calls = 0;
  const api = createApi({
    fetcher: async () => {
      calls++;
      throw Error("offline");
    },
  });
  await assert.rejects(
    api.request("/orders", { method: "POST", body: {}, key: "retry" }),
  );
  assert.equal(calls, 1);
});
test("checkout redirect accepts only HTTPS Stripe checkout", () => {
  assert.ok(safeCheckoutUrl("https://checkout.stripe.com/c/pay/test"));
  for (const x of [
    "javascript:alert(1)",
    "https://checkout.stripe.com.evil.test",
    "http://checkout.stripe.com/c/pay/test",
    "/evil",
  ])
    assert.equal(safeCheckoutUrl(x), null);
});
test("clearing a session while restoration is pending cannot restore the old token", async () => {
  let finish;
  const api = createApi({
    fetcher: async (path) =>
      path.endsWith("/auth/refresh")
        ? new Promise((r) => {
            finish = r;
          })
        : response({ role: "customer" }),
  });
  const pending = api.restore();
  api.clear();
  finish(response({ accessToken: "old-session" }));
  await assert.rejects(pending, (e) => e.status === 401);
});
