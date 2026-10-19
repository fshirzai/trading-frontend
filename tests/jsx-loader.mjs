import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
export async function load(url, context, nextLoad) {
  if (url.endsWith(".jsx")) {
    const source = await readFile(new URL(url), "utf8");
    const compiled = await transform(source, {
      loader: "jsx",
      format: "esm",
      jsx: "automatic",
    });
    return { format: "module", source: compiled.code, shortCircuit: true };
  }
  if (url.endsWith(".json")) {
    return {
      format: "module",
      source: "export default " + (await readFile(new URL(url), "utf8")),
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
