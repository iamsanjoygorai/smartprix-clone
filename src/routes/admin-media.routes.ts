import { Router } from "express";

import { uploadMediaFile } from "../controllers/media.controller";

import { uploadMedia } from "../middlewares/media-upload.middleware";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

router.post(
  "/upload",
  requirePermission(PERMISSIONS.MEDIA_UPLOAD),
  uploadMedia.single("file"),
  uploadMediaFile,
);

export default router;