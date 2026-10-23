import test from "node:test";
import assert from "node:assert/strict";
import {
  canUseAction,
  returnEstimate,
  journalTotals,
} from "../src/shared/workflows.js";
import { validPreferences, resolveMode } from "../src/shared/preferences.js";
test("role and record state gate trading actions", () => {
  const accept = { path: "/orders/{id}/accept", roles: ["customer"] };
  assert.ok(
    canUseAction(accept, { status: "Awaiting acceptance" }, "customer"),
  );
  assert.ok(
    !canUseAction(
      accept,
      { status: "Deposit pending", acceptedAt: "date" },
      "customer",
    ),
  );
  assert.ok(
    !canUseAction(accept, { status: "Awaiting acceptance" }, "procurement"),
  );
  assert.ok(
    !canUseAction(
      { path: "/payments/{id}/verify" },
      { status: "Verified" },
      "admin",
    ),
  );
  assert.ok(!canUseAction({ path: "/users/{id}" }, { role: "admin" }, "admin"));
});
test("disabled card adapter is never advertised as usable checkout", () => {
  assert.ok(
    !canUseAction(
      { path: "/orders/{id}/checkout" },
      { acceptedAt: "date", totalCents: 10000, paidCents: 0 },
      "customer",
    ),
  );
  assert.ok(
    canUseAction(
      { path: "/orders/{id}/checkout" },
      { acceptedAt: "date", totalCents: 10000, paidCents: 0 },
      "customer",
      { cardEnabled: true },
    ),
  );
});
test("fully paid orders do not offer another card charge", () => {
  assert.equal(
    canUseAction(
      { path: "/orders/{id}/checkout" },
      { acceptedAt: "date", paidCents: 10000, totalCents: 10000 },
      "customer",
      { cardEnabled: true },
    ),
    false,
  );
});
test("return estimate retains 25% of total and uses the first split handover deadline", () => {
  const r = returnEstimate(
    { totalCents: 1000000, paidCents: 1000000, returnHours: 24 },
    [
      { handedOverAt: "2026-10-12T12:00:00Z" },
      { handedOverAt: "2026-10-13T12:00:00Z" },
    ],
  );
  assert.equal(r.refundCents, 750000);
  assert.equal(r.deadline, "2026-10-13T12:00:00.000Z");
});
test("themes validate persisted values and follow system appearance", () => {
  assert.equal(
    validPreferences({ mode: "malicious", color: "unknown" }).color,
    "emerald",
  );
  assert.equal(resolveMode("system", true), "dark");
  assert.equal(resolveMode("system", false), "light");
  assert.equal(
    journalTotals([
      { debitCents: "1000", creditCents: 0 },
      { debitCents: 0, creditCents: "1000" },
    ]).credit,
    1000,
  );
});
test("CSV exports escape spreadsheet formulas and retain numeric negative amounts", async () => {
  const { reportCsv } = await import("../src/shared/csv.js");
  const s = reportCsv([
    { account: "=cmd()", amountCents: -100, memo: 'a,"b"' },
  ]);
  assert.match(s, /'=cmd\(\)/);
  assert.match(s, /"-100"/);
  assert.match(s, /a,""b""/);
});
