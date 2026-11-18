import { Router } from "express";
import { asyncHandler } from "../lib/error";
import {
  FOCUS_LIST_TAG,
  findFocusArea,
  listFocusAreas,
} from "../lib/focus";
import { logDatabaseError } from "../lib/prisma";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    try {
      const body = await listFocusAreas();

      res.set({
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Focus-Tag": FOCUS_LIST_TAG,
        "X-Focus-Source": body.source || "database",
      });
      res.json(body);
    } catch (error) {
      logDatabaseError("focus list GET", error);
      res.status(503).json({ error: "Database unavailable" });
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const raw = req.params.id;

    try {
      const area = await findFocusArea(raw);
      if (!area) {
        res.status(404).json({ error: "Focus area not found" });
        return;
      }

      res.json({ area });
    } catch (error) {
      logDatabaseError(`focus detail GET:${raw}`, error);
      res.status(503).json({ error: "Database unavailable" });
    }
  })
);

export default router;
