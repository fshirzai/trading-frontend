import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("lockfile supports clean installs without external or required platform packages", async () => {
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url)));
  for (const [path, entry] of Object.entries(lock.packages)) {
    assert.ok(path === "" || path.startsWith("node_modules/"), path);
    assert.ok(!entry.link && !entry.extraneous, path);
    if (entry.os || entry.cpu) assert.equal(entry.optional, true, path);
  }
  assert.ok(lock.packages["node_modules/@next/swc-win32-x64-msvc"]);
  assert.ok(lock.packages["node_modules/@img/sharp-win32-x64"]);
});
