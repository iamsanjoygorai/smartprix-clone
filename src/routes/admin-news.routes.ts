import { Router } from "express";

import {
  createNewsPost,
  deleteNewsPost,
  deleteNewsBulkPost,
  getAdminNews,
  getAdminNewsById,
  updateNewsPost,
} from "../controllers/news.controller";

const router = Router();

router.get("/news", getAdminNews);

router.post("/news", createNewsPost);

router.delete(
  "/news/bulk",
  deleteNewsBulkPost,
);

router.get(
  "/news/:id",
  getAdminNewsById,
);

router.put(
  "/news/:id",
  updateNewsPost,
);

router.delete(
  "/news/:id",
  deleteNewsPost,
);

export default router;