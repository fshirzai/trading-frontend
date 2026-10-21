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
const onVercel = process.env.VERCEL === "1";
if (onVercel && url.protocol !== "https:")
  throw Error("Vercel requires a public HTTPS BACKEND_URL");
export default {
  output: dev || onVercel ? undefined : "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  ...(onVercel
    ? {
        async rewrites() {
          return [
            { source: "/api/:path*", destination: `${url.origin}/api/:path*` },
          ];
        },
      }
    : {}),
};
