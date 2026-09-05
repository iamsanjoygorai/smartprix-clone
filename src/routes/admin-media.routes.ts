import { Router } from "express";

import { uploadMediaFile } from "../controllers/media.controller";
import { uploadMedia } from "../middlewares/media-upload.middleware";

const router = Router();

router.post(
  "/upload",
  uploadMedia.single("file"),
  uploadMediaFile,
);

export default router;