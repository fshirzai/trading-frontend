import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { modules, allowedModules } from "../src/modules/registry.js";
import { formBody, money } from "../src/shared/format.js";
const contracts = JSON.parse(
  await readFile(new URL("../src/shared/contracts.json", import.meta.url)),
);
test("every configured action has an exact backend schema", () => {
  for (const m of modules)
    for (const a of [...(m.actions || []), ...(m.rowActions || [])])
      assert.ok(contracts[`${a.method} ${a.path}`], a.path);
});
test("customer and procurement navigation excludes financial administration", () => {
  const customer = allowedModules("customer").map((m) => m.key),
    procure = allowedModules("procurement").map((m) => m.key);
  assert.ok(customer.includes("sales"));
  for (const forbidden of [
    "payroll",
    "audit",
    "accounting",
    "users",
    "reconciliation",
  ]) {
    assert.ok(!customer.includes(forbidden));
    assert.ok(!procure.includes(forbidden));
  }
});
test("schema serialization converts zeroAmount unions into numbers", () => {
  const s = contracts["POST /records/product"];
  const r = formBody(s, { name: { en: "Beans" }, moq: "0", injected: "x" });
  assert.deepEqual(r, { name: { en: "Beans" }, moq: 0 });
});
test("journal lines serialize cents and ignore extra properties", () => {
  const body = formBody(contracts["POST /journals"], {
    memo: "test",
    lines: [
      { account: "Bank", debitCents: "1000", creditCents: "0", injected: "x" },
      { account: "Capital", debitCents: "0", creditCents: "1000" },
    ],
  });
  assert.equal(body.lines[0].debitCents, 1000);
  assert.equal(body.lines[0].injected, undefined);
});
test("missing mandatory fields fail before making API calls", () => {
  assert.throws(() => formBody(contracts["POST /inquiries"], {}), /required/);
});
test("USD formatting retains integer-cent precision", () => {
  assert.equal(money(750000), "$7,500.00");
});
