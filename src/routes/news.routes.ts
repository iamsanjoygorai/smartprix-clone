import { Router } from "express";

import {
  getPublicNews,
} from "../controllers/news.controller";

const router = Router();

router.get(
  "/:slug",
  getPublicNews,
);

export default router;