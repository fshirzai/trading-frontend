import test from "node:test";
import { createFrontendServer } from "../scripts/serve.mjs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { createApi } from "../src/shared/api.js";
import { formBody } from "../src/shared/format.js";
import { readFile } from "node:fs/promises";
const backend = path.resolve(process.env.BACKEND_DIR || "../trading-backend");
const require = createRequire(path.join(backend, "package.json"));
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const load = (relative) => import(pathToFileURL(path.join(backend, relative)));
const { createApp } = await load("src/app.js"),
  { readConfig } = await load("src/config.js"),
  { seedDemo } = await load("src/database/seed.service.js"),
  models = await load("src/models.js");
const contracts = JSON.parse(
  await readFile(new URL("../src/shared/contracts.json", import.meta.url)),
);
test("frontend API client trades against the real seeded backend over HTTP", async () => {
  const repl = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      args: process.platform === "win32" ? [] : ["--nounixsocket"],
    },
  });
  let server, frontend;
  try {
    await mongoose.connect(repl.getUri());
    for (const m of Object.values(models)) await m.init();
    const config = readConfig({
      NODE_ENV: "test",
      MONGODB_URI: repl.getUri(),
      JWT_SECRET: randomBytes(64).toString("hex"),
      WEB_ORIGINS: "http://localhost:3000",
    });
    const password = "Frontend-Integration-94!",
      ids = await seedDemo(config, password);
    const app = await createApp(config);
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const backendOrigin = `http://127.0.0.1:${server.address().port}`;
    frontend = createFrontendServer({ backend: backendOrigin });
    frontend.listen(0, "127.0.0.1");
    await new Promise((r) => frontend.once("listening", r));
    const base = `http://127.0.0.1:${frontend.address().port}/api`;
    function client() {
      let cookie = "";
      return createApi({
        base,
        fetcher: async (url, opts) => {
          const res = await fetch(url, {
            ...opts,
            headers: {
              ...opts.headers,
              Origin: "http://localhost:3000",
              ...(cookie ? { Cookie: cookie } : {}),
            },
          });
          const set = res.headers.get("set-cookie");
          if (set) cookie = set.split(";")[0];
          return res;
        },
      });
    }
    const customer = client(),
      seller = client(),
      admin = client();
    for (const [api, role] of [
      [customer, "customer"],
      [seller, "seller"],
      [admin, "admin"],
    ]) {
      const r = await api.request("/auth/login", {
        method: "POST",
        body: { email: role + "@demo.test", password },
      });
      api.setToken(r.accessToken);
    }
    assert.equal((await customer.request("/health/ready")).status, "ready");
    assert.equal((await customer.restore()).role, "customer");
    assert.ok((await customer.request("/catalog")).items.length > 0);
    await assert.rejects(
      customer.request("/records/journal"),
      (e) => e.status === 403,
    );
    const inquiry = await customer.request("/inquiries", {
      method: "POST",
      body: formBody(contracts["POST /inquiries"], {
        product: ids.product,
        quantity: "10",
        source: "website",
        destination: "Torkham",
      }),
      key: randomUUID(),
    });
    const order = await seller.request(`/inquiries/${inquiry._id}/proforma`, {
      method: "POST",
      body: formBody(contracts["POST /inquiries/{id}/proforma"], {
        productTotal: "1000",
        deliveryFees: "0",
        border: "Torkham",
        splitIncluded: true,
      }),
      key: randomUUID(),
    });
    await customer.request(`/orders/${order._id}/accept`, {
      method: "POST",
      body: {},
      key: randomUUID(),
    });
    const payment = await customer.request(`/orders/${order._id}/payments`, {
      method: "POST",
      body: {
        amount: 500,
        method: "TT",
        reference: "frontend-integration-" + randomUUID(),
      },
      key: randomUUID(),
    });
    const key = randomUUID(),
      verify = { method: "POST", body: { bankFundsConfirmed: true }, key };
    await admin.request(`/payments/${payment._id}/verify`, verify);
    await admin.request(`/payments/${payment._id}/verify`, verify);
    const detail = await customer.request(`/orders/${order._id}`);
    assert.equal(detail.order.paidCents, 50000);
    assert.equal(detail.payments.length, 1);
    assert.ok(
      (
        await customer.request(`/orders/${order._id}/documents/proforma.pdf`, {
          blob: true,
        })
      ).size > 0,
    );
    const shipment = await seller.request(`/orders/${order._id}/shipments`, {
      method: "POST",
      body: {
        quantity: 10,
        warehouse: ids.warehouse,
        driver: "Test driver",
        vehicle: "Test vehicle",
      },
      key: randomUUID(),
    });
    const second = await customer.request(`/orders/${order._id}/payments`, {
      method: "POST",
      body: { amount: 500, method: "TT", reference: "balance-" + randomUUID() },
      key: randomUUID(),
    });
    await admin.request(`/payments/${second._id}/verify`, {
      method: "POST",
      body: { bankFundsConfirmed: true },
      key: randomUUID(),
    });
    await seller.request(`/shipments/${shipment._id}/handover`, {
      method: "POST",
      body: { recipient: "Test customer", proof: "Test proof" },
      key: randomUUID(),
    });
    const returned = await customer.request(`/orders/${order._id}/returns`, {
      method: "POST",
      body: { reason: "Return within agreed window" },
      key: randomUUID(),
    });
    assert.equal(returned.refundCents, 75000);
    await admin.request(`/returns/${returned._id}/complete`, {
      method: "POST",
      body: {
        inspectionPassed: true,
        refundConfirmed: true,
        returnedQuantity: 10,
        warehouse: ids.warehouse,
        note: "Condition matches delivery",
      },
      key: randomUUID(),
    });
    const final = await customer.request(`/orders/${order._id}`);
    assert.equal(final.order.status, "Refunded");
    assert.equal(final.order.refundedCents, 75000);
    const summary = await customer.request("/workspace/summary");
    assert.equal(summary.totals.orders, 1);
    assert.equal(summary.totals.refundedCents, 75000);
    const users = await admin.request("/users");
    assert.equal(users.items.length, 5);
    assert.equal(users.items[0].mfaSecret, undefined);
    assert.equal(
      (await customer.request(`/orders/${order._id}/documents`)).items.length,
      0,
    );
    await customer.request("/auth/logout", { method: "POST", body: {} });
    customer.clear();
    await assert.rejects(customer.restore(), (e) => e.status === 401);
  } finally {
    if (frontend) await new Promise((r) => frontend.close(r));
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    await repl.stop();
  }
});
