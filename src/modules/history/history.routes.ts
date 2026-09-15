import { Router } from "express";

import {
  getHistoryTimeline,
  getEntityHistory,
  getHistoryEvent,
  getHistoryVersion,
  getLatestHistoryVersion,
  getHistoryDiff,
} from "./history.controller";

const router = Router();

/* =========================================================
   TIMELINE
========================================================= */

router.get(
  "/",
  getHistoryTimeline,
);

/* =========================================================
   ENTITY HISTORY
========================================================= */

router.get(
  "/entity/:entityType/:entityId",
  getEntityHistory,
);

/* =========================================================
   EVENT
========================================================= */

router.get(
  "/event/:eventId",
  getHistoryEvent,
);

/* =========================================================
   VERSION
========================================================= */

router.get(
  "/version/:entityType/:entityId/:version",
  getHistoryVersion,
);

/* =========================================================
   LATEST VERSION
========================================================= */

router.get(
  "/latest/:entityType/:entityId",
  getLatestHistoryVersion,
);

/* =========================================================
   DIFF / COMPARE
========================================================= */

router.get(
  "/diff/:entityType/:entityId",
  getHistoryDiff,
);

export default router;