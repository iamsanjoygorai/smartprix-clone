import { Router } from "express";

import {
  getPublicNews,
  getPublicNewsBySlug,
} from "../controllers/news.controller";

const router = Router();

router.get("/", getPublicNews);
router.get("/:slug", getPublicNewsBySlug);

export default router;