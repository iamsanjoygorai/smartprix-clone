import { Router } from "express";
import { searchSuggestions, recordSearch } from "../controllers/search.controller";


const router = Router();

/*
 * GET /api/search/suggestions?q=samsung
 */
router.get(
  "/suggestions",
  searchSuggestions
);


router.post(
  "/search/record",
  recordSearch,
);


export default router;