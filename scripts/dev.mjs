import { createFrontendServer } from "./serve.mjs";
process.env.NODE_ENV = "development";
const { default: next } = await import("next");
const port = Number(process.env.PORT || 3000),
  hostname = "127.0.0.1";
const app = next({ dev: true, webpack: true, hostname, port });
await app.prepare();
const origin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;
const server = createFrontendServer({
  origin,
  fallback: app.getRequestHandler(),
});
server.on("upgrade", (req, socket, head) => {
  if (req.headers.origin && req.headers.origin !== origin) {
    socket.destroy();
    return;
  }
  app.getUpgradeHandler()(req, socket, head);
});
server.listen(port, hostname, () =>
  console.log(`Trading frontend: http://localhost:${port}`),
);
async function stop() {
  server.close();
  await app.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
