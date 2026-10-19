const onVercel = process.env.VERCEL === "1";
const development = process.env.NODE_ENV === "development";

const backend = (
  process.env.BACKEND_URL || "http://127.0.0.1:4000"
).replace(/\/$/, "");

const url = new URL(backend);

if (
  !["http:", "https:"].includes(url.protocol) ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  url.pathname !== "/"
) {
  throw new Error("BACKEND_URL must be an HTTP(S) origin without a path");
}

if (onVercel && url.protocol !== "https:") {
  throw new Error("Vercel requires a public HTTPS BACKEND_URL");
}

export default {
  output: development || onVercel ? undefined : "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },

  ...(onVercel
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${backend}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};