const backend = process.env.BACKEND_URL || "http://127.0.0.1:4000";
const url = new URL(backend);
if (
  !["http:", "https:"].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/"
)
  throw Error(
    "BACKEND_URL must be an HTTP(S) origin without credentials or a path",
  );
const dev = process.env.NODE_ENV === "development";
export default {
  output: dev ? undefined : "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};
