import cors from "cors";
import express from "express";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./lib/error";
import focusRoutes from "./routes/focus";
import healthRoutes from "./routes/health";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/focus", focusRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
