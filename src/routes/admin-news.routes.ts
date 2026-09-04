import { Router } from "express";

import {
  createNewsPost,
  deleteNewsPost,
  getAdminNews,
  getAdminNewsById,
  updateNewsPost,
} from "../controllers/news.controller";

const router = Router();

router.get("/news", getAdminNews);

router.post("/news", createNewsPost);

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