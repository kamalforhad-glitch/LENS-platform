import type { Server } from "http";
import { createApp } from "./app";
import { env } from "./lib/env";
import { disconnectPrisma } from "./lib/prisma";

const HOST = "0.0.0.0";

const app = createApp();
const server: Server = app.listen(env.port, HOST, () => {
  console.log(`[lens-backend] listening on http://${HOST}:${env.port}`);
});

server.on("error", (error) => {
  console.error("[lens-backend] failed to start:", error.message);
  process.exitCode = 1;
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[lens-backend] ${signal} received; shutting down`);

  server.close(async (error) => {
    try {
      await disconnectPrisma();
    } catch (disconnectError) {
      console.error(
        "[lens-backend] Prisma disconnect failed:",
        disconnectError instanceof Error ? disconnectError.message : "unknown error"
      );
    }

    if (error) {
      console.error("[lens-backend] HTTP close failed:", error.message);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
