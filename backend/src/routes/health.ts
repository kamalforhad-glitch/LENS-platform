import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "lens-backend",
    apiPrefix: "/api/v1",
    timestamp: new Date().toISOString(),
  });
});

export default router;
