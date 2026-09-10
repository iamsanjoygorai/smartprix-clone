import { Request, Response } from "express";
import {
  getSearchSuggestions,
  recordSearchQuery,
} from "../services/search.service";

/* =========================================================
   SEARCH SUGGESTIONS
========================================================= */

export const searchSuggestions = async (
  req: Request,
  res: Response
) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    /*
     * Don't perform database searches for very short input.
     */
    if (query.length < 1) {
      return res.json({
        success: true,
        data: {
          products: [],
          brands: [],
          categories: [],
          popular: [],
        },
      });
    }

    const suggestions = await getSearchSuggestions(query);

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error(
      "SEARCH SUGGESTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load search suggestions",
    });
  }
};

export const recordSearch = async (
  req: Request,
  res: Response,
) => {
  try {
    const query = String(req.body?.query ?? "");

    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    await recordSearchQuery(query);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Record search error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to record search",
    });
  }
};