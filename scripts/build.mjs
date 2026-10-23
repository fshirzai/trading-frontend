import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
// Generated output only: prevent an earlier route cache or static export from surviving a new build.
for (const name of [".next", "out"])
  await rm(new URL("../" + name + "/", import.meta.url), {
    recursive: true,
    force: true,
  });
const require = createRequire(import.meta.url);
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build", "--webpack"],
  { stdio: "inherit", env: process.env },
);
child.on("error", () => {
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
