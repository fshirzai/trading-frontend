import test from "node:test";
import assert from "node:assert/strict";
import messages from "../src/shared/locales/messages.json" with { type: "json" };
import { allowedModules } from "../src/modules/registry.js";
test("all three languages have the same central dictionary keys and useful home copy", () => {
  const keys = Object.keys(messages.en).sort();
  assert.ok(keys.length > 500);
  for (const lang of ["ps", "fa"]) {
    assert.deepEqual(Object.keys(messages[lang]).sort(), keys);
    for (const key of keys)
      assert.ok(messages[lang][key]?.trim(), lang + ": " + key);
  }
  assert.equal(
    messages.ps["Agricultural products for your business."],
    "ستاسو د سوداګرۍ لپاره کرنیز محصولات.",
  );
  assert.equal(
    messages.fa["Agricultural products for your business."],
    "محصولات زراعتی برای تجارت شما.",
  );
  assert.equal(messages.ps.Orders, "فرمایشونه");
});
test("five roles use scoped modules and only administrator sees system settings", () => {
  for (const role of [
    "admin",
    "manager",
    "seller",
    "procurement",
    "customer",
  ]) {
    const modules = allowedModules(role).map((m) => m.key);
    assert.ok(modules.includes("dashboard"));
    assert.equal(modules.includes("systemSettings"), role === "admin");
  }
  const customer = allowedModules("customer").map((m) => m.key);
  for (const key of ["users", "accounting", "procurement", "audit"])
    assert.ok(!customer.includes(key));
});
